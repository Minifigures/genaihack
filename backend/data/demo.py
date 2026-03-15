"""
Demo/seed data
"""

from datetime import datetime, date

# Demo providers for testing fraud detection
DEMO_PROVIDERS = [
    {
        "provider_id": "PRV-001",
        "provider_name": "Dr. Smith Dental Clinic",
        "address": "123 University Ave, Toronto, ON",
        "total_claims": 47,
        "flagged_claims": 12,
        "avg_fee_deviation": 0.23,
        "risk_tier": "flagged_multiple",
        "common_fraud_types": ["upcoding", "fee_deviation"],
    },
    {
        "provider_id": "PRV-002",
        "provider_name": "Campus Dental Care",
        "address": "45 St. George St, Toronto, ON",
        "total_claims": 120,
        "flagged_claims": 3,
        "avg_fee_deviation": 0.05,
        "risk_tier": "clean",
        "common_fraud_types": [],
    },
    {
        "provider_id": "PRV-003",
        "provider_name": "Downtown Dental Group",
        "address": "789 Bay St, Toronto, ON",
        "total_claims": 89,
        "flagged_claims": 28,
        "avg_fee_deviation": 0.35,
        "risk_tier": "confirmed_fraud",
        "common_fraud_types": ["upcoding", "unbundling", "phantom_billing"],
    },
    {
        "provider_id": "PRV-004",
        "provider_name": "Smile Bright Dentistry",
        "address": "200 Bloor St W, Toronto, ON",
        "total_claims": 65,
        "flagged_claims": 5,
        "avg_fee_deviation": 0.12,
        "risk_tier": "flagged_once",
        "common_fraud_types": ["fee_deviation"],
    },
]

# Demo student benefits for UTSU 2025-2026 plan
DEMO_STUDENT_BENEFITS = [
    {"student_id": "STU-001", "plan_year": "2025-2026", "category": "dental",
     "annual_limit": 750.00, "used_ytd": 420.00, "remaining": 330.00},
    {"student_id": "STU-001", "plan_year": "2025-2026", "category": "vision",
     "annual_limit": 150.00, "used_ytd": 0.00, "remaining": 150.00},
    {"student_id": "STU-001", "plan_year": "2025-2026", "category": "paramedical",
     "annual_limit": 500.00, "used_ytd": 120.00, "remaining": 380.00},
    {"student_id": "STU-001", "plan_year": "2025-2026", "category": "psychology",
     "annual_limit": 800.00, "used_ytd": 0.00, "remaining": 800.00},
    {"student_id": "STU-001", "plan_year": "2025-2026", "category": "prescription",
     "annual_limit": 200.00, "used_ytd": 45.00, "remaining": 155.00},
    {"student_id": "STU-002", "plan_year": "2025-2026", "category": "dental",
     "annual_limit": 750.00, "used_ytd": 200.00, "remaining": 550.00},
    {"student_id": "STU-002", "plan_year": "2025-2026", "category": "vision",
     "annual_limit": 150.00, "used_ytd": 150.00, "remaining": 0.00},
    {"student_id": "STU-003", "plan_year": "2025-2026", "category": "dental",
     "annual_limit": 750.00, "used_ytd": 78.00, "remaining": 672.00},
    {"student_id": "STU-003", "plan_year": "2025-2026", "category": "vision",
     "annual_limit": 150.00, "used_ytd": 0.00, "remaining": 150.00},
    {"student_id": "STU-003", "plan_year": "2025-2026", "category": "paramedical",
     "annual_limit": 500.00, "used_ytd": 0.00, "remaining": 500.00},
    {"student_id": "STU-003", "plan_year": "2025-2026", "category": "psychology",
     "annual_limit": 300.00, "used_ytd": 0.00, "remaining": 300.00},
    {"student_id": "STU-003", "plan_year": "2025-2026", "category": "prescription",
     "annual_limit": 3000.00, "used_ytd": 0.00, "remaining": 3000.00},
]

# Demo fraud cases for demo mode
DEMO_FRAUD_CASES = [
    {
        "case_id": "CASE-001",
        "claim_id": "CLM-001",
        "student_id": "STU-001",
        "provider_id": "PRV-003",
        "fraud_score": 89.0,
        "risk_level": "high",
        "score_breakdown": {
            "fee_deviation": 35.0,
            "code_risk": 25.0,
            "provider_history": 14.0,
            "pattern_bonus": 10.0,
            "confidence_adj": 0.95,
        },
        "flags": [
            {"fraud_type": "fee_deviation", "code": "11111", "billed_fee": 350.0,
             "suggested_fee": 200.0, "deviation_pct": 0.75, "confidence": 0.95,
             "evidence": "Fees 75% above ODA guide"},
            {"fraud_type": "upcoding", "code": "4341", "billed_fee": 450.0,
             "suggested_fee": 180.0, "deviation_pct": 1.5, "confidence": 0.88,
             "evidence": "Root planing billed instead of scaling"},
        ],
        "status": "open",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    },
    {
        "case_id": "CASE-002",
        "claim_id": "CLM-002",
        "student_id": "STU-002",
        "provider_id": "PRV-001",
        "fraud_score": 65.0,
        "risk_level": "elevated",
        "score_breakdown": {
            "fee_deviation": 23.0,
            "code_risk": 15.0,
            "provider_history": 12.0,
            "pattern_bonus": 10.0,
            "confidence_adj": 0.92,
        },
        "flags": [
            {"fraud_type": "fee_deviation", "code": "0120", "billed_fee": 180.0,
             "suggested_fee": 140.0, "deviation_pct": 0.29, "confidence": 0.92,
             "evidence": "Fees 29% above ODA guide"},
        ],
        "status": "open",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    },
]


def get_demo_case(case_id: str) -> dict | None:
    """Get a demo fraud case by ID."""
    for case in DEMO_FRAUD_CASES:
        if case["case_id"] == case_id:
            return case.copy()
    return None


def get_demo_provider(provider_id: str) -> dict | None:
    """Get a demo provider by ID with timestamps."""
    for provider in DEMO_PROVIDERS:
        if provider["provider_id"] == provider_id:
            result = provider.copy()
            result["last_claim_date"] = date.today().isoformat()
            result["updated_at"] = datetime.now().isoformat()
            result["flagged_by_students"] = PROVIDER_STUDENT_FLAGS.get(provider_id, 0)
            return result
    return None


# Cross-student provider intelligence: how many distinct students flagged each provider
PROVIDER_STUDENT_FLAGS: dict[str, int] = {
    "PRV-001": 5,
    "PRV-002": 0,
    "PRV-003": 14,
    "PRV-004": 2,
}


def get_demo_providers() -> list[dict]:
    """Get all demo providers with timestamps."""
    result = []
    for provider in DEMO_PROVIDERS:
        p = provider.copy()
        p["last_claim_date"] = date.today().isoformat()
        p["updated_at"] = datetime.now().isoformat()
        p["flagged_by_students"] = PROVIDER_STUDENT_FLAGS.get(p["provider_id"], 0)
        result.append(p)
    return result


def get_demo_benefits(student_id: str) -> list[dict]:
    """Get demo student benefits by student ID with timestamps."""
    result = []
    for benefit in DEMO_STUDENT_BENEFITS:
        if benefit["student_id"] == student_id:
            b = benefit.copy()
            b["last_updated"] = datetime.now().isoformat()
            result.append(b)
    return result