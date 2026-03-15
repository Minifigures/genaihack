from pydantic import BaseModel
from typing import Optional
from enum import Enum


class FraudType(str, Enum):
    UPCODING = "upcoding"
    UNBUNDLING = "unbundling"
    PHANTOM_BILLING = "phantom_billing"
    FEE_DEVIATION = "fee_deviation"
    DUPLICATE_CLAIM = "duplicate_claim"


class RiskLevel(str, Enum):
    LOW = "low"
    ELEVATED = "elevated"
    HIGH = "high"
    CRITICAL = "critical"


class FraudFlag(BaseModel):
    fraud_type: FraudType
    code: str
    billed_fee: float
    suggested_fee: Optional[float] = None
    deviation_pct: Optional[float] = None
    confidence: float            # 0.0-1.0
    evidence: str                # Human-readable evidence string


class ScoreBreakdown(BaseModel):
    fee_deviation: float
    code_risk: float
    provider_history: float
    pattern_bonus: float
    confidence_adj: float


class FraudScore(BaseModel):
    score: float                 # 0-100
    level: RiskLevel
    breakdown: ScoreBreakdown


class FraudCase(BaseModel):
    case_id: str
    claim_id: Optional[str] = None  # Optional if OCR fails
    student_id: str
    provider_id: Optional[str] = None
    fraud_score: FraudScore
    flags: list[FraudFlag]
    status: str = "open"         # open, approved, dismissed, resolved
