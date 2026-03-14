import uuid
import yaml
import structlog
from pathlib import Path
from datetime import datetime
from backend.models.state import VigilState, ActionPlan

logger = structlog.get_logger()
ACTION_LIBRARY_PATH = Path(__file__).parent / "action_library.yaml"


def load_action_library() -> dict:
    with open(ACTION_LIBRARY_PATH) as f:
        return yaml.safe_load(f)


async def run_action_generator(state: VigilState) -> dict:
    start = datetime.utcnow()
    logger.info("agent_start", agent="action_generator")

    try:
        fraud_score = state.get("fraud_score")
        benefits = state.get("benefits_report")
        health_signals = state.get("health_signals")
        library = load_action_library()

        plans: list[ActionPlan] = []
        score_val = fraud_score.score if fraud_score else 0.0

        for action_key, action_def in library.get("actions", {}).items():
            prereqs = action_def.get("prerequisites", [])
            eligible = True

            for prereq in prereqs:
                if "fraud_score >=" in prereq:
                    threshold = float(prereq.split(">=")[1].strip())
                    if score_val < threshold:
                        eligible = False
                        break
                if prereq == "confirmed_pattern" and score_val < 76:
                    eligible = False
                    break

            if not eligible:
                continue

            # Generate action plan
            savings = 0.0
            if fraud_score and action_key in ("dispute_claim", "request_itemized"):
                flags = state.get("fraud_flags", [])
                savings = sum(
                    (f.billed_fee - (f.suggested_fee or 0))
                    for f in flags
                    if f.suggested_fee is not None
                )

            if action_key == "book_preventive" and health_signals:
                gaps = health_signals.get("gaps", [])
                if not gaps:
                    continue

            plans.append(ActionPlan(
                plan_id=str(uuid.uuid4()),
                name=action_def["name"],
                steps=[action_def["description"]],
                expected_savings=savings,
                effort_required=float(action_def["effort"]),
                fraud_severity=score_val / 100.0,
                confidence=0.8 if fraud_score else 0.5,
            ))

        duration = int((datetime.utcnow() - start).total_seconds() * 1000)
        logger.info("agent_complete", agent="action_generator", duration_ms=duration, plans=len(plans))

        return {
            "action_plans": plans,
            "agent_traces": state.get("agent_traces", []) + [{
                "agent": "action_generator",
                "event": "complete",
                "message": f"Generated {len(plans)} candidate action plans",
                "duration_ms": duration,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }

    except Exception as e:
        logger.error("agent_error", agent="action_generator", error=str(e))
        return {
            "errors": state.get("errors", []) + [f"action_generator: {str(e)}"],
            "agent_traces": state.get("agent_traces", []) + [{
                "agent": "action_generator",
                "event": "error",
                "message": str(e),
                "duration_ms": None,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }
