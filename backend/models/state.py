from typing import TypedDict, Optional
from backend.models.claim import OCRResult, NormalizedClaim, EnrichedClaim
from backend.models.fraud import FraudFlag, FraudScore
from backend.models.benefits import BenefitsReport


class HealthSignals(TypedDict):
    treatments: list[dict]
    gaps: list[dict]


class ActionPlan(TypedDict):
    plan_id: str
    name: str
    steps: list[str]
    expected_savings: float
    effort_required: float
    fraud_severity: float
    confidence: float


class RankedPlan(TypedDict):
    plan: ActionPlan
    priority_score: float


class AgentTrace(TypedDict):
    agent: str
    event: str
    message: str
    duration_ms: Optional[int]
    timestamp: str


class VigilState(TypedDict):
    # Input
    receipt_image: bytes
    student_id: str

    # Perception outputs
    ocr_result: Optional[OCRResult]
    normalized_claim: Optional[NormalizedClaim]
    enriched_claim: Optional[EnrichedClaim]
    claim_id: Optional[str]

    # Reasoning outputs
    fraud_flags: list[FraudFlag]
    health_signals: Optional[HealthSignals]
    fraud_score: Optional[FraudScore]

    # Planning outputs
    benefits_report: Optional[BenefitsReport]
    action_plans: list[ActionPlan]
    ranked_plans: list[RankedPlan]

    # Action outputs
    report_html: Optional[str]
    compliance_approved: bool
    case_id: Optional[str]

    # Metadata
    errors: list[str]
    agent_traces: list[AgentTrace]
