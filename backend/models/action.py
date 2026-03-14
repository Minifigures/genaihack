from pydantic import BaseModel


class ActionPlan(BaseModel):
    plan_id: str
    name: str
    steps: list[str]
    expected_savings: float
    effort_required: float
    fraud_severity: float
    confidence: float


class RankedPlan(BaseModel):
    plan: ActionPlan
    priority_score: float
