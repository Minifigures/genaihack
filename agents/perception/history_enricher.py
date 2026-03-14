import structlog
from datetime import datetime
from backend.models.state import VigilState
from backend.models.claim import EnrichedClaim
from backend.config.settings import Settings

logger = structlog.get_logger()
settings = Settings()


async def run_history_enricher(state: VigilState) -> dict:
    start = datetime.utcnow()
    logger.info("agent_start", agent="history_enricher")

    try:
        normalized = state.get("normalized_claim")
        if normalized is None:
            raise ValueError("No normalized claim available")

        # In demo mode, use synthetic history data
        if settings.demo_mode:
            enriched = EnrichedClaim(
                **normalized.model_dump(),
                past_claims_at_provider=3,
                total_claims_this_year=7,
                provider_avg_fee_deviation=0.18,
                student_coverage_used_ytd={
                    "dental": 420.00,
                    "vision": 0.00,
                    "paramedical": 150.00,
                    "psychology": 0.00,
                },
            )
        else:
            # TODO: Query Moorcheh episodic memory for student's past claims
            # TODO: Query Snowflake for provider stats
            enriched = EnrichedClaim(
                **normalized.model_dump(),
                past_claims_at_provider=0,
                total_claims_this_year=0,
                provider_avg_fee_deviation=None,
                student_coverage_used_ytd=None,
            )

        duration = int((datetime.utcnow() - start).total_seconds() * 1000)
        logger.info("agent_complete", agent="history_enricher", duration_ms=duration)

        return {
            "enriched_claim": enriched,
            "agent_traces": [{
                "agent": "history_enricher",
                "event": "complete",
                "message": f"Enriched with {enriched.past_claims_at_provider} past claims at provider",
                "duration_ms": duration,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }

    except Exception as e:
        logger.error("agent_error", agent="history_enricher", error=str(e))
        return {
            "errors": [f"history_enricher: {str(e)}"],
            "agent_traces": [{
                "agent": "history_enricher",
                "event": "error",
                "message": str(e),
                "duration_ms": None,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }
