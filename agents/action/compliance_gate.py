import structlog
from datetime import datetime
from backend.models.state import VigilState
from backend.config.settings import Settings

logger = structlog.get_logger()
settings = Settings()

# Local keyword safety filter (fallback when watsonx.ai is unavailable)
BIAS_KEYWORDS = ["race", "ethnicity", "gender", "religion", "nationality"]
REQUIRED_EXPLAINABILITY_FIELDS = ["evidence", "fraud_type", "confidence"]


def local_compliance_check(state: VigilState) -> tuple[bool, list[str]]:
    """Local keyword-based compliance filter. Fallback for watsonx.ai."""
    issues: list[str] = []

    flags = state.get("fraud_flags", [])
    for flag in flags:
        # Check for bias indicators in evidence
        evidence_lower = flag.evidence.lower()
        for keyword in BIAS_KEYWORDS:
            if keyword in evidence_lower:
                issues.append(f"Potential bias detected in flag evidence: contains '{keyword}'")

        # Check explainability
        if not flag.evidence or len(flag.evidence) < 10:
            issues.append(f"Insufficient evidence for flag on code {flag.code}")

        if flag.confidence < 0.3:
            issues.append(f"Very low confidence ({flag.confidence}) on flag for code {flag.code}")

    report_html = state.get("report_html", "")
    for keyword in BIAS_KEYWORDS:
        if keyword in report_html.lower():
            issues.append(f"Report contains potentially biased language: '{keyword}'")

    return len(issues) == 0, issues


async def run_compliance_gate(state: VigilState) -> dict:
    start = datetime.utcnow()
    logger.info("agent_start", agent="compliance_gate")

    try:
        if settings.enable_watsonx and settings.watsonx_api_key:
            # TODO: Implement watsonx.ai compliance check
            # For now, fall through to local filter
            pass

        approved, issues = local_compliance_check(state)

        if not approved:
            logger.warning("compliance_issues", issues=issues)

        duration = int((datetime.utcnow() - start).total_seconds() * 1000)
        logger.info(
            "agent_complete",
            agent="compliance_gate",
            duration_ms=duration,
            approved=approved,
            issues=len(issues),
        )

        return {
            "compliance_approved": approved,
            "agent_traces": [{
                "agent": "compliance_gate",
                "event": "complete",
                "message": f"Compliance {'approved' if approved else f'flagged {len(issues)} issues'}",
                "duration_ms": duration,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }

    except Exception as e:
        logger.error("agent_error", agent="compliance_gate", error=str(e))
        return {
            "compliance_approved": True,
            "errors": [f"compliance_gate: {str(e)}"],
            "agent_traces": [{
                "agent": "compliance_gate",
                "event": "error",
                "message": str(e),
                "duration_ms": None,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }
