"""Health and wellness endpoints for Sun Life track."""

from fastapi import APIRouter
import structlog

from backend.store import store

logger = structlog.get_logger()
router = APIRouter()


# Preventive care schedule (category, procedure, interval in months)
PREVENTIVE_SCHEDULE = [
    {"key": "dental_exam", "label": "Dental Examination", "interval_months": 6, "category": "dental"},
    {"key": "cleaning", "label": "Professional Cleaning", "interval_months": 6, "category": "dental"},
    {"key": "xrays", "label": "Dental X-Rays", "interval_months": 12, "category": "dental"},
    {"key": "fluoride", "label": "Fluoride Treatment", "interval_months": 6, "category": "dental"},
    {"key": "eye_exam", "label": "Eye Examination", "interval_months": 12, "category": "vision"},
    {"key": "mental_health", "label": "Mental Health Check-in", "interval_months": 3, "category": "psychology"},
]


@router.get("/health/wellness/{student_id}")
async def get_wellness_summary(student_id: str):
    """Return a wellness summary for the student."""
    benefits = await store.get_student_benefits(student_id)

    # Calculate utilization
    total_limit = sum(b.get("annual_limit", 0) for b in benefits)
    total_used = sum(b.get("used_ytd", 0) for b in benefits)
    utilization_pct = (total_used / total_limit * 100) if total_limit > 0 else 0

    # Calculate wellness score
    score = 50  # base
    score += min(25, utilization_pct / 2)  # up to 25 for 50%+ utilization

    # Check mental health usage
    psych = next((b for b in benefits if b.get("category") == "psychology"), None)
    mental_health_used = psych.get("used_ytd", 0) > 0 if psych else False
    if mental_health_used:
        score += 10
    else:
        score -= 5

    # Check dental usage
    dental = next((b for b in benefits if b.get("category") == "dental"), None)
    dental_used = dental.get("used_ytd", 0) > 0 if dental else False
    if dental_used:
        score += 10

    score = max(0, min(100, round(score)))

    # Generate recommendations
    recommendations = []
    for b in benefits:
        cat = b.get("category", "")
        remaining = b.get("remaining", 0)
        used = b.get("used_ytd", 0)
        limit = b.get("annual_limit", 0)

        if cat == "psychology" and used == 0:
            recommendations.append({
                "category": "mental_health",
                "priority": "high",
                "message": "Your plan covers 100% of psychology services. Consider booking a session to support your wellbeing.",
                "coverage": f"${remaining:.0f} available",
            })
        elif cat == "dental" and used < limit * 0.3:
            recommendations.append({
                "category": "dental",
                "priority": "medium",
                "message": "Schedule your next preventive dental visit. Regular exams help detect issues early.",
                "coverage": f"${remaining:.0f} remaining",
            })
        elif cat == "vision" and used == 0:
            recommendations.append({
                "category": "vision",
                "priority": "medium",
                "message": "Annual eye exams are recommended, especially for students with high screen time.",
                "coverage": f"${remaining:.0f} available",
            })
        elif cat == "paramedical" and used < limit * 0.2:
            recommendations.append({
                "category": "paramedical",
                "priority": "low",
                "message": "Physiotherapy and massage therapy can help with study-related tension and posture.",
                "coverage": f"${remaining:.0f} remaining",
            })

    return {
        "student_id": student_id,
        "wellness_score": score,
        "score_label": "Excellent" if score >= 85 else "Good" if score >= 75 else "Fair" if score >= 60 else "Needs Attention" if score >= 45 else "At Risk",
        "utilization_pct": round(utilization_pct, 1),
        "mental_health_engaged": mental_health_used,
        "preventive_care_status": "on_track" if dental_used else "overdue",
        "preventive_schedule": PREVENTIVE_SCHEDULE,
        "recommendations": recommendations,
        "benefits_summary": {
            "total_limit": total_limit,
            "total_used": total_used,
            "total_remaining": total_limit - total_used,
        },
    }
