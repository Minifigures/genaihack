"""WatsonX-powered plain language summary of fraud analysis results."""

import json
import time
import requests
import structlog
from datetime import datetime
from backend.models.state import VigilState
from backend.config.settings import Settings

logger = structlog.get_logger()
settings = Settings()

WATSONX_MODEL_ID = "ibm/granite-3-8b-instruct"
WATSONX_PARAMS = {
    "max_new_tokens": 250,
    "temperature": 0.2,
    "stop_sequences": ["\n\n\n"],
}
_iam_token_cache: dict = {"token": None, "expires_at": 0}


def _get_iam_token() -> str:
    """Get an IAM bearer token from IBM Cloud, with caching."""
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
    logger.info("iam_token_refreshed", agent="watsonx_summarizer")
    return _iam_token_cache["token"]


def _build_fallback_summary(state: VigilState) -> str:
    """Generate a template-based summary when WatsonX is unavailable."""
    fraud_score = state.get("fraud_score")
    fraud_flags = state.get("fraud_flags", [])
    benefits = state.get("benefits_report")

    score_val = fraud_score.score if fraud_score else 0
    level = fraud_score.level.value if fraud_score else "low"
    flag_count = len(fraud_flags)

    parts = []
    if score_val == 0 and flag_count == 0:
        parts.append("Your dental receipt looks clean with no billing irregularities detected.")
    else:
        parts.append(
            f"Our analysis found {flag_count} potential billing irregularit{'y' if flag_count == 1 else 'ies'} "
            f"with a fraud risk score of {score_val:.0f}/100 ({level})."
        )
        if fraud_flags:
            types = set()
            for f in fraud_flags:
                types.add(f.fraud_type.value.replace("_", " "))
            parts.append(f"Issues detected: {', '.join(types)}.")

    if benefits and benefits.total_unused > 0:
        parts.append(
            f"You have ${benefits.total_unused:.0f} in unused benefits this year."
        )

    return " ".join(parts)


def _watsonx_generate_summary(state: VigilState) -> str:
    """Call IBM WatsonX Granite to generate a plain language summary."""
    fraud_score = state.get("fraud_score")
    fraud_flags = state.get("fraud_flags", [])
    benefits = state.get("benefits_report")

    score_text = f"{fraud_score.score:.0f}/100 ({fraud_score.level.value})" if fraud_score else "0/100 (low)"
    flag_count = len(fraud_flags)

    flag_lines = []
    for f in fraud_flags:
        flag_lines.append(
            f"- {f.fraud_type.value}: code {f.code}, billed ${f.billed_fee:.2f}"
            + (f", ODA guide ${f.suggested_fee:.2f}" if f.suggested_fee else "")
        )
    flags_text = "\n".join(flag_lines) if flag_lines else "None found."

    unused = f"${benefits.total_unused:.0f}" if benefits else "$0"

    prompt = f"""You are a helpful assistant for university students. In 2-3 plain English sentences, explain this dental billing analysis. Be specific about dollar amounts and what the student should do next. Do not use medical jargon.

Fraud score: {score_text}
Flags found: {flag_count}
{flags_text}
Unused benefits this year: {unused}

Respond with ONLY the summary text, no labels or JSON."""

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

    raw = data["results"][0]["generated_text"].strip()
    logger.info("watsonx_summary_generated", length=len(raw))
    return raw


async def run_watsonx_summarizer(state: VigilState) -> dict:
    """Generate a plain language summary using IBM WatsonX Granite."""
    start = datetime.utcnow()
    logger.info("agent_start", agent="watsonx_summarizer")
    method = "local"

    try:
        if settings.enable_watsonx and settings.watsonx_api_key:
            try:
                summary = _watsonx_generate_summary(state)
                method = "watsonx"
            except Exception as wx_err:
                logger.warning("watsonx_summarizer_fallback", error=str(wx_err))
                summary = _build_fallback_summary(state)
                method = "local_fallback"
        else:
            summary = _build_fallback_summary(state)

        duration = int((datetime.utcnow() - start).total_seconds() * 1000)
        logger.info(
            "agent_complete",
            agent="watsonx_summarizer",
            duration_ms=duration,
            method=method,
        )

        return {
            "watsonx_summary": summary,
            "agent_traces": [{
                "agent": "watsonx_summarizer",
                "event": "complete",
                "message": f"Generated plain-English summary using IBM Granite 3-8B ({method})",
                "duration_ms": duration,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }

    except Exception as e:
        logger.error("agent_error", agent="watsonx_summarizer", error=str(e))
        return {
            "watsonx_summary": _build_fallback_summary(state),
            "errors": [f"watsonx_summarizer: {str(e)}"],
            "agent_traces": [{
                "agent": "watsonx_summarizer",
                "event": "error",
                "message": str(e),
                "duration_ms": None,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }
