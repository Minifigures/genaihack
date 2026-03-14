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
    "STU-002": {
        "student_id": "STU-002",
        "plan_type": "UTSU_2025",
        "coverage_items": [
            {"category": "dental", "annual_limit": 750, "used_ytd": 200, "remaining": 550, "coverage_pct": 0.80, "recommendation": "You have $550.00 unused in dental. Consider booking a covered visit before plan year ends."},
            {"category": "vision", "annual_limit": 150, "used_ytd": 150, "remaining": 0, "coverage_pct": 1.00, "recommendation": None},
            {"category": "paramedical", "annual_limit": 500, "used_ytd": 0, "remaining": 500, "coverage_pct": 0.80, "recommendation": "You have $500.00 unused in paramedical. Consider booking a covered visit before plan year ends."},
            {"category": "psychology", "annual_limit": 300, "used_ytd": 100, "remaining": 200, "coverage_pct": 1.00, "recommendation": "You still have $200.00 in psychology coverage. Sessions are 100% covered."},
            {"category": "prescription", "annual_limit": 3000, "used_ytd": 250, "remaining": 2750, "coverage_pct": 0.80, "recommendation": None},
        ],
        "total_unused": 4000.00,
        "savings_from_fraud_flag": None,
    },
    "STU-003": {
        "student_id": "STU-003",
        "plan_type": "UTSU_2025",
        "coverage_items": [
            {"category": "dental", "annual_limit": 750, "used_ytd": 78, "remaining": 672, "coverage_pct": 0.80, "recommendation": "You have $672.00 unused in dental. Consider booking a covered visit before plan year ends."},
            {"category": "vision", "annual_limit": 150, "used_ytd": 0, "remaining": 150, "coverage_pct": 1.00, "recommendation": "You haven't used any vision benefits this year. Eye exams are fully covered."},
            {"category": "paramedical", "annual_limit": 500, "used_ytd": 0, "remaining": 500, "coverage_pct": 0.80, "recommendation": "You have $500.00 unused in paramedical. Consider booking a covered visit before plan year ends."},
            {"category": "psychology", "annual_limit": 300, "used_ytd": 0, "remaining": 300, "coverage_pct": 1.00, "recommendation": "Mental health visits are 100% covered up to $300. Consider scheduling a session."},
            {"category": "prescription", "annual_limit": 3000, "used_ytd": 0, "remaining": 3000, "coverage_pct": 0.80, "recommendation": None},
        ],
        "total_unused": 4622.00,
        "savings_from_fraud_flag": None,
    },
}


@router.get("/benefits/{student_id}")
async def get_benefits(student_id: str):
    benefits = DEMO_BENEFITS.get(student_id)
    if benefits is None:
        return {"error": f"No benefits found for student {student_id}"}
    return benefits
