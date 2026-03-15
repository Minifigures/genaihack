import uuid
from fastapi import APIRouter, UploadFile, File, Form
from datetime import datetime
import structlog

from backend.websocket.trace import manager
from backend.config.settings import Settings
from backend.store import store

logger = structlog.get_logger()
settings = Settings()
router = APIRouter()


@router.post("/claims/upload")
async def upload_claim(
    file: UploadFile = File(...),
    student_id: str = Form(default="STU-001"),
):
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

        await manager.send_agent_event("pipeline", "complete", "Analysis complete")
        return result

    except Exception as e:
        logger.error("pipeline_error", error=str(e))
        await manager.send_agent_event("pipeline", "error", str(e))
        return {"error": str(e), "claim_id": None}


@router.get("/claims")
async def list_claims():
    claims = await store.get_claims()
    return {"claims": claims, "total": len(claims)}


@router.get("/claims/{claim_id}")
async def get_claim(claim_id: str):
    claim = await store.get_claim(claim_id)
    if claim is None:
        return {"error": "Claim not found"}
    return claim