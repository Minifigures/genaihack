from pydantic import BaseModel
from typing import Optional


class CoverageItem(BaseModel):
    category: str               # "dental", "vision", "paramedical", "psychology"
    annual_limit: float
    used_ytd: float
    remaining: float
    coverage_pct: float
    recommendation: Optional[str] = None


class BenefitsReport(BaseModel):
    student_id: str
    plan_type: str              # "UTSU_2025"
    coverage_items: list[CoverageItem]
    total_unused: float
    savings_from_fraud_flag: Optional[float] = None
