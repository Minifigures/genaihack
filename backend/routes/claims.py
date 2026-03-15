import uuid
from fastapi import APIRouter, UploadFile, File
from datetime import datetime
import structlog

from backend.websocket.trace import manager
from backend.config.settings import Settings
from backend.auth import get_current_user
from fastapi import Depends

logger = structlog.get_logger()
settings = Settings()
router = APIRouter()

# In-memory store for demo
_claims_store: list[dict] = [
    {
        "claim_id": "CLM-1001-DEMO",
        "student_id": "STU-001",
        "timestamp": datetime.utcnow().isoformat(),
        "fraud_score": {
            "score": 12.5,
            "level": "low",
            "breakdown": {
                "fee_deviation": 2.5,
                "code_risk": 0.0,
                "provider_history": 0.0,
                "pattern_bonus": 10.0,
                "confidence_adj": 1.0
            }
        },
        "fraud_flags": [],
        "benefits_report": None,
        "health_signals": None,
        "ranked_plans": [],
        "report_html": None,
        "compliance_approved": True,
        "agent_traces": [],
        "errors": []
    },
    {
        "claim_id": "CLM-1002-DEMO",
        "student_id": "STU-002",
        "timestamp": datetime.utcnow().isoformat(),
        "fraud_score": {
            "score": 87.5,
            "level": "critical",
            "breakdown": {
                "fee_deviation": 35.0,
                "code_risk": 20.0,
                "provider_history": 15.0,
                "pattern_bonus": 17.5,
                "confidence_adj": 1.0
            }
        },
        "fraud_flags": [
            {
                "fraud_type": "upcoding",
                "code": "43421",
                "billed_fee": 350.0,
                "suggested_fee": 195.0,
                "deviation_pct": 0.795,
                "confidence": 0.85,
                "evidence": "Procedure 43421 (Root planing, per quadrant) may be upcoded from 11111. Billed $350.00 vs typical $195.00"
            }
        ],
        "benefits_report": None,
        "health_signals": None,
        "ranked_plans": [],
        "report_html": None,
        "compliance_approved": False,
        "agent_traces": [],
        "errors": []
    }
]

_pipeline_results: dict[str, dict] = {
    claim["claim_id"]: claim for claim in _claims_store
}


@router.post("/claims/upload")
async def upload_claim(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    student_id = user["sub"]
    logger.info("claim_upload", filename=file.filename, student_id=student_id)

    image_bytes = await file.read()

    await manager.send_agent_event("pipeline", "start", "Starting VIGIL analysis pipeline")

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

        result = {
            "claim_id": claim_id,
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

        await manager.send_agent_event("pipeline", "complete", "Analysis complete")
        return result

    except Exception as e:
        logger.error("pipeline_error", error=str(e))
        await manager.send_agent_event("pipeline", "error", str(e))
        return {"error": str(e), "claim_id": None}


@router.get("/claims")
async def list_claims(user: dict = Depends(get_current_user)):
    user_claims = [c for c in _claims_store if c.get("student_id") == user["sub"]]
    return {"claims": user_claims, "total": len(user_claims)}


@router.get("/claims/{claim_id}")
async def get_claim(claim_id: str, user: dict = Depends(get_current_user)):
    result = _pipeline_results.get(claim_id)
    if result is None or result.get("student_id") != user["sub"]:
        return {"error": "Claim not found"}
    return result
