from fastapi import APIRouter
import structlog

logger = structlog.get_logger()
router = APIRouter()

# In-memory store for demo
_cases_store: list[dict] = []


@router.get("/cases")
async def list_cases():
    return {"cases": _cases_store, "total": len(_cases_store)}


@router.get("/cases/{case_id}")
async def get_case(case_id: str):
    for case in _cases_store:
        if case.get("case_id") == case_id:
            return case
    return {"error": "Case not found"}


@router.post("/cases/{case_id}/approve")
async def approve_case(case_id: str):
    for case in _cases_store:
        if case.get("case_id") == case_id:
            case["status"] = "approved"
            logger.info("case_approved", case_id=case_id)
            return case
    return {"error": "Case not found"}


@router.post("/cases/{case_id}/dismiss")
async def dismiss_case(case_id: str):
    for case in _cases_store:
        if case.get("case_id") == case_id:
            case["status"] = "dismissed"
            logger.info("case_dismissed", case_id=case_id)
            return case
    return {"error": "Case not found"}
