from fastapi import APIRouter
import structlog

from backend.store import store

logger = structlog.get_logger()
router = APIRouter()


@router.get("/providers")
async def list_providers():
    providers = await store.get_providers()
    return {"providers": providers, "total": len(providers)}


@router.get("/providers/{provider_id}")
async def get_provider(provider_id: str):
    provider = await store.get_provider(provider_id)
    if provider is None:
        return {"error": "Provider not found"}
    return provider