import uuid
import structlog
from datetime import datetime
from backend.models.state import VigilState
from backend.config.settings import Settings
from backend.store import store
from backend.models.fraud import FraudCase

logger = structlog.get_logger()
settings = Settings()


async def run_audit_logger(state: VigilState) -> dict:
    start = datetime.utcnow()
    logger.info("agent_start", agent="audit_logger")

    try:
        case_id = str(uuid.uuid4())

        # Get session context
        tenant_id = state.get("tenant_id")
        session_id = state.get("session_id")
        created_by = state.get("user_id")

        # Get claim info
        claim_id = state.get("claim_id")
        student_id = state.get("student_id")
        enriched = state.get("enriched_claim")
        provider_id = enriched.provider_id if enriched else None

        # Get fraud analysis results
        fraud_score = state.get("fraud_score")
        fraud_flags = state.get("fraud_flags", [])
        compliance_approved = state.get("compliance_approved", False)

        # Create and save FraudCase
        if fraud_score:
            fraud_case = FraudCase(
                case_id=case_id,
                claim_id=claim_id,
                student_id=student_id,
                provider_id=provider_id,
                fraud_score=fraud_score,
                flags=fraud_flags,
                status="open",
            )
            await store.save_fraud_case(
                fraud_case,
                tenant_id=tenant_id,
                created_by=created_by,
                session_id=session_id,
            )

        # Save audit entry for case creation
        await store.save_audit_entry(
            action="case_created",
            agent="audit_logger",
            case_id=case_id,
            claim_id=claim_id,
            student_id=student_id,
            tenant_id=tenant_id,
            session_id=session_id,
            details={
                "fraud_score": fraud_score.score if fraud_score else None,
                "risk_level": fraud_score.level.value if fraud_score else None,
                "flags_count": len(fraud_flags),
                "compliance_approved": compliance_approved,
                "flags": [f.model_dump() for f in fraud_flags],
            },
        )

        logger.info("audit_logged", **audit_entry)

        duration = int((datetime.utcnow() - start).total_seconds() * 1000)
        logger.info("agent_complete", agent="audit_logger", duration_ms=duration, case_id=case_id)

        return {
            "case_id": case_id,
            "agent_traces": [{
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
            "errors": [f"audit_logger: {str(e)}"],
            "agent_traces": [{
                "agent": "audit_logger",
                "event": "error",
                "message": str(e),
                "duration_ms": None,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }
