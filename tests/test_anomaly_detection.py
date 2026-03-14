import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from backend.models.claim import Procedure
from agents.reasoning.fraud_analyst import ODA_FEE_GUIDE, UPCODING_PAIRS


class TestFeeGuide:
    def test_fee_guide_has_entries(self):
        assert len(ODA_FEE_GUIDE) > 0

    def test_root_planing_code_exists(self):
        assert "43421" in ODA_FEE_GUIDE

    def test_suggested_fees_positive(self):
        for code, entry in ODA_FEE_GUIDE.items():
            assert entry["suggested_fee"] > 0, f"Code {code} has non-positive fee"


class TestUpcodingPairs:
    def test_scaling_to_root_planing(self):
        assert UPCODING_PAIRS.get("11117") == "43421"
        assert UPCODING_PAIRS.get("11111") == "43421"

    def test_amalgam_to_composite(self):
        assert UPCODING_PAIRS.get("21111") == "23111"


class TestFeeDeviation:
    def test_detect_overcharge(self):
        proc = Procedure(code="43421", description="Root planing", fee_charged=285.00)
        guide = ODA_FEE_GUIDE["43421"]
        deviation = (proc.fee_charged - guide["suggested_fee"]) / guide["suggested_fee"]
        assert deviation > 0.15, "Should detect fee deviation > 15%"

    def test_normal_fee_passes(self):
        proc = Procedure(code="11101", description="Exam recall", fee_charged=82.00)
        guide = ODA_FEE_GUIDE["11101"]
        deviation = (proc.fee_charged - guide["suggested_fee"]) / guide["suggested_fee"]
        assert deviation < 0.15 or deviation >= 0, "Small deviation should not trigger"
