from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
import os

OUT = os.path.join(os.path.dirname(__file__), "demo_receipts")
os.makedirs(OUT, exist_ok=True)

def header(c, clinic, address, phone, date, patient, dob, plan):
    w, h = letter
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, h - 50, clinic)
    c.setFont("Helvetica", 9)
    c.drawString(50, h - 65, address)
    c.drawString(50, h - 78, phone)
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(w / 2, h - 100, "DENTAL INSURANCE CLAIM RECEIPT")
    c.setStrokeColor(colors.HexColor("#333333"))
    c.setLineWidth(1)
    c.line(50, h - 108, w - 50, h - 108)
    c.setFont("Helvetica", 9)
    c.drawString(50,  h - 125, f"Date of Service:  {date}")
    c.drawString(50,  h - 140, f"Patient Name:     {patient}")
    c.drawString(50,  h - 155, f"Date of Birth:    {dob}")
    c.drawString(300, h - 125, f"Insurance Plan:   {plan}")
    c.drawString(300, h - 140, f"Claim ID:         CLM-2026-{clinic[:3].upper()}-001")
    c.drawString(300, h - 155, f"Provider NPI:     1234567890")

def table_header(c, y):
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(colors.HexColor("#eeeeee"))
    c.rect(50, y - 4, 515, 16, fill=1, stroke=0)
    c.setFillColor(colors.black)
    c.drawString(55,  y, "CDT Code")
    c.drawString(130, y, "Description")
    c.drawString(360, y, "Tooth")
    c.drawString(400, y, "Qty")
    c.drawString(440, y, "Fee Billed")
    c.drawString(510, y, "Plan Pays")

def row(c, y, code, desc, tooth, qty, billed, plan_pays):
    c.setFont("Helvetica", 9)
    c.drawString(55,  y, code)
    c.drawString(130, y, desc)
    c.drawString(360, y, tooth)
    c.drawString(408, y, str(qty))
    c.drawRightString(490, y, f"${billed:.2f}")
    c.drawRightString(555, y, f"${plan_pays:.2f}")

def totals(c, y, subtotal, discount, patient_owes):
    c.setLineWidth(0.5)
    c.line(50, y + 8, 565, y + 8)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(360, y - 5,  f"Subtotal:")
    c.drawRightString(555, y - 5, f"${subtotal:.2f}")
    c.drawString(360, y - 20, f"Insurance Discount:")
    c.drawRightString(555, y - 20, f"-${discount:.2f}")
    c.setFillColor(colors.HexColor("#cc0000"))
    c.drawString(360, y - 35, f"Patient Balance Due:")
    c.drawRightString(555, y - 35, f"${patient_owes:.2f}")
    c.setFillColor(colors.black)

def footer(c, note):
    c.setFont("Helvetica-Oblique", 8)
    c.setFillColor(colors.HexColor("#666666"))
    c.drawString(50, 40, note)
    c.drawString(50, 28, "This document is for insurance claim purposes only. Please retain for your records.")
    c.setFillColor(colors.black)

# ─── RECEIPT 1: CLEAN / NORMAL ───────────────────────────────────────────────
c = canvas.Canvas(f"{OUT}/clean_dental.pdf", pagesize=letter)
w, h = letter
header(c, "Sunrise Family Dentistry", "120 College St, Toronto ON M5G 1V7",
       "Tel: (416) 555-0192", "2026-03-10", "Aahir Chakraborty-Saha",
       "2004-08-15", "UTSU Dental Plus")
table_header(c, h - 195)
row(c, h - 215, "D0120", "Periodic Oral Evaluation",           "--", 1,  55.00,  44.00)
row(c, h - 232, "D0274", "Bitewing X-Rays (4 images)",         "--", 1,  75.00,  60.00)
row(c, h - 249, "D1110", "Prophylaxis – Adult Cleaning",       "--", 1, 110.00,  88.00)
row(c, h - 266, "D2150", "Amalgam Restoration – 2 surfaces",   "14", 1, 145.00, 116.00)
totals(c, h - 295, 385.00, 308.00, 77.00)
footer(c, "All fees billed in accordance with Ontario Dental Association 2026 Fee Guide.")
c.save()
print("Created clean_dental.pdf")

# ─── RECEIPT 2: UPCODED (billing higher-tier codes than services rendered) ───
c = canvas.Canvas(f"{OUT}/upcoded_dental.pdf", pagesize=letter)
header(c, "QuickCare Dental Centre", "88 Dundas St W, Toronto ON M5G 1Z8",
       "Tel: (416) 555-0377", "2026-03-11", "Aahir Chakraborty-Saha",
       "2004-08-15", "UTSU Dental Plus")
c.setFont("Helvetica-Oblique", 8)
c.setFillColor(colors.HexColor("#cc4400"))
c.drawString(50, h - 175, "⚠  FRAUD INDICATOR: Fees 40–60% above ODA guide; D2750 billed without lab record.")
c.setFillColor(colors.black)
table_header(c, h - 195)
row(c, h - 215, "D0150", "Comprehensive Oral Evaluation",      "--", 1, 160.00, 128.00)  # should be D0120 $55
row(c, h - 232, "D0330", "Panoramic X-Ray (full mouth)",       "--", 1, 285.00, 228.00)  # D0274 billed instead
row(c, h - 249, "D2750", "Crown – Porcelain/Metal (D2750)",    "14", 1, 995.00, 796.00)  # should be D2150 $145
row(c, h - 266, "D4341", "Periodontal Scaling – 4 teeth",      "--", 1, 320.00, 256.00)  # not indicated
totals(c, h - 295, 1760.00, 1408.00, 352.00)
footer(c, "Fees significantly exceed ODA 2026 guide. Crown procedure lacks supporting lab invoice.")
c.save()
print("Created upcoded_dental.pdf")

# ─── RECEIPT 3: UNBUNDLED (billing separately for bundled procedures) ─────────
c = canvas.Canvas(f"{OUT}/unbundled_dental.pdf", pagesize=letter)
header(c, "Metro Smile Clinic", "44 Bay St, Toronto ON M5J 2X1",
       "Tel: (416) 555-0841", "2026-03-12", "Aahir Chakraborty-Saha",
       "2004-08-15", "UTSU Dental Plus")
c.setFont("Helvetica-Oblique", 8)
c.setFillColor(colors.HexColor("#cc4400"))
c.drawString(50, h - 175, "⚠  FRAUD INDICATOR: D2335+D2161 billed separately — should be single D2161. D0274 included in D0150.")
c.setFillColor(colors.black)
table_header(c, h - 195)
row(c, h - 215, "D0150", "Comprehensive Oral Evaluation",      "--", 1, 135.00, 108.00)
row(c, h - 232, "D0274", "Bitewing X-Rays (4 images)",         "--", 1,  75.00,  60.00)  # included in D0150 visit
row(c, h - 249, "D2335", "Resin Restoration – 3 surfaces",     "19", 1, 195.00, 156.00)  # )
row(c, h - 266, "D2161", "Amalgam – 3+ surfaces (same tooth)", "19", 1, 195.00, 156.00)  # ) unbundled - same tooth!
row(c, h - 283, "D9930", "Treatment of Complications",         "--", 1, 150.00, 120.00)  # vague, no diagnosis
totals(c, h - 315, 750.00, 600.00, 150.00)
footer(c, "Two restorations billed for tooth #19 on same date. D0274 not separately billable with D0150.")
c.save()
print("Created unbundled_dental.pdf")

print(f"\nAll receipts saved to: {OUT}")
