import asyncio
import base64
import json
from datetime import datetime

import structlog

from backend.config.settings import Settings
from backend.models.claim import OCRResult, Procedure
from backend.models.state import VigilState

logger = structlog.get_logger()
settings = Settings()

OCR_PROMPT = """You are a medical/dental/pharmacy receipt OCR system. Extract structured data from this receipt image.

First, determine whether this is a DENTAL receipt or a PHARMACY receipt.

Return ONLY valid JSON with this exact structure:
{
    "receipt_type": "dental" or "pharmacy",
    "provider_name": "string",
    "provider_address": "string or null",
    "claim_date": "YYYY-MM-DD",
    "procedures": [
        {
            "code": "5-digit CDA code (dental) or DIN/NDC code (pharmacy)",
            "description": "procedure or drug description",
            "fee_charged": 0.00,
            "tooth_number": "string or null (dental only)"
        }
    ],
    "subtotal": 0.00,
    "tax": 0.00,
    "total": 0.00,
    "raw_text": "full text content of the receipt"
}

Rules:
- For DENTAL receipts:
  - CDA procedure codes are 5-digit numbers (e.g., 11101, 43421)
  - If you cannot identify a CDA code, use "00000" and include the description
- For PHARMACY receipts:
  - Use DIN (Drug Identification Number, 8 digits) or NDC codes
  - If you cannot identify a drug code, use "00000000" and include the drug name
- Dates must be ISO format (YYYY-MM-DD)
- All monetary values must be numbers (no $ signs)
- Include the full raw text of the receipt in raw_text
"""

MAX_RETRIES = 3
RETRY_BASE_DELAY = 1.0  # seconds


def _compute_confidence(parsed: dict) -> float:
    """Heuristic confidence score based on field completeness."""
    score = 0.5  # base confidence for any successful parse

    # Has procedures
    procs = parsed.get("procedures", [])
    if procs:
        score += 0.15
    # Has provider name
    if parsed.get("provider_name"):
        score += 0.10
    # Has valid date
    if parsed.get("claim_date"):
        score += 0.10
    # Has total
    if parsed.get("total") and parsed["total"] > 0:
        score += 0.10
    # All procedures have codes (not placeholder)
    placeholder_codes = {"00000", "00000000"}
    if procs and all(p.get("code") not in placeholder_codes for p in procs):
        score += 0.05

    return min(score, 1.0)


async def _call_gemini_with_retry(model, prompt: str, image_part: dict) -> str:
    """Call Gemini API with exponential backoff retry."""
    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            response = model.generate_content([prompt, image_part])
            return response.text.strip()
        except Exception as e:
            last_error = e
            if attempt < MAX_RETRIES - 1:
                delay = RETRY_BASE_DELAY * (2**attempt)
                logger.warning(
                    "gemini_retry",
                    attempt=attempt + 1,
                    delay=delay,
                    error=str(e),
                )
                await asyncio.sleep(delay)
    raise last_error  # type: ignore[misc]


def _strip_code_fences(text: str) -> str:
    """Remove markdown code fences (```json ... ```) from response."""
    stripped = text.strip()
    if stripped.startswith("```"):
        # Remove opening fence (with optional language tag)
        first_newline = stripped.find("\n")
        if first_newline != -1:
            stripped = stripped[first_newline + 1 :]
        # Remove closing fence
        if stripped.rstrip().endswith("```"):
            stripped = stripped.rstrip()[:-3].rstrip()
    return stripped


async def run_ocr(state: VigilState) -> dict:
    start = datetime.utcnow()
    logger.info("agent_start", agent="ocr_agent")

    try:
        if settings.demo_mode:
            filename = state.get("receipt_filename", "")
            result = _demo_ocr_result(filename)
            duration = int((datetime.utcnow() - start).total_seconds() * 1000)
            logger.info(
                "agent_complete", agent="ocr_agent", duration_ms=duration, mode="demo"
            )
            return {
                "ocr_result": result,
                "agent_traces": [
                    {
                        "agent": "ocr_agent",
                        "event": "complete",
                        "message": f"OCR extracted {len(result.procedures)} procedures (demo mode)",
                        "duration_ms": duration,
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                ],
            }

        import google.generativeai as genai

        genai.configure(api_key=settings.google_api_key)
        model = genai.GenerativeModel("gemini-2.5-pro")

        image_data = state["receipt_image"]
        b64_image = base64.b64encode(image_data).decode("utf-8")
        image_part = {"mime_type": "image/png", "data": b64_image}

        # Prefer Hugging Face endpoint if configured
        if settings.google_api_key:
            result = await _ocr_google(b64_image)
        elif settings.huggingface_endpoint:
            result = await _ocr_huggingface(b64_image, image_data)
        else:
            raise RuntimeError("No OCR provider configured. Set HUGGINGFACE_ENDPOINT or GOOGLE_API_KEY")

        duration = int((datetime.utcnow() - start).total_seconds() * 1000)
        logger.info(
            "agent_complete",
            agent="ocr_agent",
            duration_ms=duration,
            procedures=len(procedures),
            receipt_type=parsed.get("receipt_type", "unknown"),
            confidence=confidence,
        )

        return {
            "ocr_result": result,
            "agent_traces": [{
                "agent": "ocr_agent",
                "event": "complete",
                "message": f"OCR extracted {len(result.procedures)} procedures from receipt",
                "duration_ms": duration,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }

    except Exception as e:
        logger.error("agent_error", agent="ocr_agent", error=str(e))
        return {
            "errors": [f"ocr_agent: {str(e)}"],
            "agent_traces": [
                {
                    "agent": "ocr_agent",
                    "event": "error",
                    "message": str(e),
                    "duration_ms": None,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            ],
        }


async def _ocr_huggingface(b64_image: str, raw_image_data: bytes) -> OCRResult:
    """Call Hugging Face endpoint for OCR."""
    import httpx

    headers = {"Content-Type": "application/json"}
    if settings.huggingface_api_key:
        headers["Authorization"] = f"Bearer {settings.huggingface_api_key}"

    payload = {
        "inputs": b64_image,
        "parameters": {
            "prompt": OCR_PROMPT
        }
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{settings.huggingface_endpoint}/chat/completions",
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        result = response.json()

    # Parse the response - adjust based on your model's output format
    # This assumes a chat completion format
    if "choices" in result:
        response_text = result["choices"][0]["message"]["content"]
    else:
        response_text = result.get("generated_text", str(result))

    response_text = response_text.strip()
    if response_text.startswith("```"):
        response_text = response_text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    parsed = json.loads(response_text)
    procedures = [Procedure(**p) for p in parsed["procedures"]]

    return OCRResult(
        provider_name=parsed["provider_name"],
        provider_address=parsed.get("provider_address"),
        claim_date=parsed["claim_date"],
        procedures=procedures,
        subtotal=parsed["subtotal"],
        tax=parsed.get("tax"),
        total=parsed["total"],
        ocr_confidence=0.90,
        raw_text=parsed.get("raw_text", response_text),
    )


async def _ocr_google(b64_image: str) -> OCRResult:
    """Call Google Gemini for OCR (fallback)."""
    import google.generativeai as genai
    genai.configure(api_key=settings.google_api_key)
    model = genai.GenerativeModel("gemini-2.0-flash")

    response = model.generate_content([
        OCR_PROMPT,
        {"mime_type": "image/png", "data": b64_image},
    ])

    response_text = response.text.strip()
    if response_text.startswith("```"):
        response_text = response_text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    parsed = json.loads(response_text)
    procedures = [Procedure(**p) for p in parsed["procedures"]]

    return OCRResult(
        provider_name=parsed["provider_name"],
        provider_address=parsed.get("provider_address"),
        claim_date=parsed["claim_date"],
        procedures=procedures,
        subtotal=parsed["subtotal"],
        tax=parsed.get("tax"),
        total=parsed["total"],
        ocr_confidence=0.92,
        raw_text=parsed.get("raw_text", response_text),
    )


def _demo_ocr_result(filename: str = "") -> OCRResult:
    from agents.perception.demo_receipts import get_demo_receipt
    return get_demo_receipt(filename)



# Legacy functions removed - all demo data now lives in agents/perception/demo_receipts.py
