import structlog
from datetime import datetime
from backend.models.state import VigilState

logger = structlog.get_logger()


async def run_outcome_evaluator(state: VigilState) -> dict:
    """Stretch goal: Compare predicted vs actual dispute outcomes."""
    start = datetime.utcnow()
    logger.info("agent_start", agent="outcome_evaluator", status="stub")

    duration = int((datetime.utcnow() - start).total_seconds() * 1000)
    return {
        "agent_traces": state.get("agent_traces", []) + [{
            "agent": "outcome_evaluator",
            "event": "complete",
            "message": "Outcome evaluation (stub, stretch goal)",
            "duration_ms": duration,
            "timestamp": datetime.utcnow().isoformat(),
        }],
    }
