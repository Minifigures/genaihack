import structlog
from datetime import datetime
from backend.models.state import VigilState
from backend.models.claim import EnrichedClaim
from backend.config.settings import Settings
from agents.memory.moorcheh_client import MoorchehClient
from agents.memory.episodic import get_claim_history
from database.connection import execute_query

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


def _get_total_claims_this_year(student_id: str) -> int:
    """Count claims this calendar year from Snowflake."""
    rows = execute_query(
        "SELECT COUNT(*) AS cnt FROM claims "
        "WHERE student_id = %(student_id)s AND YEAR(claim_date) = YEAR(CURRENT_DATE())",
        {"student_id": student_id},
    )
    if rows:
        return int(rows[0].get("cnt", 0))
    return 0


def _get_provider_avg_fee_deviation(provider_name: str) -> float | None:
    """Look up avg_fee_deviation from provider_stats by name."""
    rows = execute_query(
        "SELECT avg_fee_deviation FROM provider_stats "
        "WHERE provider_name = %(provider_name)s LIMIT 1",
        {"provider_name": provider_name},
    )
    if rows:
        return float(rows[0].get("avg_fee_deviation", 0))
    return None


def _get_student_coverage_used_ytd(student_id: str) -> dict[str, float] | None:
    """Fetch current plan-year usage from student_benefits table."""
    rows = execute_query(
        "SELECT category, used_ytd FROM student_benefits "
        "WHERE student_id = %(student_id)s "
        "AND plan_year = CONCAT(YEAR(CURRENT_DATE()), '-', YEAR(CURRENT_DATE()) + 1)",
        {"student_id": student_id},
    )
    if rows:
        return {row["category"]: float(row["used_ytd"]) for row in rows}
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
            # Live mode: query Moorcheh + Snowflake
            past_at_provider = await _get_past_claims_at_provider(
                normalized.student_id, provider_name,
            )
            total_this_year = _get_total_claims_this_year(normalized.student_id)
            avg_deviation = _get_provider_avg_fee_deviation(provider_name)
            coverage_ytd = _get_student_coverage_used_ytd(normalized.student_id)

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
