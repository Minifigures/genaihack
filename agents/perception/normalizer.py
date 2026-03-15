import csv
import uuid
import structlog
from datetime import datetime, date
from pathlib import Path
from backend.models.state import VigilState
from backend.models.claim import NormalizedClaim

logger = structlog.get_logger()

# CDA procedure code category mapping
CODE_CATEGORIES: dict[str, str] = {
    "0": "diagnostic",
    "1": "preventive",
    "2": "restorative",
    "3": "endodontic",
    "4": "periodontic",
    "5": "prosthodontic_removable",
    "6": "prosthodontic_fixed",
    "7": "oral_surgery",
    "8": "orthodontic",
    "9": "adjunctive",
}

# ---------- Fee guide loader ----------

FEE_GUIDE: dict[str, dict] = {}  # code -> {description, category, suggested_fee}

_FEE_GUIDE_PATH = Path(__file__).resolve().parent.parent.parent / "database" / "fee_guide.csv"


def _load_fee_guide() -> None:
    """Load the ODA fee guide CSV into memory once."""
    global FEE_GUIDE
    if FEE_GUIDE:
        return
    try:
        with open(_FEE_GUIDE_PATH, newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                FEE_GUIDE[row["code"]] = {
                    "description": row["description"],
                    "category": row["category"],
                    "suggested_fee": float(row["suggested_fee"]),
                }
        logger.info("fee_guide_loaded", count=len(FEE_GUIDE))
    except FileNotFoundError:
        logger.warning("fee_guide_not_found", path=str(_FEE_GUIDE_PATH))
    except Exception as e:
        logger.error("fee_guide_load_error", error=str(e))


# Load at import time
_load_fee_guide()

# ---------- Helpers ----------

# Max fee deviation multiplier before warning (2× = 100% above guide)
FEE_DEVIATION_THRESHOLD = 2.0
# Max age of a claim in days
MAX_CLAIM_AGE_DAYS = 365


def get_category(code: str) -> str:
    if len(code) == 5 and code.isdigit():
        first_digit = code[0]
        return CODE_CATEGORIES.get(first_digit, "unknown")
    return "unknown"


def _validate_date(claim_date: date) -> list[str]:
    """Validate claim date is not in the future or too old."""
    warnings: list[str] = []
    today = date.today()
    if claim_date > today:
        warnings.append(f"Claim date {claim_date} is in the future")
    elif (today - claim_date).days > MAX_CLAIM_AGE_DAYS:
        warnings.append(f"Claim date {claim_date} is more than {MAX_CLAIM_AGE_DAYS} days old")
    return warnings


def _validate_fees(procedures: list, category_codes: dict[str, str]) -> list[str]:
    """Validate procedure codes exist in fee guide and fees are reasonable."""
    warnings: list[str] = []
    if not FEE_GUIDE:
        return warnings

    for proc in procedures:
        guide_entry = FEE_GUIDE.get(proc.code)
        if guide_entry is None and proc.code != "00000":
            warnings.append(f"Code {proc.code} not found in ODA fee guide")
            continue
        if guide_entry is not None:
            max_acceptable = guide_entry["suggested_fee"] * FEE_DEVIATION_THRESHOLD
            if proc.fee_charged > max_acceptable:
                warnings.append(
                    f"Code {proc.code}: fee ${proc.fee_charged:.2f} exceeds "
                    f"{FEE_DEVIATION_THRESHOLD:.0f}× ODA guide (${guide_entry['suggested_fee']:.2f})"
                )
    return warnings


def _validate_total(procedures: list, total: float) -> list[str]:
    """Cross-check that sum of procedure fees ≈ total."""
    warnings: list[str] = []
    fee_sum = sum(p.fee_charged for p in procedures)
    if abs(fee_sum - total) > 1.00:
        warnings.append(
            f"Total ${total:.2f} does not match sum of procedure fees ${fee_sum:.2f}"
        )
    return warnings


# ---------- Main agent ----------

async def run_normalizer(state: VigilState) -> dict:
    start = datetime.utcnow()
    logger.info("agent_start", agent="normalizer")

    try:
        ocr_result = state.get("ocr_result")
        if ocr_result is None:
            raise ValueError("No OCR result available")

        claim_id = str(uuid.uuid4())
        category_codes: dict[str, str] = {}
        warnings: list[str] = []

        # Validate claim date
        warnings.extend(_validate_date(ocr_result.claim_date))

        validated_procedures = []
        for proc in ocr_result.procedures:
            category = get_category(proc.code)
            category_codes[proc.code] = category

            if proc.fee_charged < 0:
                logger.warning("negative_fee", code=proc.code, fee=proc.fee_charged)
                warnings.append(f"Code {proc.code}: negative fee ${proc.fee_charged:.2f} removed")
                continue

            validated_procedures.append(proc)

        # Validate fees against guide
        warnings.extend(_validate_fees(validated_procedures, category_codes))

        # Cross-check total vs sum of procedures
        warnings.extend(_validate_total(validated_procedures, ocr_result.total))

        if warnings:
            logger.info("normalizer_warnings", count=len(warnings), warnings=warnings)

        normalized = NormalizedClaim(
            claim_id=claim_id,
            student_id=state["student_id"],
            provider_id=None,
            claim_date=ocr_result.claim_date,
            procedures=validated_procedures,
            total=ocr_result.total,
            ocr_confidence=ocr_result.ocr_confidence,
            category_codes=category_codes,
            warnings=warnings,
        )

        duration = int((datetime.utcnow() - start).total_seconds() * 1000)
        logger.info("agent_complete", agent="normalizer", duration_ms=duration, claim_id=claim_id)

        return {
            "normalized_claim": normalized,
            "claim_id": claim_id,
            "agent_traces": [{
                "agent": "normalizer",
                "event": "complete",
                "message": (
                    f"Normalized {len(validated_procedures)} procedures, "
                    f"claim_id={claim_id[:8]}, {len(warnings)} warnings"
                ),
                "duration_ms": duration,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }

    except Exception as e:
        logger.error("agent_error", agent="normalizer", error=str(e))
        return {
            "errors": [f"normalizer: {str(e)}"],
            "agent_traces": [{
                "agent": "normalizer",
                "event": "error",
                "message": str(e),
                "duration_ms": None,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }
