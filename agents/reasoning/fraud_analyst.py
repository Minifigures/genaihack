import yaml
import structlog
from pathlib import Path
from datetime import datetime
from backend.models.state import VigilState
from backend.models.fraud import FraudFlag, FraudType
from backend.config.settings import Settings
from agents.reasoning.scoring_engine import load_policy

logger = structlog.get_logger()
settings = Settings()

# ODA fee guide reference (subset for demo)
# Version: 2025 ODA Suggested Fee Guide, effective 2025-01-01
ODA_FEE_GUIDE: dict[str, dict] = {
    "11101": {"description": "Exam, recall", "suggested_fee": 78.00},
    "11102": {"description": "Exam, complete", "suggested_fee": 120.00},
    "01202": {"description": "Radiographs, periapical, 2 films", "suggested_fee": 42.00},
    "02202": {"description": "Radiographs, periapical, 2 films", "suggested_fee": 42.00},
    "11111": {"description": "Scaling, first unit", "suggested_fee": 55.00},
    "11117": {"description": "Scaling, additional unit", "suggested_fee": 55.00},
    "43421": {"description": "Root planing, per quadrant", "suggested_fee": 195.00},
    "43427": {"description": "Root planing, 3+ quadrants", "suggested_fee": 185.00},
    "27201": {"description": "Crown, porcelain fused to metal", "suggested_fee": 1100.00},
    "27211": {"description": "Crown, full cast metal", "suggested_fee": 950.00},
    "21111": {"description": "Amalgam restoration, 1 surface", "suggested_fee": 125.00},
    "21112": {"description": "Amalgam restoration, 2 surfaces", "suggested_fee": 160.00},
    "23111": {"description": "Composite restoration, 1 surface, anterior", "suggested_fee": 150.00},
    "23112": {"description": "Composite restoration, 2 surfaces, anterior", "suggested_fee": 190.00},
    "01301": {"description": "Panoramic radiograph", "suggested_fee": 85.00},
    "01401": {"description": "Full mouth series", "suggested_fee": 155.00},
    "32111": {"description": "Extraction, single tooth", "suggested_fee": 135.00},
    "32211": {"description": "Surgical extraction", "suggested_fee": 245.00},
    "25201": {"description": "Prefabricated crown, primary", "suggested_fee": 240.00},
    "41101": {"description": "Pulpotomy", "suggested_fee": 180.00},
    "33111": {"description": "Extraction, deciduous tooth", "suggested_fee": 95.00},
}
ODA_FEE_GUIDE_VERSION = "2025"
ODA_FEE_GUIDE_EFFECTIVE = "2025-01-01"

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
        policy = load_policy()
        fee_tol = policy["fee_deviation_tolerance"]
        confidence_defaults = policy["confidence_defaults"]
        unbundling_rules = policy["unbundling_rules"]

        high_risk_codes = set(fee_tol["high_risk_codes"])
        default_tolerance = fee_tol["default"]
        high_risk_tolerance = fee_tol["high_risk_tolerance"]

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

            # Use stricter tolerance for high-risk codes
            tolerance = high_risk_tolerance if proc.code in high_risk_codes else default_tolerance

            # Check fee deviation against policy-driven tolerance
            if deviation > tolerance:
                flags.append(FraudFlag(
                    fraud_type=FraudType.FEE_DEVIATION,
                    code=proc.code,
                    billed_fee=proc.fee_charged,
                    suggested_fee=suggested_fee,
                    deviation_pct=round(deviation, 3),
                    confidence=confidence_defaults["fee_deviation"],
                    evidence=f"Fee ${proc.fee_charged:.2f} exceeds ODA guide ${suggested_fee:.2f} by {deviation*100:.1f}% (tolerance: {tolerance*100:.0f}%)",
                ))

            # Check for upcoding
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
                            confidence=confidence_defaults["upcoding"],
                            evidence=(
                                f"Procedure {proc.code} ({guide_entry['description']}) may be upcoded from "
                                f"{cheaper_code} ({cheaper_entry['description']}). "
                                f"Billed ${proc.fee_charged:.2f} vs typical ${cheaper_entry['suggested_fee']:.2f}"
                            ),
                        ))

        # Check for duplicate claims (same code + same tooth billed multiple times)
        from collections import Counter
        proc_keys = [(p.code, p.tooth_number or "") for p in procedures]
        for key, count in Counter(proc_keys).items():
            if count > 1 and key[1]:  # Only flag if same tooth
                code, tooth = key
                entry = ODA_FEE_GUIDE.get(code, {})
                billed_total = sum(p.fee_charged for p in procedures if p.code == code and (p.tooth_number or "") == tooth)
                flags.append(FraudFlag(
                    fraud_type=FraudType.DUPLICATE_CLAIM,
                    code=code,
                    billed_fee=billed_total,
                    suggested_fee=entry.get("suggested_fee"),
                    deviation_pct=round((billed_total / entry["suggested_fee"] - 1), 3) if entry.get("suggested_fee") else None,
                    confidence=confidence_defaults.get("duplicate_claim", 0.80),
                    evidence=f"Procedure {code} billed {count} times for tooth {tooth}",
                ))

        # Check for unbundling
        code_set = {p.code for p in procedures}
        min_units = unbundling_rules["min_scaling_units"]
        bundled_units = unbundling_rules["bundled_units"]

        if "11101" in code_set and "11117" in code_set:
            scaling_count = sum(1 for p in procedures if p.code == "11117")
            if scaling_count >= min_units:
                scaling_fee = ODA_FEE_GUIDE["11117"]["suggested_fee"]
                total_scaling_fee = sum(p.fee_charged for p in procedures if p.code == "11117")
                expected_fee = scaling_fee * bundled_units
                flags.append(FraudFlag(
                    fraud_type=FraudType.UNBUNDLING,
                    code="11117",
                    billed_fee=total_scaling_fee,
                    suggested_fee=expected_fee,
                    deviation_pct=round((total_scaling_fee - expected_fee) / expected_fee, 3),
                    confidence=confidence_defaults["unbundling"],
                    evidence=f"Multiple scaling units ({scaling_count}) billed separately, may represent unbundled comprehensive cleaning",
                ))

        duration = int((datetime.utcnow() - start).total_seconds() * 1000)
        logger.info("agent_complete", agent="fraud_analyst", duration_ms=duration, flags=len(flags))

        return {
            "fraud_flags": flags,
            "agent_traces": [{
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
            "errors": [f"fraud_analyst: {str(e)}"],
            "agent_traces": [{
                "agent": "fraud_analyst",
                "event": "error",
                "message": str(e),
                "duration_ms": None,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }
