import json
import requests
import structlog
from datetime import datetime
from backend.models.state import VigilState
from backend.config.settings import Settings
from backend.store import store

logger = structlog.get_logger()
settings = Settings()

# ── IBM watsonx.ai model config ──────────────────────────────────────────────
WATSONX_MODEL_ID = "ibm/granite-3-8b-instruct"
WATSONX_PARAMS = {
    "max_new_tokens": 600,
    "temperature": 0.1,
    "stop_sequences": ["\n\n\n"],
}
_iam_token_cache: dict = {"token": None, "expires_at": 0}

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


def _get_iam_token() -> str:
    """Get an IAM bearer token from IBM Cloud, with caching."""
    import time
    now = time.time()
    if _iam_token_cache["token"] and _iam_token_cache["expires_at"] > now + 60:
        return _iam_token_cache["token"]

    resp = requests.post(
        "https://iam.cloud.ibm.com/identity/token",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={
            "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
            "apikey": settings.watsonx_api_key,
        },
        timeout=30,
    )
    resp.raise_for_status()
    token_data = resp.json()
    _iam_token_cache["token"] = token_data["access_token"]
    _iam_token_cache["expires_at"] = now + token_data.get("expires_in", 3600)
    logger.info("iam_token_refreshed")
    return _iam_token_cache["token"]


def watsonx_compliance_check(state: VigilState) -> tuple[bool, list[str]]:
    """Use IBM watsonx.ai Granite model via REST API to evaluate compliance."""

    # Summarise fraud flags for the prompt
    flags = state.get("fraud_flags", [])
    flag_summaries = []
    for f in flags:
        flag_summaries.append(
            f"- Type: {f.fraud_type.value}, Code: {f.code}, "
            f"Billed: ${f.billed_fee:.2f}, Confidence: {f.confidence:.0%}, "
            f"Evidence: {f.evidence}"
        )
    flags_text = "\n".join(flag_summaries) if flag_summaries else "No flags."

    report_snippet = (state.get("report_html") or "")[:1500]

    prompt = f"""You are a healthcare compliance auditor. Review the following fraud
detection output and evaluate it against four criteria:

1. BIAS — Do any flags rely on patient demographics (race, gender, ethnicity,
   religion, nationality) rather than billing data?
2. EXPLAINABILITY — Does every flag include concrete, verifiable evidence?
3. PROPORTIONALITY — Are the recommended actions proportionate to the severity?
4. REGULATORY — Are flag types consistent with Ontario Dental Association and
   Canadian healthcare billing standards?

=== FRAUD FLAGS ===
{flags_text}

=== REPORT EXCERPT ===
{report_snippet}

Respond with EXACTLY this JSON format, no other text:
{{
  "verdict": "PASS" or "FAIL",
  "issues": ["issue 1", "issue 2"]
}}

If everything is acceptable, return {{"verdict": "PASS", "issues": []}}.
"""

    # Call watsonx.ai REST API directly (no SDK needed)
    token = _get_iam_token()
    api_url = f"{settings.watsonx_url}/ml/v1/text/generation?version=2024-05-31"

    payload = {
        "model_id": WATSONX_MODEL_ID,
        "input": prompt,
        "project_id": settings.watsonx_project_id,
        "parameters": WATSONX_PARAMS,
    }

    resp = requests.post(
        api_url,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        json=payload,
        timeout=60,
    )
    resp.raise_for_status()
    data = resp.json()

    raw = data["results"][0]["generated_text"]
    logger.info("watsonx_raw_response", response=raw[:500])

    # Parse the JSON response
    try:
        start_idx = raw.index("{")
        end_idx = raw.rindex("}") + 1
        result = json.loads(raw[start_idx:end_idx])
        verdict = result.get("verdict", "PASS").upper()
        issues = result.get("issues", [])
        return verdict == "PASS", issues
    except (ValueError, json.JSONDecodeError):
        logger.warning("watsonx_parse_error", raw=raw[:300])
        return True, ["watsonx response could not be parsed — defaulting to PASS"]


async def run_compliance_gate(state: VigilState) -> dict:
    start = datetime.utcnow()
    logger.info("agent_start", agent="compliance_gate")
    compliance_method = "local"

    try:
        if settings.enable_watsonx and settings.watsonx_api_key:
            try:
                approved, issues = watsonx_compliance_check(state)
                compliance_method = "watsonx"
                logger.info("watsonx_compliance_complete", approved=approved, issues=len(issues))
            except Exception as wx_err:
                logger.warning("watsonx_fallback", error=str(wx_err))
                approved, issues = local_compliance_check(state)
                compliance_method = "local_fallback"
        else:
            approved, issues = local_compliance_check(state)

        if not approved:
            logger.warning("compliance_issues", issues=issues)

        # Log audit entry for compliance check
        claim_id = state.get("claim_id")
        case_id = state.get("case_id")
        student_id = state.get("student_id")
        await store.save_audit_entry(
            action="compliance_check",
            agent="compliance_gate",
            case_id=case_id,
            claim_id=claim_id,
            student_id=student_id,
            tenant_id=state.get("tenant_id"),
            session_id=state.get("session_id"),
            details={
                "approved": approved,
                "issues": issues,
                "issues_count": len(issues),
                "compliance_method": compliance_method,
            },
        )

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
                "message": f"Compliance {'approved' if approved else f'flagged {len(issues)} issues'} (via {compliance_method})",
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
