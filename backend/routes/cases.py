from fastapi import APIRouter, Depends
import structlog
from backend.auth import get_current_user

logger = structlog.get_logger()
router = APIRouter()

# In-memory store for demo
_cases_store: list[dict] = [
    {
        "case_id": "CASE-2025-001",
        "claim_id": "CLM-1002-DEMO",
        "student_id": "STU-002",
        "provider_id": "PRV-003",
        "fraud_score": {
            "score": 87.5,
            "level": "critical",
            "breakdown": {
                "fee_deviation": 35.0,
                "code_risk": 20.0,
                "provider_history": 15.0,
                "pattern_bonus": 17.5,
                "confidence_adj": 1.0
            }
        },
        "flags": [
            {
                "fraud_type": "upcoding",
                "code": "43421",
                "billed_fee": 350.0,
                "suggested_fee": 195.0,
                "deviation_pct": 0.795,
                "confidence": 0.85,
                "evidence": "Procedure 43421 (Root planing, per quadrant) may be upcoded from 11111. Billed $350.00 vs typical $195.00"
            }
        ],
        "status": "open"
    }
]

# Fraud score threshold for auto-creating a case (matches fraud_policy.yaml "high")
_HIGH_FRAUD_THRESHOLD = 51


def add_case(case: dict) -> None:
    """Called by the claims pipeline when a HIGH/CRITICAL risk claim is detected."""
    _cases_store.append(case)


@router.get("/cases")
async def list_cases(user: dict = Depends(get_current_user)):
    import os
    if os.environ.get("DEMO_MODE", "false").lower() == "true":
        return {"cases": _cases_store, "total": len(_cases_store)}
    user_cases = [c for c in _cases_store if c.get("student_id") == user["sub"]]
    return {"cases": user_cases, "total": len(user_cases)}


@router.get("/cases/{case_id}")
async def get_case(case_id: str, user: dict = Depends(get_current_user)):
    for case in _cases_store:
        if case.get("case_id") == case_id and case.get("student_id") == user["sub"]:
            return case
    return {"error": "Case not found"}


@router.post("/cases/{case_id}/approve")
async def approve_case(case_id: str, user: dict = Depends(get_current_user)):
    for case in _cases_store:
        if case.get("case_id") == case_id and case.get("student_id") == user["sub"]:
            case["status"] = "approved"
            logger.info("case_approved", case_id=case_id)
            return case
    return {"error": "Case not found"}


@router.post("/cases/{case_id}/dismiss")
async def dismiss_case(case_id: str, user: dict = Depends(get_current_user)):
    for case in _cases_store:
        if case.get("case_id") == case_id and case.get("student_id") == user["sub"]:
            case["status"] = "dismissed"
            logger.info("case_dismissed", case_id=case_id)
            return case
    return {"error": "Case not found"}
