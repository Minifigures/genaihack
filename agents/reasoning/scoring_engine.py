import yaml
import structlog
from pathlib import Path
from datetime import datetime
from backend.models.state import VigilState
from backend.models.fraud import FraudFlag, FraudScore, ScoreBreakdown, RiskLevel

logger = structlog.get_logger()
POLICY_PATH = Path(__file__).parent / "fraud_policy.yaml"

CODE_RISK_WEIGHTS: dict[str, float] = {
    "upcoding": 0.9,
    "unbundling": 0.7,
    "phantom_billing": 1.0,
    "fee_deviation": 0.4,
    "duplicate_claim": 0.8,
}


def load_policy() -> dict:
    with open(POLICY_PATH) as f:
        return yaml.safe_load(f)


def classify_risk(score: float) -> RiskLevel:
    policy = load_policy()
    thresholds = policy["thresholds"]
    if score >= thresholds["critical"]:
        return RiskLevel.CRITICAL
    elif score >= thresholds["high"]:
        return RiskLevel.HIGH
    elif score >= thresholds["elevated"]:
        return RiskLevel.ELEVATED
    return RiskLevel.LOW


def compute_fraud_score(
    flags: list[FraudFlag],
    provider_history_flags: int = 0,
) -> FraudScore:
    if not flags:
        return FraudScore(
            score=0.0,
            level=RiskLevel.LOW,
            breakdown=ScoreBreakdown(
                fee_deviation=0.0,
                code_risk=0.0,
                provider_history=0.0,
                pattern_bonus=0.0,
                confidence_adj=1.0,
            ),
        )

    # Component 1: Fee deviation severity (0-40)
    deviations = [f.deviation_pct for f in flags if f.deviation_pct is not None]
    max_deviation = max(deviations) if deviations else 0.0
    fee_component = min(40.0, max_deviation * 40.0)

    # Component 2: Code risk weight (0-25)
    code_risks = [CODE_RISK_WEIGHTS.get(f.fraud_type.value, 0.5) for f in flags]
    code_component = min(25.0, sum(code_risks) * 10.0)

    # Component 3: Provider history (0-25)
    history_component = min(25.0, provider_history_flags * 5.0)

    # Component 4: Pattern bonus (0-10)
    pattern_bonus = 10.0 if len(flags) >= 3 else float(len(flags) * 3)

    raw_score = fee_component + code_component + history_component + pattern_bonus

    # Confidence adjustment
    confidence = min(f.confidence for f in flags) if flags else 1.0
    adjusted_score = min(100.0, raw_score * confidence)

    return FraudScore(
        score=round(adjusted_score, 1),
        level=classify_risk(adjusted_score),
        breakdown=ScoreBreakdown(
            fee_deviation=round(fee_component, 1),
            code_risk=round(code_component, 1),
            provider_history=round(history_component, 1),
            pattern_bonus=round(pattern_bonus, 1),
            confidence_adj=round(confidence, 2),
        ),
    )


async def run_scoring_engine(state: VigilState) -> dict:
    start = datetime.utcnow()
    logger.info("agent_start", agent="scoring_engine")

    try:
        flags = state.get("fraud_flags", [])
        enriched = state.get("enriched_claim")

        provider_history_flags = 0
        if enriched and enriched.provider_avg_fee_deviation is not None:
            if enriched.provider_avg_fee_deviation > 0.3:
                provider_history_flags = 3
            elif enriched.provider_avg_fee_deviation > 0.15:
                provider_history_flags = 1

        score = compute_fraud_score(flags, provider_history_flags)

        duration = int((datetime.utcnow() - start).total_seconds() * 1000)
        logger.info(
            "agent_complete",
            agent="scoring_engine",
            duration_ms=duration,
            score=score.score,
            level=score.level.value,
        )

        return {
            "fraud_score": score,
            "agent_traces": state.get("agent_traces", []) + [{
                "agent": "scoring_engine",
                "event": "complete",
                "message": f"Fraud score: {score.score}/100 ({score.level.value})",
                "duration_ms": duration,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }

    except Exception as e:
        logger.error("agent_error", agent="scoring_engine", error=str(e))
        return {
            "errors": state.get("errors", []) + [f"scoring_engine: {str(e)}"],
            "agent_traces": state.get("agent_traces", []) + [{
                "agent": "scoring_engine",
                "event": "error",
                "message": str(e),
                "duration_ms": None,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }
