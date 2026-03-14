import structlog
from datetime import datetime
from backend.models.state import VigilState
from backend.config.settings import Settings

logger = structlog.get_logger()
settings = Settings()


async def run_report_drafter(state: VigilState) -> dict:
    start = datetime.utcnow()
    logger.info("agent_start", agent="report_drafter")

    try:
        fraud_score = state.get("fraud_score")
        flags = state.get("fraud_flags", [])
        benefits = state.get("benefits_report")
        ranked_plans = state.get("ranked_plans", [])
        health_signals = state.get("health_signals")
        enriched = state.get("enriched_claim")

        # Build HTML report
        sections: list[str] = []

        # Header
        sections.append("<div class='vigil-report'>")
        sections.append("<h1>VIGIL Fraud Analysis Report</h1>")

        if enriched:
            sections.append(f"<p><strong>Claim ID:</strong> {enriched.claim_id[:8]}...</p>")
            sections.append(f"<p><strong>Date:</strong> {enriched.claim_date}</p>")
            sections.append(f"<p><strong>Total Billed:</strong> ${enriched.total:.2f}</p>")

        # Fraud Score Section
        if fraud_score:
            color = {
                "low": "#22c55e",
                "elevated": "#eab308",
                "high": "#f97316",
                "critical": "#ef4444",
            }.get(fraud_score.level.value, "#6b7280")

            sections.append(f"<div class='fraud-score' style='border-left: 4px solid {color}; padding: 12px;'>")
            sections.append(f"<h2>Fraud Risk Score: {fraud_score.score}/100</h2>")
            sections.append(f"<p>Risk Level: <strong style='color: {color}'>{fraud_score.level.value.upper()}</strong></p>")
            sections.append("<h3>Score Breakdown</h3><ul>")
            sections.append(f"<li>Fee Deviation: {fraud_score.breakdown.fee_deviation}/40</li>")
            sections.append(f"<li>Code Risk: {fraud_score.breakdown.code_risk}/25</li>")
            sections.append(f"<li>Provider History: {fraud_score.breakdown.provider_history}/25</li>")
            sections.append(f"<li>Pattern Bonus: {fraud_score.breakdown.pattern_bonus}/10</li>")
            sections.append(f"<li>Confidence: {fraud_score.breakdown.confidence_adj}</li>")
            sections.append("</ul></div>")

        # Fraud Flags Section
        if flags:
            sections.append("<h2>Fraud Flags</h2><ul>")
            for flag in flags:
                sections.append(
                    f"<li><strong>{flag.fraud_type.value.replace('_', ' ').title()}</strong> "
                    f"(Code {flag.code}): {flag.evidence}</li>"
                )
            sections.append("</ul>")

        # Benefits Section
        if benefits:
            sections.append("<h2>Benefits Summary</h2>")
            sections.append(f"<p>Plan: {benefits.plan_type}</p>")
            sections.append(f"<p><strong>Total Unused Coverage: ${benefits.total_unused:.2f}</strong></p>")
            if benefits.savings_from_fraud_flag:
                sections.append(f"<p>Potential savings from fraud flags: ${benefits.savings_from_fraud_flag:.2f}</p>")
            sections.append("<table><tr><th>Category</th><th>Limit</th><th>Used</th><th>Remaining</th></tr>")
            for item in benefits.coverage_items:
                sections.append(
                    f"<tr><td>{item.category.title()}</td>"
                    f"<td>${item.annual_limit:.2f}</td>"
                    f"<td>${item.used_ytd:.2f}</td>"
                    f"<td>${item.remaining:.2f}</td></tr>"
                )
            sections.append("</table>")

        # Recommended Actions
        if ranked_plans:
            sections.append("<h2>Recommended Actions</h2><ol>")
            for rp in ranked_plans:
                plan = rp["plan"]
                sections.append(
                    f"<li><strong>{plan['name']}</strong> (Priority: {rp['priority_score']})<br>"
                    f"{'<br>'.join(plan['steps'])}</li>"
                )
            sections.append("</ol>")

        # Health Signals
        if health_signals and health_signals.get("gaps"):
            sections.append("<h2>Preventive Care Gaps</h2><ul>")
            for gap in health_signals["gaps"]:
                sections.append(f"<li>{gap['recommendation']}</li>")
            sections.append("</ul>")

        sections.append("</div>")
        report_html = "\n".join(sections)

        duration = int((datetime.utcnow() - start).total_seconds() * 1000)
        logger.info("agent_complete", agent="report_drafter", duration_ms=duration)

        return {
            "report_html": report_html,
            "agent_traces": [{
                "agent": "report_drafter",
                "event": "complete",
                "message": "Generated fraud analysis report",
                "duration_ms": duration,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }

    except Exception as e:
        logger.error("agent_error", agent="report_drafter", error=str(e))
        return {
            "errors": [f"report_drafter: {str(e)}"],
            "agent_traces": [{
                "agent": "report_drafter",
                "event": "error",
                "message": str(e),
                "duration_ms": None,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }
