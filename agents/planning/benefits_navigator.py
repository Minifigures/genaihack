import structlog
from datetime import datetime
from backend.models.state import VigilState
from backend.models.benefits import BenefitsReport, CoverageItem
from backend.config.settings import Settings

logger = structlog.get_logger()
settings = Settings()

# UTSU Health & Dental Plan coverage (2025-2026)
UTSU_PLAN: dict[str, dict] = {
    "dental": {
        "annual_limit": 750.00,
        "coverage_pct": 0.80,
        "description": "Basic dental, preventive, and minor restorative",
    },
    "vision": {
        "annual_limit": 150.00,
        "coverage_pct": 1.00,
        "description": "Eye exams and corrective lenses",
    },
    "paramedical": {
        "annual_limit": 500.00,
        "coverage_pct": 0.80,
        "description": "Physiotherapy, chiropractic, massage, naturopath",
    },
    "psychology": {
        "annual_limit": 300.00,
        "coverage_pct": 1.00,
        "description": "Mental health and counselling services",
    },
    "prescription": {
        "annual_limit": 3000.00,
        "coverage_pct": 0.80,
        "description": "Prescription medications",
    },
}


async def run_benefits_navigator(state: VigilState) -> dict:
    start = datetime.utcnow()
    logger.info("agent_start", agent="benefits_navigator")

    try:
        student_id = state["student_id"]
        enriched = state.get("enriched_claim")

        # Get coverage usage from enriched claim or defaults
        used_ytd: dict[str, float] = {}
        if enriched and enriched.student_coverage_used_ytd:
            used_ytd = enriched.student_coverage_used_ytd
        else:
            used_ytd = {
                "dental": 420.00,
                "vision": 0.00,
                "paramedical": 150.00,
                "psychology": 0.00,
                "prescription": 85.00,
            }

        coverage_items: list[CoverageItem] = []
        total_unused = 0.0

        for category, plan_info in UTSU_PLAN.items():
            limit = plan_info["annual_limit"]
            used = used_ytd.get(category, 0.0)
            remaining = max(0.0, limit - used)
            total_unused += remaining

            recommendation = None
            if remaining > limit * 0.5:
                recommendation = f"You have ${remaining:.2f} unused in {category}. Consider booking a covered visit before plan year ends."
            elif remaining > 0 and category == "vision" and used == 0:
                recommendation = "You haven't used any vision benefits this year. Eye exams are fully covered."
            elif remaining > 0 and category == "psychology" and used == 0:
                recommendation = "Mental health visits are 100% covered up to $300. Consider scheduling a session."

            coverage_items.append(CoverageItem(
                category=category,
                annual_limit=limit,
                used_ytd=used,
                remaining=remaining,
                coverage_pct=plan_info["coverage_pct"],
                recommendation=recommendation,
            ))

        # Calculate savings from fraud flags
        fraud_score = state.get("fraud_score")
        savings = None
        if fraud_score and fraud_score.score > 50:
            flags = state.get("fraud_flags", [])
            savings = sum(
                (f.billed_fee - (f.suggested_fee or 0))
                for f in flags
                if f.suggested_fee is not None
            )

        report = BenefitsReport(
            student_id=student_id,
            plan_type="UTSU_2025",
            coverage_items=coverage_items,
            total_unused=total_unused,
            savings_from_fraud_flag=savings,
        )

        duration = int((datetime.utcnow() - start).total_seconds() * 1000)
        logger.info(
            "agent_complete",
            agent="benefits_navigator",
            duration_ms=duration,
            total_unused=total_unused,
        )

        return {
            "benefits_report": report,
            "agent_traces": [{
                "agent": "benefits_navigator",
                "event": "complete",
                "message": f"Benefits report: ${total_unused:.2f} total unused coverage across {len(coverage_items)} categories",
                "duration_ms": duration,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }

    except Exception as e:
        logger.error("agent_error", agent="benefits_navigator", error=str(e))
        return {
            "errors": [f"benefits_navigator: {str(e)}"],
            "agent_traces": [{
                "agent": "benefits_navigator",
                "event": "error",
                "message": str(e),
                "duration_ms": None,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }
