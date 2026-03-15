from fastapi import APIRouter, Depends
from fastapi.responses import Response
import structlog
from backend.auth import get_current_user

from backend.store import store
from backend.services.dispute_letter import generate_dispute_letter

logger = structlog.get_logger()
router = APIRouter()


@router.get("/cases")
async def list_cases(user: dict = Depends(get_current_user)):
    cases = await store.get_cases()
    return {"cases": cases, "total": len(cases)}


@router.get("/cases/{case_id}")
async def get_case(case_id: str, user: dict = Depends(get_current_user)):
    case = await store.get_case(case_id)
    if case is None:
        return {"error": "Case not found"}
    return case


@router.post("/cases/{case_id}/approve")
async def approve_case(case_id: str, user: dict = Depends(get_current_user)):
    success = await store.update_case_status(case_id, "approved")
    if not success:
        return {"error": "Case not found"}
    case = await store.get_case(case_id)
    logger.info("case_approved", case_id=case_id)
    return case


@router.post("/cases/{case_id}/dismiss")
async def dismiss_case(case_id: str, user: dict = Depends(get_current_user)):
    success = await store.update_case_status(case_id, "dismissed")
    if not success:
        return {"error": "Case not found"}
    case = await store.get_case(case_id)
    logger.info("case_dismissed", case_id=case_id)
    return case


# Student name lookup for dispute letters
STUDENT_NAMES = {
    "STU-001": "Alex Chen",
    "STU-002": "Jordan Williams",
    "STU-003": "Priya Patel",
}

# Provider name lookup
PROVIDER_NAMES = {
    "PRV-001": "Dr. Smith Dental Clinic",
    "PRV-002": "Campus Dental Care",
    "PRV-003": "Downtown Dental Group",
    "PRV-004": "Smile Bright Dentistry",
}


@router.get("/cases/{case_id}/dispute-letter")
async def get_dispute_letter(case_id: str, user: dict = Depends(get_current_user)):
    case = await store.get_case(case_id)
    if case is None:
        return {"error": "Case not found"}

    student_id = case.get("student_id", "STU-001")
    student_name = STUDENT_NAMES.get(student_id, student_id)
    provider_id = case.get("provider_id", "")
    provider_name = PROVIDER_NAMES.get(provider_id, provider_id or "Unknown Provider")
    fraud_score = case.get("fraud_score", 0)
    flags = case.get("flags", [])
    claim_date = case.get("created_at", "")[:10] if case.get("created_at") else "N/A"

    pdf_bytes = generate_dispute_letter(
        student_name=student_name,
        student_id=student_id,
        claim_date=claim_date,
        provider_name=provider_name,
        case_id=case_id,
        fraud_score=fraud_score if isinstance(fraud_score, (int, float)) else 0,
        flags=flags if isinstance(flags, list) else [],
    )

    await store.save_audit_entry(
        action="dispute_letter_generated",
        agent="api",
        case_id=case_id,
        student_id=student_id,
    )

    return Response(
        content=bytes(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="dispute-letter-{case_id[:8]}.pdf"',
        },
    )
