import uuid
import structlog
from datetime import datetime
from backend.models.state import VigilState
from backend.config.settings import Settings

logger = structlog.get_logger()
settings = Settings()


async def run_audit_logger(state: VigilState) -> dict:
    start = datetime.utcnow()
    logger.info("agent_start", agent="audit_logger")

    try:
        case_id = str(uuid.uuid4())

        audit_entry = {
            "case_id": case_id,
            "claim_id": state.get("claim_id"),
            "student_id": state.get("student_id"),
            "fraud_score": state.get("fraud_score").score if state.get("fraud_score") else None,
            "fraud_level": state.get("fraud_score").level.value if state.get("fraud_score") else None,
            "flags_count": len(state.get("fraud_flags", [])),
            "compliance_approved": state.get("compliance_approved", False),
            "errors": state.get("errors", []),
            "timestamp": datetime.utcnow().isoformat(),
        }

        if settings.demo_mode:
            logger.info("audit_logged", **audit_entry)
        else:
            # TODO: Write to Snowflake audit_log table
            pass

        duration = int((datetime.utcnow() - start).total_seconds() * 1000)
        logger.info("agent_complete", agent="audit_logger", duration_ms=duration, case_id=case_id)

        return {
            "case_id": case_id,
            "agent_traces": state.get("agent_traces", []) + [{
                "agent": "audit_logger",
                "event": "complete",
                "message": f"Audit logged, case_id={case_id[:8]}",
                "duration_ms": duration,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }

    except Exception as e:
        logger.error("agent_error", agent="audit_logger", error=str(e))
        return {
            "errors": state.get("errors", []) + [f"audit_logger: {str(e)}"],
            "agent_traces": state.get("agent_traces", []) + [{
                "agent": "audit_logger",
                "event": "error",
                "message": str(e),
                "duration_ms": None,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }
