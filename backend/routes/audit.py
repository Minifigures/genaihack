from fastapi import APIRouter
import structlog

from backend.store import store

logger = structlog.get_logger()
router = APIRouter()


@router.get("/audit")
async def list_audit_logs(limit: int = 50, offset: int = 0):
    entries = await store.get_audit_log(limit=limit, offset=offset)
    # TODO: We need a count query for accurate total, simplifying for now
    return {"entries": entries, "total": len(entries), "limit": limit, "offset": offset}