import yaml
import structlog
from pathlib import Path
from datetime import datetime
from backend.models.state import VigilState
from backend.models.fraud import FraudFlag, FraudScore, ScoreBreakdown, RiskLevel
from backend.store import store

logger = structlog.get_logger()
POLICY_PATH = Path(__file__).parent / "fraud_policy.yaml"

_policy_cache: dict | None = None


def load_policy() -> dict:
    global _policy_cache
    if _policy_cache is None:
        with open(POLICY_PATH) as f:
            _policy_cache = yaml.safe_load(f)
    return _policy_cache


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

    policy = load_policy()
    weights = policy["code_risk_weights"]
    caps = policy["scoring_components"]

    # Component 1: Fee deviation severity (0 to fee_deviation_max)
    deviations = [f.deviation_pct for f in flags if f.deviation_pct is not None]
    max_deviation = max(deviations) if deviations else 0.0
    fee_max = float(caps["fee_deviation_max"])
    fee_component = min(fee_max, max_deviation * fee_max)

    # Component 2: Code risk weight (0 to code_risk_max)
    code_risks = [weights.get(f.fraud_type.value, 0.5) for f in flags]
    code_max = float(caps["code_risk_max"])
    code_multiplier = float(caps["code_risk_multiplier"])
    code_component = min(code_max, sum(code_risks) * code_multiplier)

    # Component 3: Provider history (0 to provider_history_max)
    history_max = float(caps["provider_history_max"])
    history_component = min(history_max, provider_history_flags * 5.0)

    # Component 4: Pattern bonus (0 to pattern_bonus_max)
    pattern_max = float(caps["pattern_bonus_max"])
    pattern_threshold = int(caps["pattern_threshold"])
    points_per_flag = float(caps["points_per_flag"])
    pattern_bonus = pattern_max if len(flags) >= pattern_threshold else float(len(flags)) * points_per_flag

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

        # Map provider deviation to history flags using policy thresholds
        policy = load_policy()
        ph = policy["provider_history"]
        provider_history_flags = 0
        if enriched and enriched.provider_avg_fee_deviation is not None:
            if enriched.provider_avg_fee_deviation > ph["high_deviation"]:
                provider_history_flags = ph["high_flags"]
            elif enriched.provider_avg_fee_deviation > ph["moderate_deviation"]:
                provider_history_flags = ph["moderate_flags"]

        score = compute_fraud_score(flags, provider_history_flags)

        claim_id = state.get("claim_id")
        student_id = state.get("student_id")
        await store.save_audit_entry(
            action="fraud_analysis_complete",
            agent="scoring_engine",
            claim_id=claim_id,
            student_id=student_id,
            tenant_id=state.get("tenant_id"),
            session_id=state.get("session_id"),
            details={
                "fraud_score": score.score,
                "risk_level": score.level.value,
                "flags_count": len(flags),
                "breakdown": score.breakdown.model_dump(),
            },
        )

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
            "agent_traces": [{
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
            "errors": [f"scoring_engine: {str(e)}"],
            "agent_traces": [{
                "agent": "scoring_engine",
                "event": "error",
                "message": str(e),
                "duration_ms": None,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }
