from pydantic import BaseModel
from typing import Optional
from datetime import date


class Procedure(BaseModel):
    code: str                    # CDA 5-digit code e.g. "11111"
    description: str             # e.g. "Scaling, first unit"
    fee_charged: float           # What the provider billed
    tooth_number: Optional[str] = None


class OCRResult(BaseModel):
    provider_name: str
    provider_address: Optional[str] = None
    claim_date: date
    procedures: list[Procedure]
    subtotal: float
    tax: Optional[float] = None
    total: float
    ocr_confidence: float        # 0.0-1.0
    raw_text: str                # Full extracted text for audit


class NormalizedClaim(BaseModel):
    claim_id: str                # UUID
    student_id: str
    provider_id: Optional[str] = None
    claim_date: date
    procedures: list[Procedure]
    total: float
    ocr_confidence: float
    category_codes: dict[str, str]  # code -> category mapping
    warnings: list[str] = []     # Validation warnings from normalizer


class EnrichedClaim(NormalizedClaim):
    past_claims_at_provider: int
    total_claims_this_year: int
    provider_avg_fee_deviation: Optional[float] = None
    student_coverage_used_ytd: Optional[dict[str, float]] = None
