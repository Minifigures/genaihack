"""Demo OCR data for 30+ test receipts. Used when DEMO_MODE=true."""

from backend.models.claim import OCRResult, Procedure


def get_demo_receipt(filename: str) -> OCRResult:
    """Return demo OCR data matched by filename pattern."""
    name = filename.lower()

    # Original 3 demo receipts
    if "unbundled" in name:
        return _unbundled()
    if "upcoded" in name:
        return _upcoded()
    if "clean" in name and "dental" in name:
        return _clean()

    # 10 clean receipts
    if "real_01" in name: return _real_01()
    if "real_02" in name: return _real_02()
    if "real_03" in name: return _real_03()
    if "real_04" in name: return _real_04()
    if "real_05" in name: return _real_05()
    if "real_06" in name: return _real_06()
    if "real_07" in name: return _real_07()
    if "real_08" in name: return _real_08()
    if "real_09" in name: return _real_09()
    if "real_10" in name: return _real_10()

    # 10 fraud receipts
    if "fraud_01" in name: return _fraud_01()
    if "fraud_02" in name: return _fraud_02()
    if "fraud_03" in name: return _fraud_03()
    if "fraud_04" in name: return _fraud_04()
    if "fraud_05" in name: return _fraud_05()
    if "fraud_06" in name: return _fraud_06()
    if "fraud_07" in name: return _fraud_07()
    if "fraud_08" in name: return _fraud_08()
    if "fraud_09" in name: return _fraud_09()
    if "fraud_10" in name: return _fraud_10()

    # 10 AI-generated receipts
    if "ai_gen_01" in name: return _ai_gen_01()
    if "ai_gen_02" in name: return _ai_gen_02()
    if "ai_gen_03" in name: return _ai_gen_03()
    if "ai_gen_04" in name: return _ai_gen_04()
    if "ai_gen_05" in name: return _ai_gen_05()
    if "ai_gen_06" in name: return _ai_gen_06()
    if "ai_gen_07" in name: return _ai_gen_07()
    if "ai_gen_08" in name: return _ai_gen_08()
    if "ai_gen_09" in name: return _ai_gen_09()
    if "ai_gen_10" in name: return _ai_gen_10()

    # fraud_test.pdf (manually created extreme fraud receipt)
    if "fraud_test" in name:
        return _fraud_test()

    # Default fallback
    return _clean()


# === ORIGINAL 3 ===

def _clean():
    return OCRResult(provider_name="Maple Dental Centre", provider_address="456 Bloor St W, Toronto, ON M5S 1X8", claim_date="2025-02-10",
        procedures=[Procedure(code="11101", description="Exam, recall", fee_charged=78.00), Procedure(code="02202", description="Radiographs, periapical, 2 films", fee_charged=42.00), Procedure(code="11111", description="Scaling, first unit", fee_charged=55.00)],
        subtotal=175.00, tax=None, total=175.00, ocr_confidence=0.97, raw_text="clean dental receipt")

def _upcoded():
    return OCRResult(provider_name="Dr. Smith Dental Clinic", provider_address="123 University Ave, Toronto, ON M5H 1T1", claim_date="2025-01-15",
        procedures=[Procedure(code="11101", description="Exam, recall", fee_charged=150.00), Procedure(code="02202", description="Radiographs, periapical, 2 films", fee_charged=85.00), Procedure(code="43421", description="Root planing, per quadrant", fee_charged=350.00, tooth_number="14"), Procedure(code="11117", description="Scaling, additional unit", fee_charged=95.00)],
        subtotal=680.00, tax=None, total=680.00, ocr_confidence=0.95, raw_text="upcoded dental receipt")

def _unbundled():
    return OCRResult(provider_name="Queensway Family Dentistry", provider_address="789 Queensway Ave, Toronto, ON M8Z 1N4", claim_date="2025-03-05",
        procedures=[Procedure(code="11101", description="Exam, recall", fee_charged=82.00), Procedure(code="02202", description="Radiographs, periapical, 2 films", fee_charged=48.00), Procedure(code="23112", description="Composite resin, 2 surfaces, anterior", fee_charged=220.00, tooth_number="21"), Procedure(code="23112", description="Composite resin, 2 surfaces, anterior", fee_charged=220.00, tooth_number="21"), Procedure(code="11117", description="Scaling, additional unit", fee_charged=75.00), Procedure(code="11117", description="Scaling, additional unit", fee_charged=75.00), Procedure(code="11117", description="Scaling, additional unit", fee_charged=75.00)],
        subtotal=795.00, tax=None, total=795.00, ocr_confidence=0.93, raw_text="unbundled dental receipt")


# === 10 CLEAN RECEIPTS ===

def _real_01():
    return OCRResult(provider_name="UofT Dental Clinic", provider_address="124 Edward St, Toronto, ON M5G 1E2", claim_date="2025-01-20",
        procedures=[Procedure(code="11101", description="Recall examination", fee_charged=78.00), Procedure(code="02202", description="Periapical radiographs, 2 films", fee_charged=42.00), Procedure(code="11111", description="Scaling, first unit", fee_charged=55.00)],
        subtotal=175.00, tax=None, total=175.00, ocr_confidence=0.96, raw_text="UofT Dental clean receipt")

def _real_02():
    return OCRResult(provider_name="Bay Street Dental", provider_address="55 Bay St, Toronto, ON M5J 2T3", claim_date="2025-02-03",
        procedures=[Procedure(code="11102", description="Complete oral examination", fee_charged=125.00), Procedure(code="01202", description="Bitewing radiographs, 2 films", fee_charged=40.00), Procedure(code="11111", description="Scaling, first unit", fee_charged=57.00), Procedure(code="11117", description="Scaling, additional unit", fee_charged=57.00)],
        subtotal=279.00, tax=None, total=279.00, ocr_confidence=0.95, raw_text="Bay Street Dental clean receipt")

def _real_03():
    return OCRResult(provider_name="College Park Dental", provider_address="777 Bay St, Toronto, ON M5G 2C8", claim_date="2025-01-10",
        procedures=[Procedure(code="11101", description="Recall examination", fee_charged=82.00), Procedure(code="02202", description="Periapical radiographs, 2 films", fee_charged=44.00), Procedure(code="23111", description="Composite resin, 1 surface, anterior", fee_charged=155.00, tooth_number="11")],
        subtotal=281.00, tax=None, total=281.00, ocr_confidence=0.94, raw_text="College Park clean receipt")

def _real_04():
    return OCRResult(provider_name="Yonge-Eglinton Dental", provider_address="2300 Yonge St, Toronto, ON M4P 1E4", claim_date="2025-02-14",
        procedures=[Procedure(code="11101", description="Recall examination", fee_charged=80.00), Procedure(code="01202", description="Bitewing radiographs, 2 films", fee_charged=38.00), Procedure(code="11111", description="Scaling, first unit", fee_charged=55.00), Procedure(code="13401", description="Fluoride treatment", fee_charged=30.00)],
        subtotal=203.00, tax=None, total=203.00, ocr_confidence=0.96, raw_text="Yonge-Eglinton clean receipt")

def _real_05():
    return OCRResult(provider_name="Spadina Dental Office", provider_address="510 Spadina Ave, Toronto, ON M5S 2H1", claim_date="2025-03-01",
        procedures=[Procedure(code="11101", description="Recall examination", fee_charged=78.00), Procedure(code="02202", description="Periapical radiographs, 2 films", fee_charged=42.00), Procedure(code="12101", description="Polishing", fee_charged=47.00), Procedure(code="11111", description="Scaling, first unit", fee_charged=55.00), Procedure(code="11117", description="Scaling, additional unit", fee_charged=55.00)],
        subtotal=277.00, tax=None, total=277.00, ocr_confidence=0.95, raw_text="Spadina clean receipt")

def _real_06():
    return OCRResult(provider_name="Bloor-Bathurst Dental", provider_address="710 Bloor St W, Toronto, ON M6G 1L5", claim_date="2025-01-28",
        procedures=[Procedure(code="11101", description="Recall examination", fee_charged=80.00), Procedure(code="23112", description="Composite resin, 2 surfaces, anterior", fee_charged=195.00, tooth_number="22")],
        subtotal=275.00, tax=None, total=275.00, ocr_confidence=0.96, raw_text="Bloor-Bathurst clean receipt")

def _real_07():
    return OCRResult(provider_name="Annex Dental Group", provider_address="245 College St, Toronto, ON M5T 1R5", claim_date="2025-02-20",
        procedures=[Procedure(code="11102", description="Complete oral examination", fee_charged=120.00), Procedure(code="01202", description="Bitewing radiographs, 2 films", fee_charged=38.00), Procedure(code="02202", description="Periapical radiographs, 2 films", fee_charged=42.00), Procedure(code="11111", description="Scaling, first unit", fee_charged=58.00), Procedure(code="13401", description="Fluoride treatment", fee_charged=28.00)],
        subtotal=286.00, tax=None, total=286.00, ocr_confidence=0.97, raw_text="Annex Dental clean receipt")

def _real_08():
    return OCRResult(provider_name="King West Dental", provider_address="500 King St W, Toronto, ON M5V 1L9", claim_date="2025-03-05",
        procedures=[Procedure(code="11101", description="Recall examination", fee_charged=78.00), Procedure(code="71101", description="Extraction, erupted tooth", fee_charged=130.00, tooth_number="38")],
        subtotal=208.00, tax=None, total=208.00, ocr_confidence=0.95, raw_text="King West extraction receipt")

def _real_09():
    return OCRResult(provider_name="Dundas Square Dental", provider_address="10 Dundas St E, Toronto, ON M5B 2G9", claim_date="2025-02-12",
        procedures=[Procedure(code="11101", description="Recall examination", fee_charged=82.00), Procedure(code="02202", description="Periapical radiographs, 2 films", fee_charged=45.00), Procedure(code="11111", description="Scaling, first unit", fee_charged=58.00), Procedure(code="11117", description="Scaling, additional unit", fee_charged=58.00), Procedure(code="12101", description="Polishing", fee_charged=48.00)],
        subtotal=291.00, tax=None, total=291.00, ocr_confidence=0.94, raw_text="Dundas Square clean receipt")

def _real_10():
    return OCRResult(provider_name="St. George Dental", provider_address="180 St. George St, Toronto, ON M5R 2M7", claim_date="2025-01-15",
        procedures=[Procedure(code="11101", description="Recall examination", fee_charged=78.00), Procedure(code="01202", description="Bitewing radiographs, 2 films", fee_charged=38.00), Procedure(code="23111", description="Composite resin, 1 surface, anterior", fee_charged=155.00, tooth_number="21"), Procedure(code="23112", description="Composite resin, 2 surfaces, anterior", fee_charged=195.00, tooth_number="12"), Procedure(code="11111", description="Scaling, first unit", fee_charged=55.00)],
        subtotal=521.00, tax=None, total=521.00, ocr_confidence=0.95, raw_text="St. George multi-filling receipt")


# === 10 FRAUD RECEIPTS ===

def _fraud_01():
    """Heavy fee deviation: all fees 80-150% above ODA."""
    return OCRResult(provider_name="Downtown Dental Group", provider_address="789 Bay St, Toronto, ON M5G 2N8", claim_date="2025-01-22",
        procedures=[Procedure(code="11101", description="Recall examination", fee_charged=175.00), Procedure(code="02202", description="Periapical radiographs, 2 films", fee_charged=95.00), Procedure(code="11111", description="Scaling, first unit", fee_charged=120.00), Procedure(code="11117", description="Scaling, additional unit", fee_charged=115.00)],
        subtotal=505.00, tax=None, total=505.00, ocr_confidence=0.93, raw_text="Downtown Dental overcharged receipt")

def _fraud_02():
    """Upcoding: scaling billed as root planing."""
    return OCRResult(provider_name="Dr. Smith Dental Clinic", provider_address="123 University Ave, Toronto, ON M5H 1T1", claim_date="2025-02-05",
        procedures=[Procedure(code="11101", description="Recall examination", fee_charged=78.00), Procedure(code="43421", description="Root planing, per quadrant", fee_charged=350.00, tooth_number="14"), Procedure(code="11117", description="Scaling, additional unit", fee_charged=55.00)],
        subtotal=483.00, tax=None, total=483.00, ocr_confidence=0.94, raw_text="upcoded scaling as root planing")

def _fraud_03():
    """Unbundling: 5 scaling units billed separately."""
    return OCRResult(provider_name="Queensway Family Dentistry", provider_address="300 Queensway, Toronto, ON M8Z 1N4", claim_date="2025-02-18",
        procedures=[Procedure(code="11101", description="Recall examination", fee_charged=82.00), Procedure(code="11117", description="Scaling, unit 1", fee_charged=75.00), Procedure(code="11117", description="Scaling, unit 2", fee_charged=75.00), Procedure(code="11117", description="Scaling, unit 3", fee_charged=75.00), Procedure(code="11117", description="Scaling, unit 4", fee_charged=75.00), Procedure(code="11117", description="Scaling, unit 5", fee_charged=75.00)],
        subtotal=457.00, tax=None, total=457.00, ocr_confidence=0.92, raw_text="5 scaling units unbundled")

def _fraud_04():
    """Phantom billing: overpriced crown + inflated exam + unnecessary scaling."""
    return OCRResult(provider_name="Midtown Dental Centre", provider_address="1200 Bay St, Toronto, ON M5R 2A5", claim_date="2025-01-30",
        procedures=[Procedure(code="11101", description="Recall examination", fee_charged=145.00), Procedure(code="27201", description="Crown, porcelain fused to metal", fee_charged=1650.00, tooth_number="36"), Procedure(code="02202", description="Periapical radiographs, 2 films", fee_charged=70.00), Procedure(code="11117", description="Scaling, additional unit", fee_charged=85.00)],
        subtotal=1950.00, tax=None, total=1950.00, ocr_confidence=0.91, raw_text="phantom crown with inflated fees")

def _fraud_05():
    """Duplicate claims: same composite twice for same tooth."""
    return OCRResult(provider_name="Lakeshore Dental", provider_address="2100 Lake Shore Blvd W, Toronto, ON M8V 1A1", claim_date="2025-03-02",
        procedures=[Procedure(code="11101", description="Recall examination", fee_charged=78.00), Procedure(code="23112", description="Composite resin, 2 surfaces", fee_charged=220.00, tooth_number="21"), Procedure(code="23112", description="Composite resin, 2 surfaces", fee_charged=220.00, tooth_number="21"), Procedure(code="11111", description="Scaling, first unit", fee_charged=55.00)],
        subtotal=573.00, tax=None, total=573.00, ocr_confidence=0.93, raw_text="duplicate composite claim")

def _fraud_06():
    """Combined upcoding + fee deviation."""
    return OCRResult(provider_name="Dr. Smith Dental Clinic", provider_address="123 University Ave, Toronto, ON M5H 1T1", claim_date="2025-02-25",
        procedures=[Procedure(code="11101", description="Recall examination", fee_charged=160.00), Procedure(code="02202", description="Periapical radiographs, 2 films", fee_charged=90.00), Procedure(code="43421", description="Root planing, per quadrant", fee_charged=400.00, tooth_number="14"), Procedure(code="43427", description="Root planing, 3+ quadrants", fee_charged=380.00), Procedure(code="11117", description="Scaling, additional unit", fee_charged=100.00)],
        subtotal=1130.00, tax=None, total=1130.00, ocr_confidence=0.92, raw_text="combined upcoding and fee deviation")

def _fraud_07():
    """Extreme overcharge on single procedure (crown 154% above ODA)."""
    return OCRResult(provider_name="Premium Dental Studio", provider_address="400 University Ave, Toronto, ON M5G 1S5", claim_date="2025-01-08",
        procedures=[Procedure(code="11101", description="Recall examination", fee_charged=78.00), Procedure(code="27201", description="Crown, porcelain", fee_charged=2800.00, tooth_number="46"), Procedure(code="02202", description="Periapical radiographs, 2 films", fee_charged=42.00)],
        subtotal=2920.00, tax=None, total=2920.00, ocr_confidence=0.90, raw_text="extreme crown overcharge")

def _fraud_08():
    """Multiple fraud types: upcoding + unbundling + deviation."""
    return OCRResult(provider_name="Downtown Dental Group", provider_address="789 Bay St, Toronto, ON M5G 2N8", claim_date="2025-03-10",
        procedures=[Procedure(code="11101", description="Recall examination", fee_charged=150.00), Procedure(code="43421", description="Root planing, per quadrant", fee_charged=350.00, tooth_number="14"), Procedure(code="11117", description="Scaling, unit 1", fee_charged=80.00), Procedure(code="11117", description="Scaling, unit 2", fee_charged=80.00), Procedure(code="11117", description="Scaling, unit 3", fee_charged=80.00), Procedure(code="23112", description="Composite resin, 2 surfaces", fee_charged=250.00, tooth_number="11")],
        subtotal=990.00, tax=None, total=990.00, ocr_confidence=0.91, raw_text="multi-type fraud receipt")

def _fraud_09():
    """Moderate/borderline fraud: 20-40% deviation."""
    return OCRResult(provider_name="Village Dental Care", provider_address="88 College St, Toronto, ON M5G 1L4", claim_date="2025-02-08",
        procedures=[Procedure(code="11101", description="Recall examination", fee_charged=105.00), Procedure(code="02202", description="Periapical radiographs, 2 films", fee_charged=55.00), Procedure(code="11111", description="Scaling, first unit", fee_charged=72.00), Procedure(code="11117", description="Scaling, additional unit", fee_charged=72.00)],
        subtotal=304.00, tax=None, total=304.00, ocr_confidence=0.94, raw_text="moderate overcharge receipt")

def _fraud_10():
    """Systematic overcharge: every procedure 50-70% above ODA."""
    return OCRResult(provider_name="Smile Bright Dentistry", provider_address="200 Bloor St W, Toronto, ON M5S 1T8", claim_date="2025-01-25",
        procedures=[Procedure(code="11101", description="Recall examination", fee_charged=130.00), Procedure(code="02202", description="Periapical radiographs, 2 films", fee_charged=70.00), Procedure(code="11111", description="Scaling, first unit", fee_charged=90.00), Procedure(code="11117", description="Scaling, additional unit", fee_charged=85.00), Procedure(code="23111", description="Composite resin, 1 surface", fee_charged=250.00, tooth_number="13"), Procedure(code="12101", description="Polishing", fee_charged=75.00)],
        subtotal=700.00, tax=None, total=700.00, ocr_confidence=0.93, raw_text="systematic overcharge receipt")


# === 10 AI-GENERATED RECEIPTS ===

def _ai_gen_01():
    """Clean AI-generated."""
    return OCRResult(provider_name="Toronto Smiles Dental Corp.", provider_address="Suite 1400, 100 King St W, Toronto, ON M5X 1A1", claim_date="2025-01-12",
        procedures=[Procedure(code="11101", description="Periodic Oral Exam", fee_charged=78.00), Procedure(code="02202", description="PA Radiographs x2", fee_charged=42.00), Procedure(code="11111", description="Prophylaxis Unit I", fee_charged=55.00)],
        subtotal=175.00, tax=None, total=175.00, ocr_confidence=0.96, raw_text="AI gen clean receipt")

def _ai_gen_02():
    """Clean AI-generated with more procedures."""
    return OCRResult(provider_name="Dental Health Associates Inc.", provider_address="2000 Finch Ave W, Toronto, ON M3N 2V6", claim_date="2025-02-01",
        procedures=[Procedure(code="11102", description="Comprehensive Dental Evaluation", fee_charged=124.00), Procedure(code="01202", description="Bilateral Bitewing Series", fee_charged=40.00), Procedure(code="11111", description="Dental Scaling Session I", fee_charged=58.00), Procedure(code="11117", description="Dental Scaling Session II", fee_charged=58.00), Procedure(code="13401", description="Topical Fluoride Application", fee_charged=30.00)],
        subtotal=310.00, tax=None, total=310.00, ocr_confidence=0.95, raw_text="AI gen clean with fluoride")

def _ai_gen_03():
    """Clean AI-generated with filling."""
    return OCRResult(provider_name="North York Dental Wellness", provider_address="5000 Yonge St, Toronto, ON M2N 7E9", claim_date="2025-03-08",
        procedures=[Procedure(code="11101", description="Dental Recall Assessment", fee_charged=80.00), Procedure(code="23111", description="Anterior Composite Restoration (1S)", fee_charged=155.00, tooth_number="21"), Procedure(code="12101", description="Dental Polish and Finish", fee_charged=48.00)],
        subtotal=283.00, tax=None, total=283.00, ocr_confidence=0.95, raw_text="AI gen filling receipt")

def _ai_gen_04():
    """Moderate irregularity (22-26% deviation)."""
    return OCRResult(provider_name="Comprehensive Dental Solutions", provider_address="333 Bay St, Toronto, ON M5H 2R2", claim_date="2025-01-18",
        procedures=[Procedure(code="11101", description="Oral Examination", fee_charged=98.00), Procedure(code="02202", description="Periapical X-Ray Series", fee_charged=52.00), Procedure(code="11111", description="Scaling Treatment", fee_charged=68.00), Procedure(code="11117", description="Additional Scaling", fee_charged=68.00)],
        subtotal=286.00, tax=None, total=286.00, ocr_confidence=0.94, raw_text="AI gen moderate deviation")

def _ai_gen_05():
    """Moderate irregularity with filling."""
    return OCRResult(provider_name="Advanced Dental Care Group", provider_address="800 Bathurst St, Toronto, ON M5R 3M8", claim_date="2025-02-22",
        procedures=[Procedure(code="11101", description="Periodic Examination", fee_charged=95.00), Procedure(code="23112", description="Two-Surface Composite", fee_charged=230.00, tooth_number="14"), Procedure(code="11111", description="Initial Scaling Unit", fee_charged=65.00)],
        subtotal=390.00, tax=None, total=390.00, ocr_confidence=0.94, raw_text="AI gen moderate with filling")

def _ai_gen_06():
    """Moderate irregularity with multiple procedures."""
    return OCRResult(provider_name="University District Dental", provider_address="600 University Ave, Toronto, ON M5G 1X5", claim_date="2025-03-12",
        procedures=[Procedure(code="11102", description="New Patient Comprehensive Exam", fee_charged=145.00), Procedure(code="01202", description="Diagnostic Bitewings", fee_charged=48.00), Procedure(code="02202", description="Periapical Films", fee_charged=52.00), Procedure(code="11111", description="Scaling Unit 1", fee_charged=65.00), Procedure(code="11117", description="Scaling Unit 2", fee_charged=65.00)],
        subtotal=375.00, tax=None, total=375.00, ocr_confidence=0.93, raw_text="AI gen moderate multi-proc")

def _ai_gen_07():
    """Suspicious upcoding pattern."""
    return OCRResult(provider_name="Elite Dental Professionals", provider_address="150 Bloor St W, Toronto, ON M5S 2X9", claim_date="2025-01-28",
        procedures=[Procedure(code="11101", description="Standard Recall Exam", fee_charged=78.00), Procedure(code="43421", description="Periodontal Root Planing Q1", fee_charged=280.00, tooth_number="16"), Procedure(code="43421", description="Periodontal Root Planing Q2", fee_charged=280.00, tooth_number="26"), Procedure(code="11117", description="Scaling Supplementary Unit", fee_charged=60.00)],
        subtotal=698.00, tax=None, total=698.00, ocr_confidence=0.92, raw_text="AI gen upcoding pattern")

def _ai_gen_08():
    """Suspicious upcoding with fee deviation."""
    return OCRResult(provider_name="Premier Dental Studio", provider_address="90 Eglinton Ave E, Toronto, ON M4P 2Y3", claim_date="2025-02-15",
        procedures=[Procedure(code="11101", description="Oral Assessment", fee_charged=100.00), Procedure(code="43427", description="Comprehensive Root Planing", fee_charged=350.00), Procedure(code="11117", description="Adjunctive Scaling", fee_charged=80.00), Procedure(code="11117", description="Adjunctive Scaling", fee_charged=80.00)],
        subtotal=610.00, tax=None, total=610.00, ocr_confidence=0.91, raw_text="AI gen root planing upcode")

def _ai_gen_09():
    """Clear fraud: crown overcharge + upcoding + unbundling."""
    return OCRResult(provider_name="Dental Excellence Toronto", provider_address="1 Dundas St W, Toronto, ON M5G 1Z3", claim_date="2025-03-01",
        procedures=[Procedure(code="11101", description="Examination", fee_charged=180.00), Procedure(code="27201", description="Porcelain Crown Restoration", fee_charged=1800.00, tooth_number="36"), Procedure(code="43421", description="Deep Scaling (Root Planing)", fee_charged=400.00, tooth_number="14"), Procedure(code="11117", description="Scaling Add-on", fee_charged=100.00), Procedure(code="11117", description="Scaling Add-on", fee_charged=100.00), Procedure(code="11117", description="Scaling Add-on", fee_charged=100.00)],
        subtotal=2680.00, tax=None, total=2680.00, ocr_confidence=0.89, raw_text="AI gen clear fraud combo")

def _ai_gen_10():
    """Clear fraud: crown + duplicate composite + deviation."""
    return OCRResult(provider_name="Prestige Oral Health Centre", provider_address="4700 Keele St, Toronto, ON M3J 1P3", claim_date="2025-02-28",
        procedures=[Procedure(code="11101", description="Dental Recall", fee_charged=140.00), Procedure(code="02202", description="Radiographic Assessment", fee_charged=85.00), Procedure(code="27211", description="Full Metal Crown", fee_charged=1600.00, tooth_number="46"), Procedure(code="23112", description="Composite Filling 2S", fee_charged=300.00, tooth_number="11"), Procedure(code="23112", description="Composite Filling 2S", fee_charged=300.00, tooth_number="11")],
        subtotal=2425.00, tax=None, total=2425.00, ocr_confidence=0.90, raw_text="AI gen crown + duplicate")


def _fraud_test():
    """Manually created extreme fraud: inflated exam, double root planing, triple scaling, polishing."""
    return OCRResult(provider_name="Dr. Richard Chen Dental Office", provider_address="456 Dundas St W, Suite 200, Toronto, ON M5T 1G8", claim_date="2025-03-10",
        procedures=[
            Procedure(code="11101", description="Recall examination", fee_charged=175.00),
            Procedure(code="02202", description="Periapical radiographs, 2 films", fee_charged=90.00),
            Procedure(code="43421", description="Root planing, per quadrant", fee_charged=425.00, tooth_number="14"),
            Procedure(code="43421", description="Root planing, per quadrant", fee_charged=425.00, tooth_number="24"),
            Procedure(code="11117", description="Scaling, additional unit", fee_charged=110.00),
            Procedure(code="11117", description="Scaling, additional unit", fee_charged=110.00),
            Procedure(code="11117", description="Scaling, additional unit", fee_charged=110.00),
            Procedure(code="12101", description="Polishing", fee_charged=85.00),
        ],
        subtotal=1530.00, tax=None, total=1530.00, ocr_confidence=0.91, raw_text="extreme multi-type fraud receipt")
