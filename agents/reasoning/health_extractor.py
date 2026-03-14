import structlog
from datetime import datetime
from backend.models.state import VigilState
from backend.config.settings import Settings

logger = structlog.get_logger()
settings = Settings()

# Preventive care schedule (typical recommended intervals)
PREVENTIVE_SCHEDULE: dict[str, dict] = {
    "exam_recall": {"codes": ["11101"], "interval_months": 6, "description": "Regular dental exam"},
    "cleaning": {"codes": ["11111", "11117"], "interval_months": 6, "description": "Professional cleaning"},
    "xrays_bitewing": {"codes": ["02101", "02102"], "interval_months": 12, "description": "Bitewing X-rays"},
    "fluoride": {"codes": ["12101", "12111"], "interval_months": 6, "description": "Fluoride treatment"},
}


async def run_health_extractor(state: VigilState) -> dict:
    start = datetime.utcnow()
    logger.info("agent_start", agent="health_extractor")

    try:
        enriched = state.get("enriched_claim")
        ocr_result = state.get("ocr_result")
        procedures = []
        if enriched:
            procedures = enriched.procedures
        elif ocr_result:
            procedures = ocr_result.procedures

        # Extract treatment signals
        treatments = []
        for proc in procedures:
            treatments.append({
                "code": proc.code,
                "description": proc.description,
                "fee": proc.fee_charged,
                "tooth": proc.tooth_number,
                "category": _categorize_treatment(proc.code),
            })

        # Detect preventive care gaps
        procedure_codes = {p.code for p in procedures}
        gaps = []
        for gap_name, gap_info in PREVENTIVE_SCHEDULE.items():
            if not any(c in procedure_codes for c in gap_info["codes"]):
                gaps.append({
                    "type": gap_name,
                    "description": gap_info["description"],
                    "recommended_interval_months": gap_info["interval_months"],
                    "recommendation": f"Consider scheduling: {gap_info['description']}",
                })

        health_signals = {
            "treatments": treatments,
            "gaps": gaps,
        }

        duration = int((datetime.utcnow() - start).total_seconds() * 1000)
        logger.info(
            "agent_complete",
            agent="health_extractor",
            duration_ms=duration,
            treatments=len(treatments),
            gaps=len(gaps),
        )

        return {
            "health_signals": health_signals,
            "agent_traces": [{
                "agent": "health_extractor",
                "event": "complete",
                "message": f"Extracted {len(treatments)} treatments, found {len(gaps)} preventive care gaps",
                "duration_ms": duration,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }

    except Exception as e:
        logger.error("agent_error", agent="health_extractor", error=str(e))
        return {
            "errors": [f"health_extractor: {str(e)}"],
            "agent_traces": [{
                "agent": "health_extractor",
                "event": "error",
                "message": str(e),
                "duration_ms": None,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }


def _categorize_treatment(code: str) -> str:
    if not code or len(code) < 1:
        return "unknown"
    categories = {
        "0": "diagnostic",
        "1": "preventive",
        "2": "restorative",
        "3": "endodontic",
        "4": "periodontic",
        "5": "prosthodontic",
        "6": "prosthodontic",
        "7": "oral_surgery",
        "8": "orthodontic",
        "9": "adjunctive",
    }
    return categories.get(code[0], "unknown")
