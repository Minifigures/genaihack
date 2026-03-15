import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from backend.models.fraud import FraudFlag, FraudType, RiskLevel
from agents.reasoning.scoring_engine import (
    compute_fraud_score,
    classify_risk,
    load_policy,
)


def _make_flag(
    fraud_type: FraudType = FraudType.FEE_DEVIATION,
    deviation_pct: float = 0.3,
    confidence: float = 0.85,
    billed_fee: float = 100.0,
    suggested_fee: float = 70.0,
) -> FraudFlag:
    return FraudFlag(
        fraud_type=fraud_type,
        code="11101",
        billed_fee=billed_fee,
        suggested_fee=suggested_fee,
        deviation_pct=deviation_pct,
        confidence=confidence,
        evidence="Test evidence",
    )


class TestPolicyLoading:
    """Verify the policy file loads and contains required keys."""

    def test_policy_loads(self):
        policy = load_policy()
        assert "thresholds" in policy
        assert "scoring_caps" in policy
        assert "code_risk_weights" in policy
        assert "confidence_defaults" in policy

    def test_scoring_caps_sum_to_100(self):
        policy = load_policy()
        caps = policy["scoring_caps"]
        total = sum(caps.values())
        assert total == 100, f"Scoring caps sum to {total}, expected 100"

    def test_all_fraud_types_have_code_risk_weight(self):
        policy = load_policy()
        weights = policy["code_risk_weights"]
        for ft in FraudType:
            assert ft.value in weights, f"Missing code_risk_weight for {ft.value}"

    def test_all_fraud_types_have_confidence_default(self):
        policy = load_policy()
        defaults = policy["confidence_defaults"]
        for ft in FraudType:
            assert ft.value in defaults, f"Missing confidence_default for {ft.value}"


class TestComputeFraudScore:
    def test_no_flags_returns_zero(self):
        score = compute_fraud_score([])
        assert score.score == 0.0
        assert score.level == RiskLevel.LOW

    def test_single_fee_deviation(self):
        flags = [_make_flag(FraudType.FEE_DEVIATION, deviation_pct=0.3)]
        score = compute_fraud_score(flags)
        assert score.score > 0
        assert score.breakdown.fee_deviation > 0
        assert score.breakdown.code_risk > 0

    def test_upcoding_has_higher_risk_weight(self):
        fee_flag = [_make_flag(FraudType.FEE_DEVIATION)]
        upcoding_flag = [_make_flag(FraudType.UPCODING)]

        fee_score = compute_fraud_score(fee_flag)
        upcoding_score = compute_fraud_score(upcoding_flag)

        assert upcoding_score.breakdown.code_risk > fee_score.breakdown.code_risk

    def test_phantom_billing_highest_weight(self):
        policy = load_policy()
        cap = policy["scoring_caps"]["code_risk"]
        weight = policy["code_risk_weights"]["phantom_billing"]
        phantom_flag = [_make_flag(FraudType.PHANTOM_BILLING)]
        score = compute_fraud_score(phantom_flag)
        assert score.breakdown.code_risk == min(float(cap), weight * 10.0)

    def test_multiple_flags_increase_score(self):
        single = compute_fraud_score([_make_flag()])
        double = compute_fraud_score([_make_flag(), _make_flag(FraudType.UPCODING)])
        assert double.score > single.score

    def test_pattern_bonus_three_flags(self):
        policy = load_policy()
        pattern_cap = policy["scoring_caps"]["pattern_bonus"]
        flags = [
            _make_flag(FraudType.FEE_DEVIATION),
            _make_flag(FraudType.UPCODING),
            _make_flag(FraudType.UNBUNDLING),
        ]
        score = compute_fraud_score(flags)
        assert score.breakdown.pattern_bonus == float(pattern_cap)

    def test_provider_history_adds_component(self):
        flags = [_make_flag()]
        no_history = compute_fraud_score(flags, provider_history_flags=0)
        with_history = compute_fraud_score(flags, provider_history_flags=3)
        assert with_history.score > no_history.score
        assert with_history.breakdown.provider_history == 15.0

    def test_confidence_adjustment(self):
        high_conf = [_make_flag(confidence=1.0)]
        low_conf = [_make_flag(confidence=0.5)]

        high_score = compute_fraud_score(high_conf)
        low_score = compute_fraud_score(low_conf)

        assert high_score.score > low_score.score

    def test_score_capped_at_100(self):
        flags = [
            _make_flag(FraudType.PHANTOM_BILLING, deviation_pct=2.0, confidence=1.0),
            _make_flag(FraudType.UPCODING, deviation_pct=1.5, confidence=1.0),
            _make_flag(FraudType.UNBUNDLING, deviation_pct=1.0, confidence=1.0),
        ]
        score = compute_fraud_score(flags, provider_history_flags=5)
        assert score.score <= 100.0

    def test_fee_component_respects_cap(self):
        policy = load_policy()
        fee_cap = policy["scoring_caps"]["fee_deviation"]
        # Huge deviation should still be capped
        flags = [_make_flag(deviation_pct=5.0, confidence=1.0)]
        score = compute_fraud_score(flags)
        assert score.breakdown.fee_deviation <= fee_cap

    def test_code_risk_respects_cap(self):
        policy = load_policy()
        code_cap = policy["scoring_caps"]["code_risk"]
        # Many flags should still be capped
        flags = [_make_flag(FraudType.PHANTOM_BILLING, confidence=1.0) for _ in range(10)]
        score = compute_fraud_score(flags)
        assert score.breakdown.code_risk <= code_cap


class TestClassifyRisk:
    def test_low(self):
        assert classify_risk(10) == RiskLevel.LOW

    def test_elevated(self):
        assert classify_risk(30) == RiskLevel.ELEVATED

    def test_high(self):
        assert classify_risk(55) == RiskLevel.HIGH

    def test_critical(self):
        assert classify_risk(80) == RiskLevel.CRITICAL

    def test_boundary_elevated(self):
        policy = load_policy()
        assert classify_risk(policy["thresholds"]["elevated"]) == RiskLevel.ELEVATED

    def test_boundary_high(self):
        policy = load_policy()
        assert classify_risk(policy["thresholds"]["high"]) == RiskLevel.HIGH

    def test_boundary_critical(self):
        policy = load_policy()
        assert classify_risk(policy["thresholds"]["critical"]) == RiskLevel.CRITICAL
