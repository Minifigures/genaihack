import uuid
import structlog
from datetime import datetime
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


def get_category(code: str) -> str:
    if len(code) == 5 and code.isdigit():
        first_digit = code[0]
        return CODE_CATEGORIES.get(first_digit, "unknown")
    return "unknown"


async def run_normalizer(state: VigilState) -> dict:
    start = datetime.utcnow()
    logger.info("agent_start", agent="normalizer")

    try:
        ocr_result = state.get("ocr_result")
        if ocr_result is None:
            raise ValueError("No OCR result available")

        claim_id = str(uuid.uuid4())
        category_codes: dict[str, str] = {}

        validated_procedures = []
        for proc in ocr_result.procedures:
            category = get_category(proc.code)
            category_codes[proc.code] = category

            if proc.fee_charged < 0:
                logger.warning("negative_fee", code=proc.code, fee=proc.fee_charged)
                continue

            validated_procedures.append(proc)

        normalized = NormalizedClaim(
            claim_id=claim_id,
            student_id=state["student_id"],
            provider_id=None,
            claim_date=ocr_result.claim_date,
            procedures=validated_procedures,
            total=ocr_result.total,
            ocr_confidence=ocr_result.ocr_confidence,
            category_codes=category_codes,
        )

        duration = int((datetime.utcnow() - start).total_seconds() * 1000)
        logger.info("agent_complete", agent="normalizer", duration_ms=duration, claim_id=claim_id)

        return {
            "normalized_claim": normalized,
            "claim_id": claim_id,
            "agent_traces": state.get("agent_traces", []) + [{
                "agent": "normalizer",
                "event": "complete",
                "message": f"Normalized {len(validated_procedures)} procedures, claim_id={claim_id[:8]}",
                "duration_ms": duration,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }

    except Exception as e:
        logger.error("agent_error", agent="normalizer", error=str(e))
        return {
            "errors": state.get("errors", []) + [f"normalizer: {str(e)}"],
            "agent_traces": state.get("agent_traces", []) + [{
                "agent": "normalizer",
                "event": "error",
                "message": str(e),
                "duration_ms": None,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }
