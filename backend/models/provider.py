from pydantic import BaseModel
from typing import Optional


class ProviderStats(BaseModel):
    provider_id: str
    provider_name: str
    address: Optional[str] = None
    total_claims: int
    flagged_claims: int
    avg_fee_deviation: float
    risk_tier: str              # "clean", "flagged_once", "flagged_multiple", "confirmed_fraud"
    common_fraud_types: list[str]
    last_claim_date: Optional[str] = None
