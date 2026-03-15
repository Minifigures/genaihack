from fastapi import APIRouter
import structlog

from backend.services.clinic_scraper import scrape_clinics

logger = structlog.get_logger()
router = APIRouter()


@router.get("/clinics")
async def list_clinics():
    clinics = await scrape_clinics()
    return {"clinics": clinics, "total": len(clinics)}
