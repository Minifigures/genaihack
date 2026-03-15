"""Tests for the perception layer agents."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from datetime import date, timedelta
from unittest.mock import patch

import pytest

from agents.perception.normalizer import (
    FEE_GUIDE,
    _validate_date,
    _validate_fees,
    _validate_total,
    get_category,
)
from backend.models.claim import EnrichedClaim, NormalizedClaim, OCRResult, Procedure

# ──────────────────────────── Normalizer ────────────────────────────


class TestGetCategory:
    def test_diagnostic(self):
        assert get_category("01201") == "diagnostic"

    def test_preventive(self):
        assert get_category("11101") == "preventive"

    def test_restorative(self):
        assert get_category("21111") == "restorative"

    def test_endodontic(self):
        assert get_category("33211") == "endodontic"

    def test_periodontic(self):
        assert get_category("43421") == "periodontic"

    def test_oral_surgery(self):
        assert get_category("71101") == "oral_surgery"

    def test_invalid_code(self):
        assert get_category("abc") == "unknown"

    def test_empty_code(self):
        assert get_category("") == "unknown"

    def test_short_code(self):
        assert get_category("111") == "unknown"


class TestFeeGuideLoaded:
    def test_fee_guide_has_entries(self):
        assert len(FEE_GUIDE) > 0, "Fee guide should be pre-loaded"

    def test_known_code(self):
        assert "11101" in FEE_GUIDE
        assert FEE_GUIDE["11101"]["suggested_fee"] == 78.00


class TestValidateDate:
    def test_valid_recent_date(self):
        recent = date.today() - timedelta(days=30)
        assert _validate_date(recent) == []

    def test_future_date_warned(self):
        future = date.today() + timedelta(days=5)
        warnings = _validate_date(future)
        assert len(warnings) == 1
        assert "future" in warnings[0].lower()

    def test_old_date_warned(self):
        old = date.today() - timedelta(days=400)
        warnings = _validate_date(old)
        assert len(warnings) == 1
        assert "old" in warnings[0].lower() or "365" in warnings[0]

    def test_today_valid(self):
        assert _validate_date(date.today()) == []


class TestValidateFees:
    def test_known_code_reasonable_fee(self):
        proc = Procedure(code="11101", description="Exam", fee_charged=80.00)
        warnings = _validate_fees([proc], {"11101": "preventive"})
        assert warnings == []

    def test_known_code_over_threshold(self):
        # ODA fee for 11101 is $78, so 2× = $156. $200 exceeds threshold.
        proc = Procedure(code="11101", description="Exam", fee_charged=200.00)
        warnings = _validate_fees([proc], {"11101": "preventive"})
        assert len(warnings) == 1
        assert "exceeds" in warnings[0].lower()

    def test_unknown_code_warned(self):
        proc = Procedure(code="99999", description="Unknown", fee_charged=50.00)
        warnings = _validate_fees([proc], {"99999": "unknown"})
        assert len(warnings) == 1
        assert "not found" in warnings[0].lower()

    def test_placeholder_code_not_warned(self):
        proc = Procedure(
            code="00000", description="Unknown procedure", fee_charged=50.00
        )
        warnings = _validate_fees([proc], {"00000": "unknown"})
        assert warnings == []


class TestValidateTotal:
    def test_matching_total(self):
        procs = [
            Procedure(code="11101", description="Exam", fee_charged=80.00),
            Procedure(code="11111", description="Scaling", fee_charged=55.00),
        ]
        assert _validate_total(procs, 135.00) == []

    def test_mismatched_total(self):
        procs = [
            Procedure(code="11101", description="Exam", fee_charged=80.00),
        ]
        warnings = _validate_total(procs, 200.00)
        assert len(warnings) == 1
        assert "does not match" in warnings[0].lower()

    def test_close_enough_total(self):
        """$0.50 difference should be OK (within $1 tolerance)."""
        procs = [
            Procedure(code="11101", description="Exam", fee_charged=80.00),
        ]
        assert _validate_total(procs, 80.50) == []


class TestRunNormalizer:
    @pytest.mark.asyncio
    async def test_normalizer_demo_flow(self):
        from agents.perception.normalizer import run_normalizer

        ocr = OCRResult(
            provider_name="Test Dental",
            claim_date=date.today() - timedelta(days=10),
            procedures=[
                Procedure(code="11101", description="Exam", fee_charged=82.00),
                Procedure(code="11111", description="Scaling", fee_charged=57.00),
            ],
            subtotal=139.00,
            total=139.00,
            ocr_confidence=0.95,
            raw_text="test receipt",
        )
        state = {"ocr_result": ocr, "student_id": "STU-001"}
        result = await run_normalizer(state)

        assert "normalized_claim" in result
        assert result["normalized_claim"].student_id == "STU-001"
        assert len(result["normalized_claim"].procedures) == 2

    @pytest.mark.asyncio
    async def test_normalizer_negative_fee_removed(self):
        from agents.perception.normalizer import run_normalizer

        ocr = OCRResult(
            provider_name="Test Dental",
            claim_date=date.today(),
            procedures=[
                Procedure(code="11101", description="Exam", fee_charged=82.00),
                Procedure(code="11111", description="Scaling", fee_charged=-10.00),
            ],
            subtotal=72.00,
            total=72.00,
            ocr_confidence=0.90,
            raw_text="test",
        )
        state = {"ocr_result": ocr, "student_id": "STU-001"}
        result = await run_normalizer(state)
        # Negative fee should be dropped
        assert len(result["normalized_claim"].procedures) == 1
        assert any("negative" in w.lower() for w in result["normalized_claim"].warnings)


# ──────────────────────── History Enricher ──────────────────────────


class TestHistoryEnricherDemo:
    @pytest.mark.asyncio
    async def test_demo_mode_returns_enriched(self):
        with patch("agents.perception.history_enricher.settings") as mock_settings:
            mock_settings.demo_mode = True
            from agents.perception.history_enricher import run_history_enricher

            normalized = NormalizedClaim(
                claim_id="test-123",
                student_id="STU-001",
                claim_date=date.today(),
                procedures=[
                    Procedure(code="11101", description="Exam", fee_charged=82.00)
                ],
                total=82.00,
                ocr_confidence=0.95,
                category_codes={"11101": "preventive"},
            )
            ocr = OCRResult(
                provider_name="Test Dental",
                claim_date=date.today(),
                procedures=[],
                subtotal=82.00,
                total=82.00,
                ocr_confidence=0.95,
                raw_text="test",
            )
            state = {
                "normalized_claim": normalized,
                "ocr_result": ocr,
                "student_id": "STU-001",
            }
            result = await run_history_enricher(state)

            assert "enriched_claim" in result
            assert result["enriched_claim"].past_claims_at_provider == 3
            assert result["enriched_claim"].total_claims_this_year == 7


# ──────────────────────────── Persister ─────────────────────────────


class TestPersisterDemo:
    @pytest.mark.asyncio
    async def test_demo_mode_no_crash(self):
        with patch("agents.perception.persister.settings") as mock_settings:
            mock_settings.demo_mode = True
            from agents.perception.persister import run_persister

            enriched = EnrichedClaim(
                claim_id="test-456",
                student_id="STU-001",
                claim_date=date.today(),
                procedures=[
                    Procedure(code="11101", description="Exam", fee_charged=82.00)
                ],
                total=82.00,
                ocr_confidence=0.95,
                category_codes={"11101": "preventive"},
                past_claims_at_provider=3,
                total_claims_this_year=7,
            )
            state = {"enriched_claim": enriched}
            result = await run_persister(state)

            assert "agent_traces" in result
            assert result["agent_traces"][0]["event"] == "complete"

    @pytest.mark.asyncio
    async def test_skip_when_no_claim(self):
        with patch("agents.perception.persister.settings") as mock_settings:
            mock_settings.demo_mode = True
            from agents.perception.persister import run_persister

            state = {"enriched_claim": None}
            result = await run_persister(state)
            assert result["agent_traces"][0]["event"] == "skip"


# ──────────────────────────── OCR Agent ─────────────────────────────


class TestOCRDemoMode:
    @pytest.mark.asyncio
    async def test_clean_receipt(self):
        from agents.perception.ocr_agent import run_ocr

        with patch("agents.perception.ocr_agent.settings") as mock_settings:
            mock_settings.demo_mode = True
            state = {"receipt_filename": "clean_dental.pdf", "student_id": "STU-001"}
            result = await run_ocr(state)
            assert "ocr_result" in result
            assert len(result["ocr_result"].procedures) == 3

    @pytest.mark.asyncio
    async def test_upcoded_receipt(self):
        from agents.perception.ocr_agent import run_ocr

        with patch("agents.perception.ocr_agent.settings") as mock_settings:
            mock_settings.demo_mode = True
            state = {"receipt_filename": "upcoded_dental.pdf", "student_id": "STU-001"}
            result = await run_ocr(state)
            assert len(result["ocr_result"].procedures) == 4

    @pytest.mark.asyncio
    async def test_unbundled_receipt(self):
        from agents.perception.ocr_agent import run_ocr

        with patch("agents.perception.ocr_agent.settings") as mock_settings:
            mock_settings.demo_mode = True
            state = {
                "receipt_filename": "unbundled_dental.pdf",
                "student_id": "STU-001",
            }
            result = await run_ocr(state)
            assert len(result["ocr_result"].procedures) == 7


class TestConfidenceScoring:
    def test_confidence_heuristic(self):
        from agents.perception.ocr_agent import _compute_confidence

        parsed = {
            "provider_name": "Test Dental",
            "claim_date": "2025-01-15",
            "total": 100.0,
            "procedures": [
                {"code": "11101", "description": "Exam", "fee_charged": 80.0}
            ],
        }
        score = _compute_confidence(parsed)
        assert 0.9 <= score <= 1.0

    def test_confidence_low_for_empty(self):
        from agents.perception.ocr_agent import _compute_confidence

        parsed = {"procedures": []}
        score = _compute_confidence(parsed)
        assert score == 0.5  # just base


class TestCodeFenceStripping:
    def test_strip_json_fences(self):
        from agents.perception.ocr_agent import _strip_code_fences

        text = '```json\n{"key": "value"}\n```'
        assert _strip_code_fences(text) == '{"key": "value"}'

    def test_strip_plain_fences(self):
        from agents.perception.ocr_agent import _strip_code_fences

        text = '```\n{"key": "value"}\n```'
        assert _strip_code_fences(text) == '{"key": "value"}'

    def test_no_fences_passthrough(self):
        from agents.perception.ocr_agent import _strip_code_fences

        text = '{"key": "value"}'
        assert _strip_code_fences(text) == '{"key": "value"}'
