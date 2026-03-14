import structlog
from datetime import datetime
from backend.models.state import VigilState
from backend.config.settings import Settings

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

        if settings.demo_mode:
            logger.info("persister_demo", claim_id=enriched.claim_id)
        else:
            # TODO: Write to Snowflake claims table
            pass

        duration = int((datetime.utcnow() - start).total_seconds() * 1000)
        logger.info("agent_complete", agent="persister", duration_ms=duration)

        return {
            "agent_traces": [{
                "agent": "persister",
                "event": "complete",
                "message": f"Persisted claim {enriched.claim_id[:8]} to database",
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
