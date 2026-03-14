from fastapi import APIRouter
import structlog

logger = structlog.get_logger()
router = APIRouter()

# In-memory audit log for demo
_audit_log: list[dict] = []


def add_audit_entry(entry: dict) -> None:
    _audit_log.append(entry)


@router.get("/audit")
async def list_audit_logs(limit: int = 50, offset: int = 0):
    total = len(_audit_log)
    entries = _audit_log[offset:offset + limit]
    return {"entries": entries, "total": total, "limit": limit, "offset": offset}
