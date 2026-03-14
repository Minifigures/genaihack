from fastapi import APIRouter
import structlog

logger = structlog.get_logger()
router = APIRouter()

# Demo benefits data
DEMO_BENEFITS: dict[str, dict] = {
    "STU-001": {
        "student_id": "STU-001",
        "plan_type": "UTSU_2025",
        "coverage_items": [
            {"category": "dental", "annual_limit": 750, "used_ytd": 420, "remaining": 330, "coverage_pct": 0.80, "recommendation": None},
            {"category": "vision", "annual_limit": 150, "used_ytd": 0, "remaining": 150, "coverage_pct": 1.00, "recommendation": "You haven't used any vision benefits this year. Eye exams are fully covered."},
            {"category": "paramedical", "annual_limit": 500, "used_ytd": 150, "remaining": 350, "coverage_pct": 0.80, "recommendation": "You have $350.00 unused in paramedical. Consider booking a covered visit before plan year ends."},
            {"category": "psychology", "annual_limit": 300, "used_ytd": 0, "remaining": 300, "coverage_pct": 1.00, "recommendation": "Mental health visits are 100% covered up to $300. Consider scheduling a session."},
            {"category": "prescription", "annual_limit": 3000, "used_ytd": 85, "remaining": 2915, "coverage_pct": 0.80, "recommendation": None},
        ],
        "total_unused": 4045.00,
        "savings_from_fraud_flag": None,
    },
}


@router.get("/benefits/{student_id}")
async def get_benefits(student_id: str):
    benefits = DEMO_BENEFITS.get(student_id)
    if benefits is None:
        return {"error": f"No benefits found for student {student_id}"}
    return benefits
