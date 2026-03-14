import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from agents.planning.optimization_engine import compute_priority_score
from backend.models.state import ActionPlan


def _make_plan(
    savings: float = 100.0,
    effort: float = 3.0,
    severity: float = 0.8,
    confidence: float = 0.9,
) -> ActionPlan:
    return ActionPlan(
        plan_id="test-plan",
        name="Test Plan",
        steps=["Step 1"],
        expected_savings=savings,
        effort_required=effort,
        fraud_severity=severity,
        confidence=confidence,
    )


class TestComputePriorityScore:
    def test_basic_score(self):
        plan = _make_plan(savings=100, effort=3, severity=0.8, confidence=0.9)
        score = compute_priority_score(plan)
        expected = (100 * 0.8 * 0.9) / (3 + 1)
        assert score == round(expected, 2)

    def test_zero_savings_uses_baseline(self):
        plan = _make_plan(savings=0, effort=1, severity=0.5, confidence=0.8)
        score = compute_priority_score(plan)
        assert score > 0, "Plans with no direct savings should still get a score"

    def test_higher_savings_higher_score(self):
        low = compute_priority_score(_make_plan(savings=50))
        high = compute_priority_score(_make_plan(savings=200))
        assert high > low

    def test_higher_effort_lower_score(self):
        easy = compute_priority_score(_make_plan(effort=1))
        hard = compute_priority_score(_make_plan(effort=5))
        assert easy > hard

    def test_higher_severity_higher_score(self):
        low = compute_priority_score(_make_plan(severity=0.3))
        high = compute_priority_score(_make_plan(severity=0.9))
        assert high > low
