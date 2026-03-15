from fastapi import APIRouter
import structlog

from backend.store import store

logger = structlog.get_logger()
router = APIRouter()


@router.get("/cases")
async def list_cases():
    cases = await store.get_cases()
    return {"cases": cases, "total": len(cases)}


@router.get("/cases/{case_id}")
async def get_case(case_id: str):
    case = await store.get_case(case_id)
    if case is None:
        return {"error": "Case not found"}
    return case


@router.post("/cases/{case_id}/approve")
async def approve_case(case_id: str):
    success = await store.update_case_status(case_id, "approved")
    if not success:
        return {"error": "Case not found"}
    case = await store.get_case(case_id)
    logger.info("case_approved", case_id=case_id)
    return case


@router.post("/cases/{case_id}/dismiss")
async def dismiss_case(case_id: str):
    success = await store.update_case_status(case_id, "dismissed")
    if not success:
        return {"error": "Case not found"}
    case = await store.get_case(case_id)
    logger.info("case_dismissed", case_id=case_id)
    return case