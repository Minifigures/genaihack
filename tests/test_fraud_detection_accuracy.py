"""End-to-end fraud-detection accuracy tests over the full 64-receipt corpus.

Ground truth comes from how the receipts were generated
(scripts/generate_test_receipts.py and scripts/generate_batch2.py):

  - real_01..20    : genuine receipts, fees at/within 10% of the ODA guide  -> must NOT flag
  - fraud_01..20   : each encodes a specific fraud pattern (inflation,
                     upcoding, unbundling, duplicate, phantom)              -> must flag
  - ai_gen_*1..*3  : AI-generated but clean                                 -> must NOT flag
  - ai_gen_*4..*6  : AI-generated, moderate/borderline deviation            -> flag, but not HIGH
  - ai_gen_*7..*0  : AI-generated suspicious upcoding / clear fraud         -> flag as HIGH
  - clean_dental   : clean                                                  -> must NOT flag
  - upcoded_dental / unbundled_dental : named fraud fixtures                -> flag as HIGH

Each receipt is run through the real LangGraph pipeline (OCR in demo mode ->
normalizer -> history enricher -> fraud analyst -> scoring engine). We assert on
the resulting fraud score, risk band, flag count, and detected fraud *types* —
not on incidental implementation details.
"""

import os

# Force keyless demo mode before any agent module instantiates Settings().
os.environ["DEMO_MODE"] = "true"
os.environ["ENABLE_WATSONX"] = "false"

import asyncio

import pytest

from agents.graph import build_graph

# Risk-band thresholds (agents/reasoning/fraud_policy.yaml): low <26, elevated
# 26-50, high 51-75, critical >=76.
ELEVATED = 26
HIGH = 51


def _idx(prefix):
    return [f"{prefix}_{i:02d}.pdf" for i in range(1, 21)]


REAL = _idx("real")
FRAUD = _idx("fraud")
AI_CLEAN = [f"ai_gen_{i:02d}.pdf" for i in (1, 2, 3, 11, 12, 13)]
AI_BORDERLINE = [f"ai_gen_{i:02d}.pdf" for i in (4, 5, 6, 14, 15, 16)]
AI_FRAUD = [f"ai_gen_{i:02d}.pdf" for i in (7, 8, 9, 10, 17, 18, 19, 20)]
NAMED_CLEAN = ["clean_dental.pdf"]
NAMED_FRAUD = ["upcoded_dental.pdf", "unbundled_dental.pdf"]

LEGIT = REAL + AI_CLEAN + NAMED_CLEAN          # 27 receipts that must not be flagged
HIGH_RISK = AI_FRAUD + NAMED_FRAUD             # 10 receipts that must score HIGH
ALL_RECEIPTS = REAL + FRAUD + AI_CLEAN + AI_BORDERLINE + AI_FRAUD + NAMED_CLEAN + NAMED_FRAUD


def _initial_state(filename):
    return {
        "receipt_image": b"demo", "student_id": "STU-001", "receipt_filename": filename,
        "ocr_result": None, "normalized_claim": None, "enriched_claim": None, "claim_id": None,
        "fraud_flags": [], "health_signals": None, "fraud_score": None, "benefits_report": None,
        "action_plans": [], "ranked_plans": [], "watsonx_summary": None, "report_html": None,
        "compliance_approved": False, "case_id": None, "errors": [], "agent_traces": [],
    }


@pytest.fixture(scope="module")
def results():
    """Run every receipt through the pipeline once; cache the outcomes."""
    graph = build_graph()

    async def run_all():
        out = {}
        for filename in ALL_RECEIPTS:
            state = await graph.ainvoke(_initial_state(filename))
            score_obj = state.get("fraud_score")
            flags = state.get("fraud_flags", [])
            types = {
                getattr(f.fraud_type, "value", str(f.fraud_type)) for f in flags
            }
            out[filename] = {
                "score": getattr(score_obj, "score", None) if score_obj else None,
                "level": getattr(getattr(score_obj, "level", None), "value", None),
                "flags": len(flags),
                "types": types,
                "errors": len(state.get("errors", [])),
            }
        return out

    return asyncio.run(run_all())


@pytest.mark.parametrize("filename", ALL_RECEIPTS)
def test_pipeline_runs_clean(results, filename):
    """Every receipt processes end-to-end with no pipeline errors and a score."""
    r = results[filename]
    assert r["errors"] == 0, f"{filename} raised pipeline errors"
    assert r["score"] is not None, f"{filename} produced no fraud score"


@pytest.mark.parametrize("filename", LEGIT)
def test_legitimate_receipts_are_not_flagged(results, filename):
    """Zero false positives: clean receipts raise no flags and score 0."""
    r = results[filename]
    assert r["flags"] == 0, f"{filename} false-positive: {r['flags']} flag(s), types={r['types']}"
    assert r["score"] == 0.0, f"{filename} expected score 0, got {r['score']}"


@pytest.mark.parametrize("filename", FRAUD)
def test_known_fraud_is_detected(results, filename):
    """100% recall on labeled fraud: at least one flag and an elevated+ score."""
    r = results[filename]
    assert r["flags"] >= 1, f"{filename} missed: no fraud flags raised"
    assert r["score"] >= ELEVATED, f"{filename} under-scored at {r['score']} (need >= {ELEVATED})"


@pytest.mark.parametrize("filename", HIGH_RISK)
def test_high_risk_fraud_scores_high(results, filename):
    """Clear-fraud fixtures land in the HIGH band (>=51) with flags."""
    r = results[filename]
    assert r["flags"] >= 1, f"{filename} raised no flags"
    assert r["score"] >= HIGH, f"{filename} scored {r['score']}, expected HIGH (>= {HIGH})"


@pytest.mark.parametrize("filename", AI_BORDERLINE)
def test_ai_generated_borderline_is_flagged_but_not_high(results, filename):
    """Borderline AI receipts: deviation is surfaced but not over-escalated."""
    r = results[filename]
    assert r["flags"] >= 1, f"{filename} borderline deviation went undetected"
    assert 0 < r["score"] < HIGH, (
        f"{filename} scored {r['score']}, expected a non-HIGH deviation (< {HIGH})"
    )


# Receipt -> fraud types the analyst must specifically identify (not just "a flag").
EXPECTED_TYPES = {
    "upcoded_dental.pdf": {"upcoding"},
    "unbundled_dental.pdf": {"unbundling"},
    "fraud_12.pdf": {"upcoding"},        # root planing upcoded from scaling
    "fraud_13.pdf": {"unbundling"},      # 4 scaling units unbundled
    "fraud_15.pdf": {"duplicate_claim"}, # triple composite on one tooth
    "fraud_20.pdf": {"upcoding", "unbundling", "duplicate_claim"},  # comprehensive
}


@pytest.mark.parametrize("filename,expected", EXPECTED_TYPES.items())
def test_fraud_type_is_correctly_identified(results, filename, expected):
    """The analyst names the right fraud mechanism, not just a generic flag."""
    detected = results[filename]["types"]
    missing = expected - detected
    assert not missing, f"{filename}: expected types {expected}, missing {missing} (got {detected})"


def test_fraud_and_legitimate_scores_are_separable(results):
    """The score cleanly separates legitimate receipts from labeled fraud."""
    max_legit = max(results[f]["score"] for f in LEGIT)
    min_fraud = min(results[f]["score"] for f in FRAUD)
    assert max_legit < min_fraud, (
        f"no separation: highest legit score {max_legit} >= lowest fraud score {min_fraud}"
    )


def test_overall_detection_accuracy(results):
    """Binary detection (a flag is raised iff the receipt has a real deviation)
    must be 100% across the corpus: no false positives, no missed fraud."""
    should_flag = set(FRAUD + AI_BORDERLINE + AI_FRAUD + NAMED_FRAUD)   # 36
    should_not_flag = set(LEGIT)                                        # 27

    false_positives = [f for f in should_not_flag if results[f]["flags"] > 0]
    false_negatives = [f for f in should_flag if results[f]["flags"] == 0]

    total = len(should_flag) + len(should_not_flag)
    correct = total - len(false_positives) - len(false_negatives)
    accuracy = correct / total

    print(
        f"\nDetection accuracy: {correct}/{total} = {accuracy:.0%} | "
        f"recall={ (len(should_flag)-len(false_negatives))/len(should_flag):.0%} "
        f"specificity={ (len(should_not_flag)-len(false_positives))/len(should_not_flag):.0%}"
    )
    assert not false_positives, f"false positives on legitimate receipts: {false_positives}"
    assert not false_negatives, f"missed fraud on: {false_negatives}"
    assert accuracy == 1.0
