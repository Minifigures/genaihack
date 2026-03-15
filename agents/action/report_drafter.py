import structlog
from datetime import datetime
from backend.models.state import VigilState
from backend.config.settings import Settings

logger = structlog.get_logger()
settings = Settings()

IRREGULARITY_LABELS = {
    "upcoding": "Overcharge Detected",
    "unbundling": "Split Billing Detected",
    "phantom_billing": "Unrendered Service",
    "fee_deviation": "Fee Above Guide",
    "duplicate_claim": "Duplicate Charge",
}

LEVEL_LABELS = {
    "low":      ("Looks Good",          "#16a34a"),
    "elevated": ("Minor Note",          "#ca8a04"),
    "high":     ("Review Recommended",  "#ea580c"),
    "critical": ("Review Required",     "#dc2626"),
}

STYLES = """<style>
.rpt { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 13px;
       line-height: 1.7; color: #111; max-width: 480px; }
.rpt hr { border: none; border-top: 1px solid #e5e7eb; margin: 14px 0; }
.rpt .sec { font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
            text-transform: uppercase; color: #9ca3af; margin-bottom: 8px; }
.rpt .row { display: flex; justify-content: space-between; gap: 16px; }
.rpt .row .lbl { color: #6b7280; }
.rpt .row .val { text-align: right; white-space: nowrap; }
.rpt .indent { padding-left: 14px; color: #374151; }
</style>"""


def row(label, value, bold_val=False):
    v = f"<strong>{value}</strong>" if bold_val else value
    return f"<div class='row'><span class='lbl'>{label}</span><span class='val'>{v}</span></div>"


async def run_report_drafter(state: VigilState) -> dict:
    start = datetime.utcnow()
    logger.info("agent_start", agent="report_drafter")

    try:
        fraud_score = state.get("fraud_score")
        flags      = state.get("fraud_flags", [])
        benefits   = state.get("benefits_report")
        ranked_plans = state.get("ranked_plans", [])
        health_signals = state.get("health_signals")
        enriched   = state.get("enriched_claim")

        s = [STYLES, "<div class='rpt'>"]

        # Header
        s.append(f"<div style='margin-bottom:14px;'>"
                 f"<strong style='font-size:14px;'>Billing Analysis Report</strong><br>"
                 f"<span style='color:#9ca3af; font-size:11px;'>"
                 f"{datetime.utcnow().strftime('%B %d, %Y')} &nbsp;·&nbsp; VIGIL</span></div>")

        # Claim info
        if enriched:
            s.append("<p class='sec'>Claim</p>")
            s.append(row("Reference", enriched.claim_id[:8].upper() + "…"))
            s.append(row("Date", str(enriched.claim_date)))
            s.append(row("Provider", getattr(enriched, "provider_id", "—")))
            s.append(row("Total billed", f"${enriched.total:.2f}", bold_val=True))
            s.append("<hr>")

        # Assessment
        if fraud_score:
            level = fraud_score.level.value
            label, color = LEVEL_LABELS.get(level, ("Reviewed", "#6b7280"))
            s.append("<p class='sec'>Assessment</p>")
            s.append(f"<div class='row'><span class='lbl'>Status</span>"
                     f"<span class='val' style='color:{color}; font-weight:600;'>{label}</span></div>")
            s.append(row("Score", f"{fraud_score.score} / 100"))
            s.append(row("Confidence", f"{fraud_score.breakdown.confidence_adj:.2f}"))
            s.append("<hr>")

            s.append("<p class='sec'>Score Breakdown</p>")
            s.append(row("Fee difference",   f"{fraud_score.breakdown.fee_deviation:.1f} / 40"))
            s.append(row("Billing patterns", f"{fraud_score.breakdown.code_risk:.1f} / 25"))
            s.append(row("Provider record",  f"{fraud_score.breakdown.provider_history:.1f} / 25"))
            s.append(row("Repeat patterns",  f"{fraud_score.breakdown.pattern_bonus:.1f} / 10"))
            s.append("<hr>")

        # Irregularities
        s.append("<p class='sec'>Irregularities</p>")
        if flags:
            for flag in flags:
                raw_type = flag.fraud_type.value if hasattr(flag.fraud_type, "value") else str(flag.fraud_type)
                lbl = IRREGULARITY_LABELS.get(raw_type, raw_type.replace("_", " ").title())
                dev = f" (+{flag.deviation_pct * 100:.1f}%)" if flag.deviation_pct else ""
                s.append(f"<div style='margin-bottom:8px;'>")
                s.append(f"<div class='row'><span style='font-weight:600;'>{lbl}</span>"
                         f"<span class='val' style='color:#6b7280;'>Code {flag.code}{dev}</span></div>")
                s.append(f"<div class='indent'>{flag.evidence}</div>")
                if flag.suggested_fee is not None:
                    s.append(f"<div class='indent' style='color:#9ca3af; font-size:11px;'>"
                             f"Billed ${flag.billed_fee:.2f} · Expected ${flag.suggested_fee:.2f} · "
                             f"Confidence {flag.confidence * 100:.0f}%</div>")
                s.append("</div>")
        else:
            s.append("<div style='color:#16a34a;'>No irregularities detected.</div>")
        s.append("<hr>")

        # Coverage
        if benefits:
            s.append("<p class='sec'>Coverage &nbsp;·&nbsp; "
                     f"<span style='font-weight:400; text-transform:none; letter-spacing:0;'>{benefits.plan_type}</span></p>")
            s.append(row("Total unused this year", f"${benefits.total_unused:.2f}", bold_val=True))
            if benefits.savings_from_fraud_flag:
                s.append(row("Savings from irregularities",
                             f"${benefits.savings_from_fraud_flag:.2f}"))
            s.append("<hr>")
            for item in benefits.coverage_items:
                s.append(row(
                    item.category.title(),
                    f"${item.remaining:.2f} remaining of ${item.annual_limit:.2f}"
                ))
            s.append("<hr>")

        # Recommended actions
        if ranked_plans:
            s.append("<p class='sec'>Recommended Actions</p>")
            for i, rp in enumerate(ranked_plans, 1):
                plan  = rp["plan"]
                steps = plan.get("steps", [])
                s.append(f"<div style='margin-bottom:10px;'>")
                s.append(f"<div><strong>{i}. {plan['name']}</strong></div>")
                for step in steps:
                    s.append(f"<div class='indent'>{step}</div>")
                s.append("</div>")
            s.append("<hr>")

        # Preventive care
        if health_signals and health_signals.get("gaps"):
            s.append("<p class='sec'>Preventive Care</p>")
            for gap in health_signals["gaps"]:
                s.append(f"<div>{gap['recommendation']}</div>")

        s.append("</div>")
        report_html = "\n".join(s)

        duration = int((datetime.utcnow() - start).total_seconds() * 1000)
        logger.info("agent_complete", agent="report_drafter", duration_ms=duration)

        return {
            "report_html": report_html,
            "agent_traces": [{
                "agent": "report_drafter",
                "event": "complete",
                "message": "Generated billing analysis report",
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
