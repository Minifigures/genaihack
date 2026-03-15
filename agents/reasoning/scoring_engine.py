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


def reload_policy() -> dict:
    """Force-reload the policy file (useful for tests)."""
    global _policy_cache
    _policy_cache = None
    return load_policy()


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
    policy = load_policy()
    caps = policy["scoring_caps"]
    code_risk_weights = policy["code_risk_weights"]
    pattern_rules = policy["pattern_bonus_rules"]

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

    fee_cap = caps["fee_deviation"]
    code_cap = caps["code_risk"]
    history_cap = caps["provider_history"]
    pattern_cap = caps["pattern_bonus"]

    # Component 1: Fee deviation severity (0 – fee_cap)
    deviations = [f.deviation_pct for f in flags if f.deviation_pct is not None]
    max_deviation = max(deviations) if deviations else 0.0
    fee_component = min(float(fee_cap), max_deviation * fee_cap)

    # Component 2: Code risk weight (0 – code_cap)
    code_risks = [code_risk_weights.get(f.fraud_type.value, 0.5) for f in flags]
    code_component = min(float(code_cap), sum(code_risks) * 10.0)

    # Component 3: Provider history (0 – history_cap)
    history_component = min(float(history_cap), provider_history_flags * 5.0)

    # Component 4: Pattern bonus (0 – pattern_cap)
    multi_threshold = pattern_rules["multi_flag_threshold"]
    per_flag_pts = pattern_rules["per_flag_points"]
    if len(flags) >= multi_threshold:
        pattern_bonus = float(pattern_cap)
    else:
        pattern_bonus = min(float(pattern_cap), float(len(flags) * per_flag_pts))

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
        policy = load_policy()
        history_rules = policy["provider_history_flag_rules"]

        flags = state.get("fraud_flags", [])
        enriched = state.get("enriched_claim")

        # Map provider deviation to history flags using policy thresholds
        provider_history_flags = 0
        if enriched and enriched.provider_avg_fee_deviation is not None:
            if enriched.provider_avg_fee_deviation > history_rules["severe_deviation"]:
                provider_history_flags = history_rules["severe_flags"]
            elif enriched.provider_avg_fee_deviation > history_rules["moderate_deviation"]:
                provider_history_flags = history_rules["moderate_flags"]

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
