import structlog
from datetime import datetime
from backend.models.state import VigilState, ActionPlan, RankedPlan

logger = structlog.get_logger()


def compute_priority_score(plan: ActionPlan) -> float:
    """Pure Python priority scoring. NO LLM calls.

    Formula: priority = (savings * fraud_severity * confidence) / (effort + 1)
    """
    savings = plan["expected_savings"]
    severity = plan["fraud_severity"]
    confidence = plan["confidence"]
    effort = plan["effort_required"]

    numerator = savings * severity * confidence
    denominator = effort + 1.0

    # Baseline score for plans with no direct savings (preventive actions)
    if savings == 0:
        numerator = severity * confidence * 100.0

    return round(numerator / denominator, 2)


async def run_optimization_engine(state: VigilState) -> dict:
    start = datetime.utcnow()
    logger.info("agent_start", agent="optimization_engine")

    try:
        plans = state.get("action_plans", [])

        ranked: list[RankedPlan] = []
        for plan in plans:
            score = compute_priority_score(plan)
            ranked.append(RankedPlan(plan=plan, priority_score=score))

        # Sort by priority (highest first)
        ranked.sort(key=lambda r: r["priority_score"], reverse=True)

        # Keep top 3
        ranked = ranked[:3]

        duration = int((datetime.utcnow() - start).total_seconds() * 1000)
        logger.info("agent_complete", agent="optimization_engine", duration_ms=duration, ranked=len(ranked))

        return {
            "ranked_plans": ranked,
            "agent_traces": [{
                "agent": "optimization_engine",
                "event": "complete",
                "message": f"Ranked {len(ranked)} action plans by priority",
                "duration_ms": duration,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }

    except Exception as e:
        logger.error("agent_error", agent="optimization_engine", error=str(e))
        return {
            "errors": [f"optimization_engine: {str(e)}"],
            "agent_traces": [{
                "agent": "optimization_engine",
                "event": "error",
                "message": str(e),
                "duration_ms": None,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }
