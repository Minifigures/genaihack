"""AI health assistant chatbot endpoint."""

from fastapi import APIRouter, Request
from pydantic import BaseModel
import structlog

from backend.rate_limit import limiter
from backend.config.settings import Settings

logger = structlog.get_logger()
settings = Settings()
router = APIRouter()


SYSTEM_PROMPT = """You are VIGIL Health Assistant, an AI helper for Canadian university students navigating their student health insurance plan (UTSU/Green Shield Canada).

You help with:
- Understanding dental, vision, paramedical, psychology, and prescription coverage
- Explaining dental procedure codes (CDA codes) and what they mean
- Interpreting billing receipts and spotting potential overcharges
- Recommending preventive care (dental exams, cleanings, mental health check-ins)
- Explaining how to file disputes or claims
- General wellness tips for students

Coverage summary (UTSU 2025-2026):
- Dental: $750/year, 80% coverage
- Vision: $150/year, 100% coverage
- Paramedical (physio, chiro, massage): $500/year, 80% coverage
- Psychology/counselling: $300-800/year, 100% coverage
- Prescription: $200-3000/year, 80% coverage

Important rules:
- Be concise (2-4 sentences max unless asked for detail)
- Always mention that you're an AI assistant, not a medical professional
- Recommend seeing a healthcare provider for medical concerns
- Be warm and supportive, especially for mental health topics
- Reference specific coverage amounts when relevant
"""


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


@router.post("/chat")
@limiter.limit("20/minute")
async def chat(request: Request, body: ChatRequest):
    """Chat with the VIGIL health assistant."""
    try:
        import google.generativeai as genai

        if not settings.google_api_key:
            return _fallback_response(body.message)

        genai.configure(api_key=settings.google_api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

        # Build conversation
        messages = [{"role": "user", "parts": [SYSTEM_PROMPT + "\n\nStudent says: " + body.message]}]

        response = model.generate_content(messages)
        reply = response.text.strip()

        return {"reply": reply, "source": "gemini"}

    except Exception as e:
        logger.warning("chat_fallback", error=str(e))
        return _fallback_response(body.message)


def _fallback_response(message: str) -> dict:
    """Provide helpful responses without an LLM."""
    msg = message.lower()

    if any(w in msg for w in ["mental", "stress", "anxiety", "depress", "counsell", "psych"]):
        reply = ("Your UTSU plan covers 100% of psychology and counselling services (up to $300-800/year). "
                 "UofT Health & Wellness: (416) 978-8030. For 24/7 support, call My SSP: 1-844-451-9700. "
                 "You don't need a referral to see a counsellor.")
    elif any(w in msg for w in ["dental", "dentist", "tooth", "teeth", "cleaning", "scaling"]):
        reply = ("Your dental coverage is $750/year at 80%. A typical cleaning costs $55-110 (scaling). "
                 "Exams are $78-120. You should get a dental exam every 6 months. "
                 "Upload your receipt to check if your dentist's fees match the ODA guide.")
    elif any(w in msg for w in ["vision", "eye", "glasses", "contacts"]):
        reply = ("Your vision coverage is $150/year at 100%. This covers eye exams and can contribute to "
                 "glasses or contacts. Annual eye exams are recommended, especially with high screen time.")
    elif any(w in msg for w in ["physio", "massage", "chiro", "paramedical"]):
        reply = ("Paramedical services (physio, chiro, massage, acupuncture) are covered up to $500/year at 80%. "
                 "Great for study-related back pain or posture issues. No referral needed for most services.")
    elif any(w in msg for w in ["prescription", "drug", "medication", "pharmacy"]):
        reply = ("Prescriptions are covered up to $200-3000/year at 80%. Present your student card at the pharmacy. "
                 "Generic drugs are usually fully covered under this plan.")
    elif any(w in msg for w in ["fraud", "overcharge", "dispute", "too much"]):
        reply = ("If you think you were overcharged, upload your receipt to VIGIL. We'll compare fees against the "
                 "ODA Suggested Fee Guide and flag any irregularities. You can generate a dispute letter "
                 "to send to Green Shield Canada if fraud is detected.")
    elif any(w in msg for w in ["coverage", "plan", "insurance", "benefit"]):
        reply = ("Your UTSU plan covers: Dental ($750, 80%), Vision ($150, 100%), Paramedical ($500, 80%), "
                 "Psychology ($300-800, 100%), Prescription ($200-3000, 80%). Visit the Benefits page to see "
                 "your usage and remaining coverage.")
    elif any(w in msg for w in ["hello", "hi", "hey"]):
        reply = "Hi! I'm the VIGIL Health Assistant. I can help you understand your student health coverage, find preventive care recommendations, or explain dental procedure codes. What can I help with?"
    else:
        reply = ("I can help with questions about your student health coverage (dental, vision, mental health, "
                 "paramedical, prescriptions), billing concerns, or preventive care recommendations. "
                 "What would you like to know?")

    return {"reply": reply, "source": "local"}
