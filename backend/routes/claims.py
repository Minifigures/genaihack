import uuid
from fastapi import APIRouter, UploadFile, File
from datetime import datetime
import structlog

from backend.websocket.trace import manager
from backend.config.settings import Settings
from backend.store import store
from backend.auth import get_current_user
from agents.reasoning.scoring_engine import load_policy
from fastapi import Depends

logger = structlog.get_logger()
settings = Settings()
router = APIRouter()

# In-memory stores for demo mode
_claims_store = []
_pipeline_results = {}


@router.post("/claims/upload")
async def upload_claim(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    student_id = user["sub"]
    logger.info("claim_upload", filename=file.filename, student_id=student_id)

    image_bytes = await file.read()
    file_size = len(image_bytes)

    await manager.send_agent_event("pipeline", "start", "Starting VIGIL analysis pipeline")

    # Log upload event
    temp_claim_id = str(uuid.uuid4())
    await store.save_audit_entry(
        action="claim_uploaded",
        agent="api",
        student_id=student_id,
        details={
            "filename": file.filename,
            "file_size": file_size,
            "temp_claim_id": temp_claim_id,
        },
    )

    try:
        from agents.graph import build_graph

        graph = build_graph()

        initial_state = {
            "receipt_image": image_bytes,
            "student_id": student_id,
            "receipt_filename": file.filename or "",
            "ocr_result": None,
            "normalized_claim": None,
            "enriched_claim": None,
            "claim_id": None,
            "fraud_flags": [],
            "health_signals": None,
            "fraud_score": None,
            "benefits_report": None,
            "action_plans": [],
            "ranked_plans": [],
            "report_html": None,
            "compliance_approved": False,
            "case_id": None,
            "errors": [],
            "agent_traces": [],
        }

        # Run pipeline to completion
        final_state = await graph.ainvoke(initial_state)

        # Build response
        claim_id = final_state.get("claim_id", str(uuid.uuid4()))
        fraud_score = final_state.get("fraud_score")
        benefits = final_state.get("benefits_report")
        case_id = final_state.get("case_id")

        result = {
            "claim_id": claim_id,
            "case_id": case_id,
            "student_id": student_id,
            "timestamp": datetime.utcnow().isoformat(),
            "fraud_score": fraud_score.model_dump() if fraud_score else None,
            "fraud_flags": [f.model_dump() for f in final_state.get("fraud_flags", [])],
            "benefits_report": benefits.model_dump() if benefits else None,
            "health_signals": final_state.get("health_signals"),
            "ranked_plans": final_state.get("ranked_plans", []),
            "report_html": final_state.get("report_html"),
            "compliance_approved": final_state.get("compliance_approved", False),
            "agent_traces": final_state.get("agent_traces", []),
            "errors": final_state.get("errors", []),
        }

        _claims_store.append(result)
        _pipeline_results[claim_id] = result

        # Auto-create a fraud case for HIGH / CRITICAL risk claims
        policy = load_policy()
        case_threshold = policy["thresholds"]["high"]
        if fraud_score and fraud_score.score >= case_threshold:
            from backend.models.fraud import FraudCase
            fraud_case = FraudCase(
                case_id=case_id or str(uuid.uuid4()),
                claim_id=claim_id,
                student_id=student_id,
                fraud_score=fraud_score,
                flags=final_state.get("fraud_flags", []),
                status="open",
            )
            await store.save_fraud_case(fraud_case)
            logger.info("case_created", claim_id=claim_id, score=fraud_score.score)

        await manager.send_agent_event("pipeline", "complete", "Analysis complete")
        return result

    except Exception as e:
        logger.error("pipeline_error", error=str(e))
        await manager.send_agent_event("pipeline", "error", str(e))
        return {"error": str(e), "claim_id": None}


@router.get("/claims")
async def list_claims(user: dict = Depends(get_current_user)):
    if settings.demo_mode:
        return {"claims": _claims_store, "total": len(_claims_store)}
    user_claims = [c for c in _claims_store if c.get("student_id") == user["sub"]]
    return {"claims": user_claims, "total": len(user_claims)}


@router.get("/claims/{claim_id}")
async def get_claim(claim_id: str, user: dict = Depends(get_current_user)):
    result = _pipeline_results.get(claim_id)
    if result is None or result.get("student_id") != user["sub"]:
        return {"error": "Claim not found"}
    return result