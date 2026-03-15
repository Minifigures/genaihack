"""Generate a formal dispute letter PDF for a fraud case."""

import io
from datetime import date
from typing import Optional

from fpdf import FPDF


# Map fraud type codes to human-readable descriptions
FRAUD_TYPE_LABELS = {
    "upcoding": "Upcoding (billing for a more expensive procedure than performed)",
    "unbundling": "Unbundling (billing separately for procedures normally billed together)",
    "fee_deviation": "Fee deviation from the ODA Suggested Fee Guide",
    "phantom_billing": "Phantom billing (services not rendered)",
    "duplicate_claim": "Duplicate claim submission",
}


def generate_dispute_letter(
    student_name: str,
    student_id: str,
    claim_date: str,
    provider_name: str,
    case_id: str,
    fraud_score: float,
    flags: list[dict],
) -> bytes:
    """Generate a dispute letter PDF and return as bytes."""

    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=25)

    # Header
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 10, "VIGIL", ln=True, align="L")
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 5, "Healthcare Billing Fraud Detection System", ln=True, align="L")
    pdf.cell(0, 5, "University of Toronto Students' Union (UTSU)", ln=True, align="L")
    pdf.set_text_color(0, 0, 0)

    pdf.line(10, pdf.get_y() + 3, 200, pdf.get_y() + 3)
    pdf.ln(10)

    # Date
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 6, f"Date: {date.today().strftime('%B %d, %Y')}", ln=True)
    pdf.ln(4)

    # Recipient
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 6, "Green Shield Canada", ln=True)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 6, "Claims Review Department", ln=True)
    pdf.cell(0, 6, "P.O. Box 1606", ln=True)
    pdf.cell(0, 6, "Windsor, ON N9A 6W1", ln=True)
    pdf.ln(6)

    # Subject line
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 6, f"RE: Formal Dispute of Dental Claim - Case {case_id[:8].upper()}", ln=True)
    pdf.ln(4)

    # Salutation
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 6, "Dear Claims Review Team,", ln=True)
    pdf.ln(4)

    # Body paragraph 1
    body1 = (
        f"I am writing to formally request a review of a dental insurance claim submitted by "
        f"{provider_name} on {claim_date}. As a UTSU plan member (Student ID: {student_id}), "
        f"I have identified potential billing irregularities through the VIGIL fraud detection "
        f"system, which assigned a fraud risk score of {fraud_score:.0f}/100 to this claim."
    )
    pdf.multi_cell(0, 6, body1)
    pdf.ln(3)

    # Fraud details section
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 7, "Identified Billing Anomalies", ln=True)
    pdf.ln(2)

    pdf.set_font("Helvetica", "", 10)
    for i, flag in enumerate(flags, 1):
        fraud_type = flag.get("fraud_type", "unknown")
        code = flag.get("code", "N/A")
        billed = flag.get("billed_fee", 0)
        suggested = flag.get("suggested_fee")
        deviation = flag.get("deviation_pct")
        evidence = flag.get("evidence", "")
        fraud_label = FRAUD_TYPE_LABELS.get(fraud_type, fraud_type.replace("_", " ").title())

        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(0, 6, f"{i}. {fraud_label}", ln=True)
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 5, f"   Procedure Code: {code}", ln=True)
        pdf.cell(0, 5, f"   Amount Billed: ${billed:.2f}", ln=True)
        if suggested is not None:
            pdf.cell(0, 5, f"   ODA Suggested Fee: ${suggested:.2f}", ln=True)
        if deviation is not None:
            pdf.cell(0, 5, f"   Deviation: {deviation * 100:.1f}%", ln=True)
        pdf.cell(0, 5, f"   Evidence: {evidence}", ln=True)
        pdf.ln(2)

    # Total overcharge
    total_billed = sum(f.get("billed_fee", 0) for f in flags)
    total_suggested = sum(f.get("suggested_fee", 0) for f in flags if f.get("suggested_fee"))
    if total_suggested > 0:
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 7, f"Total Billed (flagged items): ${total_billed:.2f}", ln=True)
        pdf.cell(0, 7, f"Total ODA Suggested Fees: ${total_suggested:.2f}", ln=True)
        pdf.cell(0, 7, f"Potential Overcharge: ${total_billed - total_suggested:.2f}", ln=True)
        pdf.ln(3)

    # Request
    pdf.set_font("Helvetica", "", 11)
    body2 = (
        "I respectfully request that Green Shield Canada conduct a thorough review of this "
        "claim, compare the billed amounts against the Ontario Dental Association (ODA) 2024 "
        "Suggested Fee Guide, and take appropriate action to address any confirmed billing "
        "irregularities. If overcharges are confirmed, I request an adjustment to the claim "
        "and a refund of any excess amounts paid."
    )
    pdf.multi_cell(0, 6, body2)
    pdf.ln(4)

    # Closing
    pdf.cell(0, 6, "Thank you for your prompt attention to this matter.", ln=True)
    pdf.ln(6)
    pdf.cell(0, 6, "Sincerely,", ln=True)
    pdf.ln(8)

    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 6, student_name, ln=True)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 6, f"Student ID: {student_id}", ln=True)
    pdf.cell(0, 6, "University of Toronto", ln=True)

    # Footer disclaimer
    pdf.ln(10)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(3)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(120, 120, 120)
    pdf.multi_cell(0, 4, (
        "This letter was generated by VIGIL, a healthcare billing fraud detection system. "
        "Fraud flags represent potential billing anomalies identified through automated analysis "
        "against the ODA Fee Guide and are not accusations. This letter has been reviewed and "
        "approved by the student before submission."
    ))

    return pdf.output()
