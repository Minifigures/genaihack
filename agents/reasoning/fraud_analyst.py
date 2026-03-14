import structlog
from datetime import datetime
from backend.models.state import VigilState
from backend.models.fraud import FraudFlag, FraudType
from backend.config.settings import Settings

logger = structlog.get_logger()
settings = Settings()

# ODA fee guide reference (subset for demo, full data in Snowflake)
ODA_FEE_GUIDE: dict[str, dict] = {
    "11101": {"description": "Exam, recall", "suggested_fee": 78.00},
    "11102": {"description": "Exam, complete", "suggested_fee": 120.00},
    "01202": {"description": "Radiographs, periapical, 2 films", "suggested_fee": 42.00},
    "02202": {"description": "Radiographs, periapical, 2 films", "suggested_fee": 42.00},
    "11111": {"description": "Scaling, first unit", "suggested_fee": 55.00},
    "11117": {"description": "Scaling, additional unit", "suggested_fee": 55.00},
    "43421": {"description": "Root planing, per quadrant", "suggested_fee": 195.00},
    "43427": {"description": "Root planing, 3+ quadrants", "suggested_fee": 185.00},
    "27201": {"description": "Crown, porcelain", "suggested_fee": 1100.00},
    "27211": {"description": "Crown, metal", "suggested_fee": 950.00},
    "21111": {"description": "Amalgam, 1 surface", "suggested_fee": 125.00},
    "21112": {"description": "Amalgam, 2 surfaces", "suggested_fee": 160.00},
    "23111": {"description": "Composite, 1 surface, anterior", "suggested_fee": 150.00},
    "23112": {"description": "Composite, 2 surfaces, anterior", "suggested_fee": 190.00},
}

# Known upcoding pairs (cheaper code -> expensive code)
UPCODING_PAIRS: dict[str, str] = {
    "11117": "43421",  # scaling -> root planing
    "11111": "43421",  # scaling -> root planing
    "21111": "23111",  # amalgam -> composite
}


async def run_fraud_analyst(state: VigilState) -> dict:
    start = datetime.utcnow()
    logger.info("agent_start", agent="fraud_analyst")

    try:
        enriched = state.get("enriched_claim")
        ocr_result = state.get("ocr_result")
        if enriched is None and ocr_result is None:
            raise ValueError("No claim data available for fraud analysis")

        procedures = enriched.procedures if enriched else (ocr_result.procedures if ocr_result else [])
        flags: list[FraudFlag] = []

        for proc in procedures:
            guide_entry = ODA_FEE_GUIDE.get(proc.code)
            if guide_entry is None:
                continue

            suggested_fee = guide_entry["suggested_fee"]
            if suggested_fee > 0:
                deviation = (proc.fee_charged - suggested_fee) / suggested_fee
            else:
                deviation = 0.0

            # Check fee deviation
            if deviation > 0.15:
                flags.append(FraudFlag(
                    fraud_type=FraudType.FEE_DEVIATION,
                    code=proc.code,
                    billed_fee=proc.fee_charged,
                    suggested_fee=suggested_fee,
                    deviation_pct=round(deviation, 3),
                    confidence=0.85,
                    evidence=f"Fee ${proc.fee_charged:.2f} exceeds ODA guide ${suggested_fee:.2f} by {deviation*100:.1f}%",
                ))

            # Check for upcoding (expensive code billed when cheaper is typical)
            if proc.code in UPCODING_PAIRS.values():
                cheaper_code = next(
                    (k for k, v in UPCODING_PAIRS.items() if v == proc.code),
                    None,
                )
                if cheaper_code:
                    cheaper_entry = ODA_FEE_GUIDE.get(cheaper_code)
                    if cheaper_entry:
                        flags.append(FraudFlag(
                            fraud_type=FraudType.UPCODING,
                            code=proc.code,
                            billed_fee=proc.fee_charged,
                            suggested_fee=cheaper_entry["suggested_fee"],
                            deviation_pct=round(
                                (proc.fee_charged - cheaper_entry["suggested_fee"]) / cheaper_entry["suggested_fee"],
                                3,
                            ),
                            confidence=0.75,
                            evidence=(
                                f"Procedure {proc.code} ({guide_entry['description']}) may be upcoded from "
                                f"{cheaper_code} ({cheaper_entry['description']}). "
                                f"Billed ${proc.fee_charged:.2f} vs typical ${cheaper_entry['suggested_fee']:.2f}"
                            ),
                        ))

        # Check for unbundling (multiple codes that should be a single bundled code)
        code_set = {p.code for p in procedures}
        if "11101" in code_set and "11117" in code_set:
            scaling_count = sum(1 for p in procedures if p.code == "11117")
            if scaling_count >= 3:
                total_scaling_fee = sum(p.fee_charged for p in procedures if p.code == "11117")
                flags.append(FraudFlag(
                    fraud_type=FraudType.UNBUNDLING,
                    code="11117",
                    billed_fee=total_scaling_fee,
                    suggested_fee=55.00 * 2,
                    deviation_pct=round((total_scaling_fee - 110.0) / 110.0, 3),
                    confidence=0.70,
                    evidence=f"Multiple scaling units ({scaling_count}) billed separately, may represent unbundled comprehensive cleaning",
                ))

        duration = int((datetime.utcnow() - start).total_seconds() * 1000)
        logger.info("agent_complete", agent="fraud_analyst", duration_ms=duration, flags=len(flags))

        return {
            "fraud_flags": state.get("fraud_flags", []) + flags,
            "agent_traces": state.get("agent_traces", []) + [{
                "agent": "fraud_analyst",
                "event": "complete",
                "message": f"Found {len(flags)} fraud flags across {len(procedures)} procedures",
                "duration_ms": duration,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }

    except Exception as e:
        logger.error("agent_error", agent="fraud_analyst", error=str(e))
        return {
            "errors": state.get("errors", []) + [f"fraud_analyst: {str(e)}"],
            "agent_traces": state.get("agent_traces", []) + [{
                "agent": "fraud_analyst",
                "event": "error",
                "message": str(e),
                "duration_ms": None,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }
