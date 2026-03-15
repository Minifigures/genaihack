"""Generate 30 test receipt PDFs for VIGIL system validation."""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fpdf import FPDF

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "demo_receipts")


def make_receipt(filename, provider, address, date, patient, procedures, subtotal=None):
    """Generate a dental receipt PDF."""
    pdf = FPDF()
    pdf.add_page()

    # Header
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 8, provider, new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 5, address, new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(6)

    # Patient info
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 6, "DENTAL RECEIPT", new_x="LMARGIN", new_y="NEXT")
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(3)
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(95, 5, f"Patient: {patient}", new_x="RIGHT", new_y="TOP")
    pdf.cell(95, 5, f"Date: {date}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    # Table header
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_fill_color(235, 235, 235)
    pdf.cell(20, 6, "Code", border=1, fill=True)
    pdf.cell(80, 6, "Description", border=1, fill=True)
    pdf.cell(20, 6, "Tooth", border=1, fill=True, align="C")
    pdf.cell(30, 6, "Fee", border=1, fill=True, align="R")
    pdf.cell(30, 6, "ODA Fee", border=1, fill=True, align="R")
    pdf.ln()

    # Procedures
    pdf.set_font("Helvetica", "", 9)
    total = 0
    for p in procedures:
        code = p.get("code", "")
        desc = p.get("desc", "")
        tooth = p.get("tooth", "")
        fee = p.get("fee", 0)
        oda = p.get("oda", "")
        total += fee
        pdf.cell(20, 5, str(code), border=1)
        pdf.cell(80, 5, desc, border=1)
        pdf.cell(20, 5, str(tooth), border=1, align="C")
        pdf.cell(30, 5, f"${fee:.2f}", border=1, align="R")
        pdf.cell(30, 5, f"${oda}" if oda else "", border=1, align="R")
        pdf.ln()

    if subtotal is None:
        subtotal = total

    pdf.ln(3)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(120, 6, "")
    pdf.cell(30, 6, "Total:", align="R")
    pdf.cell(30, 6, f"${subtotal:.2f}", align="R")

    path = os.path.join(OUTPUT_DIR, filename)
    pdf.output(path)
    print(f"  Created: {filename} (${subtotal:.2f})")


# ============================================================
# 10 GENUINE CLEAN RECEIPTS (fees at or within 10% of ODA)
# ============================================================
print("=== CLEAN RECEIPTS ===")

make_receipt("real_01.pdf", "UofT Dental Clinic", "124 Edward St, Toronto, ON M5G 1E2",
    "2025-01-20", "Alex Chen",
    [{"code": "11101", "desc": "Recall examination", "fee": 78.00, "oda": "78.00"},
     {"code": "02202", "desc": "Periapical radiographs, 2 films", "fee": 42.00, "oda": "42.00"},
     {"code": "11111", "desc": "Scaling, first unit", "fee": 55.00, "oda": "55.00"}])

make_receipt("real_02.pdf", "Bay Street Dental", "55 Bay St, Toronto, ON M5J 2T3",
    "2025-02-03", "Jordan Williams",
    [{"code": "11102", "desc": "Complete oral examination", "fee": 125.00, "oda": "120.00"},
     {"code": "01202", "desc": "Bitewing radiographs, 2 films", "fee": 40.00, "oda": "38.00"},
     {"code": "11111", "desc": "Scaling, first unit", "fee": 57.00, "oda": "55.00"},
     {"code": "11117", "desc": "Scaling, additional unit", "fee": 57.00, "oda": "55.00"}])

make_receipt("real_03.pdf", "College Park Dental", "777 Bay St, Toronto, ON M5G 2C8",
    "2025-01-10", "Priya Patel",
    [{"code": "11101", "desc": "Recall examination", "fee": 82.00, "oda": "78.00"},
     {"code": "02202", "desc": "Periapical radiographs, 2 films", "fee": 44.00, "oda": "42.00"},
     {"code": "23111", "desc": "Composite resin, 1 surface, anterior", "fee": 155.00, "oda": "150.00", "tooth": "11"}])

make_receipt("real_04.pdf", "Yonge-Eglinton Dental", "2300 Yonge St, Toronto, ON M4P 1E4",
    "2025-02-14", "Marcus Lee",
    [{"code": "11101", "desc": "Recall examination", "fee": 80.00, "oda": "78.00"},
     {"code": "01202", "desc": "Bitewing radiographs, 2 films", "fee": 38.00, "oda": "38.00"},
     {"code": "11111", "desc": "Scaling, first unit", "fee": 55.00, "oda": "55.00"},
     {"code": "13401", "desc": "Fluoride treatment", "fee": 30.00, "oda": "28.00"}])

make_receipt("real_05.pdf", "Spadina Dental Office", "510 Spadina Ave, Toronto, ON M5S 2H1",
    "2025-03-01", "Emily Zhang",
    [{"code": "11101", "desc": "Recall examination", "fee": 78.00, "oda": "78.00"},
     {"code": "02202", "desc": "Periapical radiographs, 2 films", "fee": 42.00, "oda": "42.00"},
     {"code": "12101", "desc": "Polishing", "fee": 47.00, "oda": "45.00"},
     {"code": "11111", "desc": "Scaling, first unit", "fee": 55.00, "oda": "55.00"},
     {"code": "11117", "desc": "Scaling, additional unit", "fee": 55.00, "oda": "55.00"}])

make_receipt("real_06.pdf", "Bloor-Bathurst Dental", "710 Bloor St W, Toronto, ON M6G 1L5",
    "2025-01-28", "David Kim",
    [{"code": "11101", "desc": "Recall examination", "fee": 80.00, "oda": "78.00"},
     {"code": "23112", "desc": "Composite resin, 2 surfaces, anterior", "fee": 195.00, "oda": "190.00", "tooth": "22"}])

make_receipt("real_07.pdf", "Annex Dental Group", "245 College St, Toronto, ON M5T 1R5",
    "2025-02-20", "Sarah Thompson",
    [{"code": "11102", "desc": "Complete oral examination", "fee": 120.00, "oda": "120.00"},
     {"code": "01202", "desc": "Bitewing radiographs, 2 films", "fee": 38.00, "oda": "38.00"},
     {"code": "02202", "desc": "Periapical radiographs, 2 films", "fee": 42.00, "oda": "42.00"},
     {"code": "11111", "desc": "Scaling, first unit", "fee": 58.00, "oda": "55.00"},
     {"code": "13401", "desc": "Fluoride treatment", "fee": 28.00, "oda": "28.00"}])

make_receipt("real_08.pdf", "King West Dental", "500 King St W, Toronto, ON M5V 1L9",
    "2025-03-05", "Michael Brown",
    [{"code": "11101", "desc": "Recall examination", "fee": 78.00, "oda": "78.00"},
     {"code": "71101", "desc": "Extraction, erupted tooth", "fee": 130.00, "oda": "125.00", "tooth": "38"}])

make_receipt("real_09.pdf", "Dundas Square Dental", "10 Dundas St E, Toronto, ON M5B 2G9",
    "2025-02-12", "Lisa Wang",
    [{"code": "11101", "desc": "Recall examination", "fee": 82.00, "oda": "78.00"},
     {"code": "02202", "desc": "Periapical radiographs, 2 films", "fee": 45.00, "oda": "42.00"},
     {"code": "11111", "desc": "Scaling, first unit", "fee": 58.00, "oda": "55.00"},
     {"code": "11117", "desc": "Scaling, additional unit", "fee": 58.00, "oda": "55.00"},
     {"code": "12101", "desc": "Polishing", "fee": 48.00, "oda": "45.00"}])

make_receipt("real_10.pdf", "St. George Dental", "180 St. George St, Toronto, ON M5R 2M7",
    "2025-01-15", "James Park",
    [{"code": "11101", "desc": "Recall examination", "fee": 78.00, "oda": "78.00"},
     {"code": "01202", "desc": "Bitewing radiographs, 2 films", "fee": 38.00, "oda": "38.00"},
     {"code": "23111", "desc": "Composite resin, 1 surface, anterior", "fee": 155.00, "oda": "150.00", "tooth": "21"},
     {"code": "23112", "desc": "Composite resin, 2 surfaces, anterior", "fee": 195.00, "oda": "190.00", "tooth": "12"},
     {"code": "11111", "desc": "Scaling, first unit", "fee": 55.00, "oda": "55.00"}])

# ============================================================
# 10 FRAUD RECEIPTS (various fraud patterns)
# ============================================================
print("\n=== FRAUD RECEIPTS ===")

# 1. Heavy fee deviation (80-150% above ODA)
make_receipt("fraud_01.pdf", "Downtown Dental Group", "789 Bay St, Toronto, ON M5G 2N8",
    "2025-01-22", "Student A",
    [{"code": "11101", "desc": "Recall examination", "fee": 175.00, "oda": "78.00"},
     {"code": "02202", "desc": "Periapical radiographs, 2 films", "fee": 95.00, "oda": "42.00"},
     {"code": "11111", "desc": "Scaling, first unit", "fee": 120.00, "oda": "55.00"},
     {"code": "11117", "desc": "Scaling, additional unit", "fee": 115.00, "oda": "55.00"}])

# 2. Upcoding (scaling billed as root planing)
make_receipt("fraud_02.pdf", "Dr. Smith Dental Clinic", "123 University Ave, Toronto, ON M5H 1T1",
    "2025-02-05", "Student B",
    [{"code": "11101", "desc": "Recall examination", "fee": 78.00, "oda": "78.00"},
     {"code": "43421", "desc": "Root planing, per quadrant", "fee": 350.00, "oda": "195.00", "tooth": "14"},
     {"code": "11117", "desc": "Scaling, additional unit", "fee": 55.00, "oda": "55.00"}])

# 3. Unbundling (5 scaling units billed separately)
make_receipt("fraud_03.pdf", "Queensway Family Dentistry", "300 Queensway, Toronto, ON M8Z 1N4",
    "2025-02-18", "Student C",
    [{"code": "11101", "desc": "Recall examination", "fee": 82.00, "oda": "78.00"},
     {"code": "11117", "desc": "Scaling, unit 1", "fee": 75.00, "oda": "55.00"},
     {"code": "11117", "desc": "Scaling, unit 2", "fee": 75.00, "oda": "55.00"},
     {"code": "11117", "desc": "Scaling, unit 3", "fee": 75.00, "oda": "55.00"},
     {"code": "11117", "desc": "Scaling, unit 4", "fee": 75.00, "oda": "55.00"},
     {"code": "11117", "desc": "Scaling, unit 5", "fee": 75.00, "oda": "55.00"}])

# 4. Phantom billing (crown on healthy tooth)
make_receipt("fraud_04.pdf", "Midtown Dental Centre", "1200 Bay St, Toronto, ON M5R 2A5",
    "2025-01-30", "Student D",
    [{"code": "11101", "desc": "Recall examination", "fee": 78.00, "oda": "78.00"},
     {"code": "27201", "desc": "Crown, porcelain fused to metal", "fee": 1450.00, "oda": "1100.00", "tooth": "36"},
     {"code": "02202", "desc": "Periapical radiographs, 2 films", "fee": 42.00, "oda": "42.00"}])

# 5. Duplicate claims (same procedure twice for same tooth)
make_receipt("fraud_05.pdf", "Lakeshore Dental", "2100 Lake Shore Blvd W, Toronto, ON M8V 1A1",
    "2025-03-02", "Student E",
    [{"code": "11101", "desc": "Recall examination", "fee": 78.00, "oda": "78.00"},
     {"code": "23112", "desc": "Composite resin, 2 surfaces", "fee": 220.00, "oda": "190.00", "tooth": "21"},
     {"code": "23112", "desc": "Composite resin, 2 surfaces", "fee": 220.00, "oda": "190.00", "tooth": "21"},
     {"code": "11111", "desc": "Scaling, first unit", "fee": 55.00, "oda": "55.00"}])

# 6. Combined upcoding + fee deviation
make_receipt("fraud_06.pdf", "Dr. Smith Dental Clinic", "123 University Ave, Toronto, ON M5H 1T1",
    "2025-02-25", "Student F",
    [{"code": "11101", "desc": "Recall examination", "fee": 160.00, "oda": "78.00"},
     {"code": "02202", "desc": "Periapical radiographs, 2 films", "fee": 90.00, "oda": "42.00"},
     {"code": "43421", "desc": "Root planing, per quadrant", "fee": 400.00, "oda": "195.00", "tooth": "14"},
     {"code": "43427", "desc": "Root planing, 3+ quadrants", "fee": 380.00, "oda": "185.00"},
     {"code": "11117", "desc": "Scaling, additional unit", "fee": 100.00, "oda": "55.00"}])

# 7. Extreme overcharge on single procedure
make_receipt("fraud_07.pdf", "Premium Dental Studio", "400 University Ave, Toronto, ON M5G 1S5",
    "2025-01-08", "Student G",
    [{"code": "11101", "desc": "Recall examination", "fee": 78.00, "oda": "78.00"},
     {"code": "27201", "desc": "Crown, porcelain", "fee": 2800.00, "oda": "1100.00", "tooth": "46"},
     {"code": "02202", "desc": "Periapical radiographs, 2 films", "fee": 42.00, "oda": "42.00"}])

# 8. Multiple fraud types combined
make_receipt("fraud_08.pdf", "Downtown Dental Group", "789 Bay St, Toronto, ON M5G 2N8",
    "2025-03-10", "Student H",
    [{"code": "11101", "desc": "Recall examination", "fee": 150.00, "oda": "78.00"},
     {"code": "43421", "desc": "Root planing, per quadrant", "fee": 350.00, "oda": "195.00", "tooth": "14"},
     {"code": "11117", "desc": "Scaling, unit 1", "fee": 80.00, "oda": "55.00"},
     {"code": "11117", "desc": "Scaling, unit 2", "fee": 80.00, "oda": "55.00"},
     {"code": "11117", "desc": "Scaling, unit 3", "fee": 80.00, "oda": "55.00"},
     {"code": "23112", "desc": "Composite resin, 2 surfaces", "fee": 250.00, "oda": "190.00", "tooth": "11"}])

# 9. Moderate/borderline fraud (20-40% deviation)
make_receipt("fraud_09.pdf", "Village Dental Care", "88 College St, Toronto, ON M5G 1L4",
    "2025-02-08", "Student I",
    [{"code": "11101", "desc": "Recall examination", "fee": 105.00, "oda": "78.00"},
     {"code": "02202", "desc": "Periapical radiographs, 2 films", "fee": 55.00, "oda": "42.00"},
     {"code": "11111", "desc": "Scaling, first unit", "fee": 72.00, "oda": "55.00"},
     {"code": "11117", "desc": "Scaling, additional unit", "fee": 72.00, "oda": "55.00"}])

# 10. Systematic overcharge (every procedure 50-70% above)
make_receipt("fraud_10.pdf", "Smile Bright Dentistry", "200 Bloor St W, Toronto, ON M5S 1T8",
    "2025-01-25", "Student J",
    [{"code": "11101", "desc": "Recall examination", "fee": 130.00, "oda": "78.00"},
     {"code": "02202", "desc": "Periapical radiographs, 2 films", "fee": 70.00, "oda": "42.00"},
     {"code": "11111", "desc": "Scaling, first unit", "fee": 90.00, "oda": "55.00"},
     {"code": "11117", "desc": "Scaling, additional unit", "fee": 85.00, "oda": "55.00"},
     {"code": "23111", "desc": "Composite resin, 1 surface", "fee": 250.00, "oda": "150.00", "tooth": "13"},
     {"code": "12101", "desc": "Polishing", "fee": 75.00, "oda": "45.00"}])

# ============================================================
# 10 AI-GENERATED RECEIPTS (mix of clean and suspicious)
# ============================================================
print("\n=== AI-GENERATED RECEIPTS ===")

# 1-3: Clean with slightly unusual formatting
make_receipt("ai_gen_01.pdf", "Toronto Smiles Dental Corp.", "Suite 1400, 100 King St W, Toronto, ON M5X 1A1",
    "2025-01-12", "AI Patient Alpha",
    [{"code": "11101", "desc": "Periodic Oral Exam", "fee": 78.00, "oda": "78.00"},
     {"code": "02202", "desc": "PA Radiographs x2", "fee": 42.00, "oda": "42.00"},
     {"code": "11111", "desc": "Prophylaxis Unit I", "fee": 55.00, "oda": "55.00"}])

make_receipt("ai_gen_02.pdf", "Dental Health Associates Inc.", "2000 Finch Ave W, Toronto, ON M3N 2V6",
    "2025-02-01", "AI Patient Beta",
    [{"code": "11102", "desc": "Comprehensive Dental Evaluation", "fee": 124.00, "oda": "120.00"},
     {"code": "01202", "desc": "Bilateral Bitewing Series", "fee": 40.00, "oda": "38.00"},
     {"code": "11111", "desc": "Dental Scaling Session I", "fee": 58.00, "oda": "55.00"},
     {"code": "11117", "desc": "Dental Scaling Session II", "fee": 58.00, "oda": "55.00"},
     {"code": "13401", "desc": "Topical Fluoride Application", "fee": 30.00, "oda": "28.00"}])

make_receipt("ai_gen_03.pdf", "North York Dental Wellness", "5000 Yonge St, Toronto, ON M2N 7E9",
    "2025-03-08", "AI Patient Gamma",
    [{"code": "11101", "desc": "Dental Recall Assessment", "fee": 80.00, "oda": "78.00"},
     {"code": "23111", "desc": "Anterior Composite Restoration (1S)", "fee": 155.00, "oda": "150.00", "tooth": "21"},
     {"code": "12101", "desc": "Dental Polish and Finish", "fee": 48.00, "oda": "45.00"}])

# 4-6: Moderate irregularities (15-30% deviations)
make_receipt("ai_gen_04.pdf", "Comprehensive Dental Solutions", "333 Bay St, Toronto, ON M5H 2R2",
    "2025-01-18", "AI Patient Delta",
    [{"code": "11101", "desc": "Oral Examination", "fee": 98.00, "oda": "78.00"},
     {"code": "02202", "desc": "Periapical X-Ray Series", "fee": 52.00, "oda": "42.00"},
     {"code": "11111", "desc": "Scaling Treatment", "fee": 68.00, "oda": "55.00"},
     {"code": "11117", "desc": "Additional Scaling", "fee": 68.00, "oda": "55.00"}])

make_receipt("ai_gen_05.pdf", "Advanced Dental Care Group", "800 Bathurst St, Toronto, ON M5R 3M8",
    "2025-02-22", "AI Patient Epsilon",
    [{"code": "11101", "desc": "Periodic Examination", "fee": 95.00, "oda": "78.00"},
     {"code": "23112", "desc": "Two-Surface Composite", "fee": 230.00, "oda": "190.00", "tooth": "14"},
     {"code": "11111", "desc": "Initial Scaling Unit", "fee": 65.00, "oda": "55.00"}])

make_receipt("ai_gen_06.pdf", "University District Dental", "600 University Ave, Toronto, ON M5G 1X5",
    "2025-03-12", "AI Patient Zeta",
    [{"code": "11102", "desc": "New Patient Comprehensive Exam", "fee": 145.00, "oda": "120.00"},
     {"code": "01202", "desc": "Diagnostic Bitewings", "fee": 48.00, "oda": "38.00"},
     {"code": "02202", "desc": "Periapical Films", "fee": 52.00, "oda": "42.00"},
     {"code": "11111", "desc": "Scaling Unit 1", "fee": 65.00, "oda": "55.00"},
     {"code": "11117", "desc": "Scaling Unit 2", "fee": 65.00, "oda": "55.00"}])

# 7-8: Suspicious upcoding patterns
make_receipt("ai_gen_07.pdf", "Elite Dental Professionals", "150 Bloor St W, Toronto, ON M5S 2X9",
    "2025-01-28", "AI Patient Eta",
    [{"code": "11101", "desc": "Standard Recall Exam", "fee": 78.00, "oda": "78.00"},
     {"code": "43421", "desc": "Periodontal Root Planing Q1", "fee": 280.00, "oda": "195.00", "tooth": "16"},
     {"code": "43421", "desc": "Periodontal Root Planing Q2", "fee": 280.00, "oda": "195.00", "tooth": "26"},
     {"code": "11117", "desc": "Scaling Supplementary Unit", "fee": 60.00, "oda": "55.00"}])

make_receipt("ai_gen_08.pdf", "Premier Dental Studio", "90 Eglinton Ave E, Toronto, ON M4P 2Y3",
    "2025-02-15", "AI Patient Theta",
    [{"code": "11101", "desc": "Oral Assessment", "fee": 100.00, "oda": "78.00"},
     {"code": "43427", "desc": "Comprehensive Root Planing", "fee": 350.00, "oda": "185.00"},
     {"code": "11117", "desc": "Adjunctive Scaling", "fee": 80.00, "oda": "55.00"},
     {"code": "11117", "desc": "Adjunctive Scaling", "fee": 80.00, "oda": "55.00"}])

# 9-10: Clear fraud with unusual combos
make_receipt("ai_gen_09.pdf", "Dental Excellence Toronto", "1 Dundas St W, Toronto, ON M5G 1Z3",
    "2025-03-01", "AI Patient Iota",
    [{"code": "11101", "desc": "Examination", "fee": 180.00, "oda": "78.00"},
     {"code": "27201", "desc": "Porcelain Crown Restoration", "fee": 1800.00, "oda": "1100.00", "tooth": "36"},
     {"code": "43421", "desc": "Deep Scaling (Root Planing)", "fee": 400.00, "oda": "195.00", "tooth": "14"},
     {"code": "11117", "desc": "Scaling Add-on", "fee": 100.00, "oda": "55.00"},
     {"code": "11117", "desc": "Scaling Add-on", "fee": 100.00, "oda": "55.00"},
     {"code": "11117", "desc": "Scaling Add-on", "fee": 100.00, "oda": "55.00"}])

make_receipt("ai_gen_10.pdf", "Prestige Oral Health Centre", "4700 Keele St, Toronto, ON M3J 1P3",
    "2025-02-28", "AI Patient Kappa",
    [{"code": "11101", "desc": "Dental Recall", "fee": 140.00, "oda": "78.00"},
     {"code": "02202", "desc": "Radiographic Assessment", "fee": 85.00, "oda": "42.00"},
     {"code": "27211", "desc": "Full Metal Crown", "fee": 1600.00, "oda": "950.00", "tooth": "46"},
     {"code": "23112", "desc": "Composite Filling 2S", "fee": 300.00, "oda": "190.00", "tooth": "11"},
     {"code": "23112", "desc": "Composite Filling 2S", "fee": 300.00, "oda": "190.00", "tooth": "11"}])

print(f"\nDone! 30 receipts generated in {OUTPUT_DIR}")
