from fastapi import APIRouter
import structlog

from backend.store import store

logger = structlog.get_logger()
router = APIRouter()


def _generate_recommendation(category: str, remaining: float) -> str | None:
    """Generate a recommendation based on benefit category and remaining amount."""
    if remaining <= 0:
        return None

    if category == "vision":
        return "You haven't used any vision benefits this year. Eye exams are fully covered."
    elif category == "psychology":
        return "Mental health visits are 100% covered up to $300. Consider scheduling a session."
    elif remaining > 100:
        return f"You have ${remaining:.2f} unused in {category}. Consider booking a covered visit before plan year ends."
    return None


@router.get("/benefits/{student_id}")
async def get_benefits(student_id: str):
    benefits = await store.get_student_benefits(student_id)
    if not benefits:
        return {"error": f"No benefits found for student {student_id}"}

    # Transform db to API response
    coverage_items = []
    for b in benefits:
        remaining = b.get("remaining", b.get("annual_limit", 0) - b.get("used_ytd", 0))
        category = b.get("category", "")

        coverage_items.append({
            "category": category,
            "annual_limit": b.get("annual_limit"),
            "used_ytd": b.get("used_ytd"),
            "remaining": remaining,
            "coverage_pct": 1.00 if category in ("vision", "psychology") else 0.80,
            "recommendation": _generate_recommendation(category, remaining),
        })

    return {
        "student_id": student_id,
        "plan_type": "UTSU_2025",
        "coverage_items": coverage_items,
        "total_unused": sum(b.get("remaining", 0) for b in benefits),
    }