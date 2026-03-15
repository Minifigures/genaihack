import base64
import json
import structlog
from datetime import datetime
from backend.models.state import VigilState
from backend.models.claim import OCRResult, Procedure
from backend.config.settings import Settings

logger = structlog.get_logger()
settings = Settings()

OCR_PROMPT = """You are a medical/dental receipt OCR system. Extract structured data from this receipt image.

Return ONLY valid JSON with this exact structure:
{
    "provider_name": "string",
    "provider_address": "string or null",
    "claim_date": "YYYY-MM-DD",
    "procedures": [
        {
            "code": "5-digit CDA code",
            "description": "procedure description",
            "fee_charged": 0.00,
            "tooth_number": "string or null"
        }
    ],
    "subtotal": 0.00,
    "tax": 0.00,
    "total": 0.00,
    "raw_text": "full text content of the receipt"
}

Rules:
- CDA procedure codes are 5-digit numbers (e.g., 11101, 43421)
- If you cannot identify a CDA code, use "00000" and include the description
- Dates must be ISO format (YYYY-MM-DD)
- All monetary values must be numbers (no $ signs)
- Include the full raw text of the receipt in raw_text
"""


async def run_ocr(state: VigilState) -> dict:
    start = datetime.utcnow()
    logger.info("agent_start", agent="ocr_agent")

    try:
        if settings.demo_mode:
            filename = state.get("receipt_filename", "")
            result = _demo_ocr_result(filename)
            duration = int((datetime.utcnow() - start).total_seconds() * 1000)
            logger.info("agent_complete", agent="ocr_agent", duration_ms=duration, mode="demo")
            return {
                "ocr_result": result,
                "agent_traces": [{
                    "agent": "ocr_agent",
                    "event": "complete",
                    "message": f"OCR extracted {len(result.procedures)} procedures (demo mode)",
                    "duration_ms": duration,
                    "timestamp": datetime.utcnow().isoformat(),
                }],
            }

        import google.generativeai as genai
        genai.configure(api_key=settings.google_api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

        image_data = state["receipt_image"]
        b64_image = base64.b64encode(image_data).decode("utf-8")

        response = model.generate_content([
            OCR_PROMPT,
            {"mime_type": "image/png", "data": b64_image},
        ])

        response_text = response.text.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        parsed = json.loads(response_text)
        procedures = [Procedure(**p) for p in parsed["procedures"]]

        result = OCRResult(
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

        duration = int((datetime.utcnow() - start).total_seconds() * 1000)
        logger.info("agent_complete", agent="ocr_agent", duration_ms=duration, procedures=len(procedures))

        return {
            "ocr_result": result,
            "agent_traces": [{
                "agent": "ocr_agent",
                "event": "complete",
                "message": f"OCR extracted {len(procedures)} procedures from receipt",
                "duration_ms": duration,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }

    except Exception as e:
        logger.error("agent_error", agent="ocr_agent", error=str(e))
        return {
            "errors": [f"ocr_agent: {str(e)}"],
            "agent_traces": [{
                "agent": "ocr_agent",
                "event": "error",
                "message": str(e),
                "duration_ms": None,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }


def _demo_ocr_result(filename: str = "") -> OCRResult:
    name = filename.lower()
    if "unbundled" in name:
        return _demo_unbundled()
    if "upcoded" in name:
        return _demo_upcoded()
    return _demo_clean()


def _demo_clean() -> OCRResult:
    """Routine visit — all fees within ODA guide, no fraud flags expected."""
    return OCRResult(
        provider_name="Maple Dental Centre",
        provider_address="456 Bloor St W, Toronto, ON M5S 1X8",
        claim_date="2025-02-10",
        procedures=[
            Procedure(code="11101", description="Exam, recall", fee_charged=78.00),
            Procedure(code="02202", description="Radiographs, periapical, 2 films", fee_charged=42.00),
            Procedure(code="11111", description="Scaling, first unit", fee_charged=55.00),
        ],
        subtotal=175.00,
        tax=None,
        total=175.00,
        ocr_confidence=0.97,
        raw_text="Maple Dental Centre\n456 Bloor St W\nDate: Feb 10, 2025\n11101 Exam recall $78.00\n02202 Periapical 2 films $42.00\n11111 Scaling first unit $55.00\nTotal: $175.00",
    )


def _demo_upcoded() -> OCRResult:
    """Fees 40-60% above ODA guide + root planing likely upcoded from scaling."""
    return OCRResult(
        provider_name="Dr. Smith Dental Clinic",
        provider_address="123 University Ave, Toronto, ON M5H 1T1",
        claim_date="2025-01-15",
        procedures=[
            Procedure(code="11101", description="Exam, recall", fee_charged=150.00),
            Procedure(code="02202", description="Radiographs, periapical, 2 films", fee_charged=85.00),
            Procedure(code="43421", description="Root planing, per quadrant", fee_charged=350.00, tooth_number="14"),
            Procedure(code="11117", description="Scaling, additional unit", fee_charged=95.00),
        ],
        subtotal=680.00,
        tax=None,
        total=680.00,
        ocr_confidence=0.95,
        raw_text="Dr. Smith Dental Clinic\n123 University Ave\nDate: Jan 15, 2025\n11101 Exam recall $150.00\n02202 Periapical 2 films $85.00\n43421 Root planing Q1 $350.00\n11117 Scaling add unit $95.00\nTotal: $680.00",
    )


def _demo_unbundled() -> OCRResult:
    """Same composite code billed twice for same tooth + 3 separate scaling units (should be bundled)."""
    return OCRResult(
        provider_name="Queensway Family Dentistry",
        provider_address="789 Queensway Ave, Toronto, ON M8Z 1N4",
        claim_date="2025-03-05",
        procedures=[
            Procedure(code="11101", description="Exam, recall", fee_charged=82.00),
            Procedure(code="02202", description="Radiographs, periapical, 2 films", fee_charged=48.00),
            Procedure(code="23112", description="Composite resin, 2 surfaces, anterior", fee_charged=220.00, tooth_number="21"),
            Procedure(code="23112", description="Composite resin, 2 surfaces, anterior", fee_charged=220.00, tooth_number="21"),
            Procedure(code="11117", description="Scaling, additional unit", fee_charged=75.00),
            Procedure(code="11117", description="Scaling, additional unit", fee_charged=75.00),
            Procedure(code="11117", description="Scaling, additional unit", fee_charged=75.00),
        ],
        subtotal=795.00,
        tax=None,
        total=795.00,
        ocr_confidence=0.93,
        raw_text="Queensway Family Dentistry\n789 Queensway Ave\nDate: Mar 5, 2025\n11101 Exam recall $82.00\n02202 Periapical 2 films $48.00\n23112 Composite 2-surf tooth 21 $220.00\n23112 Composite 2-surf tooth 21 $220.00\n11117 Scaling unit 1 $75.00\n11117 Scaling unit 2 $75.00\n11117 Scaling unit 3 $75.00\nTotal: $795.00",
    )
