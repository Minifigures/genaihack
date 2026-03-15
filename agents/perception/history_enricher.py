import structlog
from datetime import datetime
from backend.models.state import VigilState
from backend.models.claim import EnrichedClaim
from backend.config.settings import Settings
from backend.store import store
from agents.memory.moorcheh_client import MoorchehClient
from agents.memory.episodic import get_claim_history

logger = structlog.get_logger()
settings = Settings()

_moorcheh = MoorchehClient()


async def _get_past_claims_at_provider(student_id: str, provider_name: str) -> int:
    """Count how many past claims this student has filed at this provider via Moorcheh."""
    try:
        results = await get_claim_history(
            _moorcheh, student_id,
            query=f"claims at provider {provider_name}",
        )
        return len(results)
    except Exception as e:
        logger.warning("moorcheh_history_error", student_id=student_id, error=str(e))
        return 0


async def _get_total_claims_this_year(student_id: str) -> int:
    """Count claims this calendar year from database."""
    try:
        claims = await store.get_claims(student_id=student_id, limit=1000)
        current_year = datetime.utcnow().year
        count = sum(1 for c in claims if c.get("claim_date", "").startswith(str(current_year)))
        return count
    except Exception as e:
        logger.warning("claims_count_error", student_id=student_id, error=str(e))
        return 0


async def _get_provider_avg_fee_deviation(provider_name: str) -> float | None:
    """Look up avg_fee_deviation from providers table by name."""
    try:
        providers = await store.get_providers()
        for p in providers:
            if p.get("provider_name") == provider_name:
                return float(p.get("avg_fee_deviation", 0))
        return None
    except Exception as e:
        logger.warning("provider_deviation_error", provider_name=provider_name, error=str(e))
        return None


async def _get_student_coverage_used_ytd(student_id: str) -> dict[str, float] | None:
    """Fetch current plan-year usage from student_benefits table."""
    try:
        benefits = await store.get_student_benefits(student_id)
        if benefits:
            current_year = datetime.utcnow().year
            plan_year = f"{current_year}-{current_year + 1}"
            return {
                b["category"]: float(b.get("used_ytd", 0))
                for b in benefits
                if b.get("plan_year") == plan_year
            }
        return None
    except Exception as e:
        logger.warning("benefits_fetch_error", student_id=student_id, error=str(e))
        return None


async def run_history_enricher(state: VigilState) -> dict:
    start = datetime.utcnow()
    logger.info("agent_start", agent="history_enricher")

    try:
        normalized = state.get("normalized_claim")
        if normalized is None:
            raise ValueError("No normalized claim available")

        provider_name = ""
        ocr_result = state.get("ocr_result")
        if ocr_result is not None:
            provider_name = ocr_result.provider_name

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
            # Live mode: query Moorcheh + Database
            past_at_provider = await _get_past_claims_at_provider(
                normalized.student_id, provider_name,
            )
            total_this_year = await _get_total_claims_this_year(normalized.student_id)
            avg_deviation = await _get_provider_avg_fee_deviation(provider_name)
            coverage_ytd = await _get_student_coverage_used_ytd(normalized.student_id)

            enriched = EnrichedClaim(
                **normalized.model_dump(),
                past_claims_at_provider=past_at_provider,
                total_claims_this_year=total_this_year,
                provider_avg_fee_deviation=avg_deviation,
                student_coverage_used_ytd=coverage_ytd,
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
