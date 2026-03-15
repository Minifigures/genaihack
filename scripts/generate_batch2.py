"""Generate batch 2: 30 more test receipt PDFs (real_11-20, fraud_11-20, ai_gen_11-20)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fpdf import FPDF

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "demo_receipts")

def mk(fn, prov, addr, date, patient, procs, total=None):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 8, prov, new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 5, addr, new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(5)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 6, "DENTAL RECEIPT", new_x="LMARGIN", new_y="NEXT")
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(3)
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(95, 5, f"Patient: {patient}", new_x="RIGHT", new_y="TOP")
    pdf.cell(95, 5, f"Date: {date}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_fill_color(235,235,235)
    pdf.cell(20,6,"Code",border=1,fill=True); pdf.cell(80,6,"Description",border=1,fill=True)
    pdf.cell(20,6,"Tooth",border=1,fill=True,align="C"); pdf.cell(30,6,"Fee",border=1,fill=True,align="R")
    pdf.cell(30,6,"ODA",border=1,fill=True,align="R"); pdf.ln()
    pdf.set_font("Helvetica","",9)
    t=0
    for p in procs:
        t+=p[2]
        pdf.cell(20,5,p[0],border=1); pdf.cell(80,5,p[1],border=1)
        pdf.cell(20,5,p[3] if len(p)>3 else "",border=1,align="C")
        pdf.cell(30,5,f"${p[2]:.2f}",border=1,align="R")
        pdf.cell(30,5,f"${p[4]}" if len(p)>4 else "",border=1,align="R"); pdf.ln()
    if total is None: total=t
    pdf.ln(3); pdf.set_font("Helvetica","B",10)
    pdf.cell(120,6,""); pdf.cell(30,6,"Total:",align="R"); pdf.cell(30,6,f"${total:.2f}",align="R")
    pdf.output(os.path.join(OUT, fn))
    print(f"  {fn} (${total:.2f})")

# (code, desc, fee, tooth, oda)
print("=== CLEAN 11-20 ===")
mk("real_11.pdf","Yorkville Dental","120 Yorkville Ave, Toronto","2025-01-05","Nicole Rivera",
   [("11101","Recall exam",78,"","78"),("02202","PA radiographs x2",42,"","42"),("11111","Scaling 1st",55,"","55"),("11117","Scaling add",55,"","55")])
mk("real_12.pdf","Liberty Village Dental","171 E Liberty St, Toronto","2025-02-11","Tyler Morrison",
   [("11102","Complete exam",122,"","120"),("01202","Bitewings x2",39,"","38"),("13401","Fluoride",29,"","28")])
mk("real_13.pdf","Riverdale Dental Care","850 Broadview Ave, Toronto","2025-01-22","Sophia Chen",
   [("11101","Recall exam",80,"","78"),("23111","Composite 1S anterior",155,"22","150"),("11111","Scaling 1st",57,"","55")])
mk("real_14.pdf","Scarborough Town Dental","150 Borough Dr, Scarborough","2025-03-03","Ahmed Hassan",
   [("11101","Recall exam",78,"","78"),("02202","PA radiographs",42,"","42"),("71101","Extraction erupted",128,"48","125")])
mk("real_15.pdf","Danforth Dental Studio","2980 Danforth Ave, Toronto","2025-02-19","Rachel Kim",
   [("11101","Recall exam",82,"","78"),("01202","Bitewings x2",40,"","38"),("11111","Scaling 1st",58,"","55"),("11117","Scaling add",58,"","55"),("12101","Polishing",47,"","45")])
mk("real_16.pdf","Etobicoke Family Dental","3100 Bloor St W, Etobicoke","2025-01-14","Daniel Okafor",
   [("11102","Complete exam",125,"","120"),("02202","PA radiographs",44,"","42"),("23112","Composite 2S",195,"15","190")])
mk("real_17.pdf","North Toronto Dental","4950 Yonge St, Toronto","2025-03-10","Mia Rossi",
   [("11101","Recall exam",78,"","78"),("11111","Scaling 1st",55,"","55"),("13401","Fluoride",28,"","28")])
mk("real_18.pdf","Leslieville Dental Centre","1000 Queen St E, Toronto","2025-02-07","Ethan Nguyen",
   [("11101","Recall exam",80,"","78"),("02202","PA radiographs",44,"","42"),("23111","Composite 1S",152,"11","150"),("23111","Composite 1S",152,"21","150")])
mk("real_19.pdf","High Park Dental","1860 Bloor St W, Toronto","2025-01-30","Olivia Singh",
   [("11101","Recall exam",78,"","78"),("01202","Bitewings",38,"","38"),("11111","Scaling 1st",55,"","55"),("11117","Scaling add",55,"","55")])
mk("real_20.pdf","Mimico Dental Group","330 Royal York Rd, Toronto","2025-03-07","Noah Campbell",
   [("11102","Complete exam",124,"","120"),("02202","PA radiographs",45,"","42"),("11111","Scaling 1st",58,"","55"),("11117","Scaling add",58,"","55"),("23112","Composite 2S",198,"24","190")])

print("\n=== FRAUD 11-20 ===")
# 11: Exam + scaling both heavily inflated
mk("fraud_11.pdf","QuickSmile Dental","999 Dundas St W, Toronto","2025-01-18","Student K",
   [("11101","Recall exam",165,"","78"),("11111","Scaling 1st",105,"","55"),("11117","Scaling add",100,"","55"),("12101","Polishing",80,"","45")])
# 12: Root planing upcoded from scaling + fee deviation
mk("fraud_12.pdf","Dr. Smith Dental Clinic","123 University Ave, Toronto","2025-02-28","Student L",
   [("11101","Recall exam",140,"","78"),("43421","Root planing Q1",320,"16","195"),("43421","Root planing Q2",320,"26","195"),("11117","Scaling add",90,"","55")])
# 13: 4 scaling units unbundled + overcharged
mk("fraud_13.pdf","Discount Dental Plus","600 Sheppard Ave W, Toronto","2025-03-05","Student M",
   [("11101","Recall exam",85,"","78"),("11117","Scaling unit 1",80,"","55"),("11117","Scaling unit 2",80,"","55"),("11117","Scaling unit 3",80,"","55"),("11117","Scaling unit 4",80,"","55")])
# 14: Crown + exam overcharge
mk("fraud_14.pdf","Elite Crown Dental","500 University Ave, Toronto","2025-01-25","Student N",
   [("11101","Recall exam",155,"","78"),("27211","Crown metal",1500,"46","950"),("02202","PA radiographs",65,"","42")])
# 15: Triple composite on same tooth (duplicate)
mk("fraud_15.pdf","Bay Dental Associates","100 Bay St, Toronto","2025-02-15","Student O",
   [("11101","Recall exam",78,"","78"),("23112","Composite 2S",240,"21","190"),("23112","Composite 2S",240,"21","190"),("23112","Composite 2S",240,"21","190")])
# 16: Scaling upcoded as root planing + unbundled
mk("fraud_16.pdf","Downtown Dental Group","789 Bay St, Toronto","2025-03-01","Student P",
   [("11101","Recall exam",130,"","78"),("43427","Root planing 3Q+",360,"","185"),("11117","Scaling 1",75,"","55"),("11117","Scaling 2",75,"","55"),("11117","Scaling 3",75,"","55")])
# 17: Extraction overcharge + phantom polishing
mk("fraud_17.pdf","Midtown Dental Centre","1200 Bay St, Toronto","2025-01-12","Student Q",
   [("11101","Recall exam",150,"","78"),("71101","Extraction erupted",220,"38","125"),("12101","Polishing",80,"","45"),("11117","Scaling add",90,"","55")])
# 18: Everything overcharged 40-60%
mk("fraud_18.pdf","Premium Dental Studio","400 University Ave, Toronto","2025-02-20","Student R",
   [("11101","Recall exam",120,"","78"),("02202","PA radiographs",65,"","42"),("11111","Scaling 1st",82,"","55"),("11117","Scaling add",80,"","55"),("23112","Composite 2S",285,"14","190")])
# 19: Double crown billing
mk("fraud_19.pdf","Lakeshore Dental","2100 Lake Shore Blvd W, Toronto","2025-03-08","Student S",
   [("11101","Recall exam",78,"","78"),("27201","Crown porcelain",1500,"36","1100"),("27201","Crown porcelain",1500,"36","1100")])
# 20: Comprehensive fraud - everything
mk("fraud_20.pdf","Smile Bright Dentistry","200 Bloor St W, Toronto","2025-01-20","Student T",
   [("11101","Recall exam",170,"","78"),("43421","Root planing",380,"14","195"),("11117","Scaling 1",90,"","55"),("11117","Scaling 2",90,"","55"),("11117","Scaling 3",90,"","55"),("23112","Composite 2S",280,"21","190"),("23112","Composite 2S",280,"21","190"),("12101","Polishing",78,"","45")])

print("\n=== AI-GEN 11-20 ===")
# 11-13: Clean
mk("ai_gen_11.pdf","SmartDent AI Clinic","1 Queen St E, Toronto","2025-01-08","AI Patient Lambda",
   [("11101","Oral Exam (recall)",78,"","78"),("02202","Digital Periapical x2",42,"","42"),("11111","Prophylaxis Scaling I",55,"","55")])
mk("ai_gen_12.pdf","AutoCare Dental Inc.","2500 Victoria Park Ave, Toronto","2025-02-14","AI Patient Mu",
   [("11102","Full Oral Assessment",122,"","120"),("01202","Bitewing Diagnostic Set",39,"","38"),("11111","Scaling Session A",56,"","55"),("13401","Fluoride Application",29,"","28")])
mk("ai_gen_13.pdf","DigiDent Solutions","75 St. Nicholas St, Toronto","2025-03-02","AI Patient Nu",
   [("11101","Periodic Exam",80,"","78"),("23112","Composite Restoration 2S",196,"12","190"),("12101","Crown Polish",47,"","45")])
# 14-16: Moderate deviation (borderline)
mk("ai_gen_14.pdf","Neural Dental Network","300 Front St W, Toronto","2025-01-20","AI Patient Xi",
   [("11101","Examination",96,"","78"),("02202","Radiograph Series",54,"","42"),("11111","Scaling Treatment",70,"","55"),("11117","Scaling Supplement",70,"","55")])
mk("ai_gen_15.pdf","TechSmile Dental Lab","45 Charles St E, Toronto","2025-02-25","AI Patient Omicron",
   [("11101","Recall Assessment",92,"","78"),("23111","Anterior Composite 1S",178,"22","150"),("11111","Hygiene Scaling",63,"","55")])
mk("ai_gen_16.pdf","CloudDent Healthcare","900 Bay St, Toronto","2025-03-10","AI Patient Pi",
   [("11102","Comprehensive Assessment",142,"","120"),("01202","Bilateral Bitewings",46,"","38"),("11111","Initial Scaling",66,"","55"),("11117","Continued Scaling",66,"","55"),("13401","Fluoride Rinse",34,"","28")])
# 17-18: Suspicious upcoding
mk("ai_gen_17.pdf","Quantum Dental AI","200 Wellington St W, Toronto","2025-01-30","AI Patient Rho",
   [("11101","Periodic Dental Exam",78,"","78"),("43421","Subgingival Debridement Q1",300,"16","195"),("43421","Subgingival Debridement Q3",300,"36","195"),("11117","Supplemental Scaling",65,"","55")])
mk("ai_gen_18.pdf","DeepClean Dental Co.","55 Bloor St W, Toronto","2025-02-18","AI Patient Sigma",
   [("11101","Clinical Examination",110,"","78"),("43427","Full Arch Root Planing",320,"","185"),("11117","Scaling Extension A",78,"","55"),("11117","Scaling Extension B",78,"","55"),("11117","Scaling Extension C",78,"","55")])
# 19-20: Clear fraud
mk("ai_gen_19.pdf","AlphaDent Premium","1 First Canadian Pl, Toronto","2025-03-05","AI Patient Tau",
   [("11101","Dental Examination",160,"","78"),("27201","Ceramic Crown Unit",1700,"46","1100"),("02202","Diagnostic X-Ray",75,"","42"),("11117","Scaling Service",95,"","55"),("11117","Scaling Service",95,"","55"),("11117","Scaling Service",95,"","55")])
mk("ai_gen_20.pdf","OmniDent Health Systems","800 King St W, Toronto","2025-02-10","AI Patient Upsilon",
   [("11101","Oral Health Exam",145,"","78"),("23112","Resin Composite 2S",290,"21","190"),("23112","Resin Composite 2S",290,"21","190"),("43421","Perio Root Therapy",380,"14","195"),("11117","Add Scaling",88,"","55")])

print(f"\nDone! 30 new receipts in {OUT}")
