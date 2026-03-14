from fastapi import APIRouter
import structlog

logger = structlog.get_logger()
router = APIRouter()

DEMO_PROVIDERS: list[dict] = [
    {
        "provider_id": "PRV-001",
        "provider_name": "Dr. Smith Dental Clinic",
        "address": "123 University Ave, Toronto, ON",
        "total_claims": 47,
        "flagged_claims": 12,
        "avg_fee_deviation": 0.23,
        "risk_tier": "flagged_multiple",
        "common_fraud_types": ["upcoding", "fee_deviation"],
        "last_claim_date": "2025-01-15",
    },
    {
        "provider_id": "PRV-002",
        "provider_name": "Campus Dental Care",
        "address": "45 St. George St, Toronto, ON",
        "total_claims": 120,
        "flagged_claims": 3,
        "avg_fee_deviation": 0.05,
        "risk_tier": "clean",
        "common_fraud_types": [],
        "last_claim_date": "2025-01-20",
    },
    {
        "provider_id": "PRV-003",
        "provider_name": "Downtown Dental Group",
        "address": "789 Bay St, Toronto, ON",
        "total_claims": 89,
        "flagged_claims": 28,
        "avg_fee_deviation": 0.35,
        "risk_tier": "confirmed_fraud",
        "common_fraud_types": ["upcoding", "unbundling", "phantom_billing"],
        "last_claim_date": "2025-01-18",
    },
    {
        "provider_id": "PRV-004",
        "provider_name": "Smile Bright Dentistry",
        "address": "200 Bloor St W, Toronto, ON",
        "total_claims": 65,
        "flagged_claims": 5,
        "avg_fee_deviation": 0.12,
        "risk_tier": "flagged_once",
        "common_fraud_types": ["fee_deviation"],
        "last_claim_date": "2025-01-22",
    },
]


@router.get("/providers")
async def list_providers():
    return {"providers": DEMO_PROVIDERS, "total": len(DEMO_PROVIDERS)}


@router.get("/providers/{provider_id}")
async def get_provider(provider_id: str):
    for provider in DEMO_PROVIDERS:
        if provider["provider_id"] == provider_id:
            return provider
    return {"error": "Provider not found"}
