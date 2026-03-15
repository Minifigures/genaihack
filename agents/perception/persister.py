import structlog
from datetime import datetime
from backend.models.state import VigilState
from backend.config.settings import Settings
from backend.store import store

logger = structlog.get_logger()
settings = Settings()


async def run_persister(state: VigilState) -> dict:
    start = datetime.utcnow()
    logger.info("agent_start", agent="persister")

    try:
        enriched = state.get("enriched_claim")
        if enriched is None:
            logger.warning("persister_skip", reason="no enriched claim")
            return {
                "agent_traces": [{
                    "agent": "persister",
                    "event": "skip",
                    "message": "No enriched claim to persist",
                    "duration_ms": 0,
                    "timestamp": datetime.utcnow().isoformat(),
                }],
            }

        # Get raw_text from OCR result if available
        ocr_result = state.get("ocr_result")
        raw_text = ocr_result.raw_text if ocr_result else None

        # Get session context for SaaS fields
        tenant_id = state.get("tenant_id")
        session_id = state.get("session_id")
        created_by = state.get("user_id")

        # Save claim to database (works for both Postgres and Snowflake)
        claim_id = await store.save_claim(
            enriched,
            raw_text=raw_text,
            tenant_id=tenant_id,
            created_by=created_by,
            session_id=session_id,
        )

        # Log audit entry for claim persistence
        await store.save_audit_entry(
            action="claim_persisted",
            agent="persister",
            claim_id=claim_id,
            student_id=enriched.student_id,
            tenant_id=tenant_id,
            session_id=session_id,
            details={
                "provider_id": enriched.provider_id,
                "procedures_count": len(enriched.procedures),
                "total": enriched.total,
                "ocr_confidence": enriched.ocr_confidence,
            },
        )

        duration = int((datetime.utcnow() - start).total_seconds() * 1000)
        logger.info("agent_complete", agent="persister", duration_ms=duration, claim_id=claim_id)

        return {
            "claim_id": claim_id,
            "agent_traces": [{
                "agent": "persister",
                "event": "complete",
                "message": f"Persisted claim {claim_id[:8]} to database",
                "duration_ms": duration,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }

    except Exception as e:
        logger.error("agent_error", agent="persister", error=str(e))
        return {
            "errors": [f"persister: {str(e)}"],
            "agent_traces": [{
                "agent": "persister",
                "event": "error",
                "message": str(e),
                "duration_ms": None,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }
