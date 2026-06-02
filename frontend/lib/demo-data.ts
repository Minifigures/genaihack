// Faithful offline demo data + pipeline simulation for VIGIL.
//
// Mirrors the backend's DEMO_MODE responses (backend/data/demo.py and the
// LangGraph pipeline output) so every page renders fully populated even when
// no backend is reachable. When a real backend IS configured via
// NEXT_PUBLIC_API_URL, lib/api.ts prefers it and only falls back to this.

import type {
  PipelineResult,
  FraudFlag,
  BenefitsReport,
  CoverageItem,
  ProviderStats,
  AgentTrace,
} from "@/lib/api";

// ── Providers ──────────────────────────────────────────────────────────────
export const DEMO_PROVIDERS: ProviderStats[] = [
  {
    provider_id: "PRV-001",
    provider_name: "Dr. Smith Dental Clinic",
    address: "123 University Ave, Toronto, ON",
    total_claims: 47,
    flagged_claims: 12,
    avg_fee_deviation: 0.23,
    risk_tier: "flagged_multiple",
    common_fraud_types: ["upcoding", "fee_deviation"],
    last_claim_date: "2026-06-02",
    flagged_by_students: 5,
  },
  {
    provider_id: "PRV-002",
    provider_name: "Campus Dental Care",
    address: "45 St. George St, Toronto, ON",
    total_claims: 120,
    flagged_claims: 3,
    avg_fee_deviation: 0.05,
    risk_tier: "clean",
    common_fraud_types: [],
    last_claim_date: "2026-06-02",
    flagged_by_students: 0,
  },
  {
    provider_id: "PRV-003",
    provider_name: "Downtown Dental Group",
    address: "789 Bay St, Toronto, ON",
    total_claims: 89,
    flagged_claims: 28,
    avg_fee_deviation: 0.35,
    risk_tier: "confirmed_fraud",
    common_fraud_types: ["upcoding", "unbundling", "phantom_billing"],
    last_claim_date: "2026-06-02",
    flagged_by_students: 14,
  },
  {
    provider_id: "PRV-004",
    provider_name: "Smile Bright Dentistry",
    address: "200 Bloor St W, Toronto, ON",
    total_claims: 65,
    flagged_claims: 5,
    avg_fee_deviation: 0.12,
    risk_tier: "flagged_once",
    common_fraud_types: ["fee_deviation"],
    last_claim_date: "2026-06-02",
    flagged_by_students: 2,
  },
];

// ── Fraud cases ──────────────────────────────────────────────────────────────
export interface DemoCase {
  case_id: string;
  claim_id: string | null;
  student_id: string;
  provider_id: string;
  fraud_score: number;
  risk_level: string;
  score_breakdown: {
    fee_deviation: number;
    code_risk: number;
    provider_history: number;
    pattern_bonus: number;
    confidence_adj: number;
  };
  flags: FraudFlag[];
  report_html: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export const DEMO_CASES: DemoCase[] = [
  {
    case_id: "CASE-0001-DT-GRP",
    claim_id: "CLM-001",
    student_id: "STU-001",
    provider_id: "PRV-003",
    fraud_score: 89.0,
    risk_level: "high",
    score_breakdown: {
      fee_deviation: 35.0,
      code_risk: 25.0,
      provider_history: 14.0,
      pattern_bonus: 10.0,
      confidence_adj: 0.95,
    },
    flags: [
      {
        fraud_type: "fee_deviation",
        code: "11111",
        billed_fee: 350.0,
        suggested_fee: 200.0,
        deviation_pct: 0.75,
        confidence: 0.95,
        evidence: "Fees 75% above ODA guide",
      },
      {
        fraud_type: "upcoding",
        code: "4341",
        billed_fee: 450.0,
        suggested_fee: 180.0,
        deviation_pct: 1.5,
        confidence: 0.88,
        evidence: "Root planing billed instead of scaling",
      },
    ],
    report_html:
      "<p>Billing analysis for claim <strong>CLM-001</strong> at Downtown Dental Group flagged a fraud risk score of <strong>89/100 (HIGH)</strong>. Two procedures deviate materially from the Ontario Dental Association fee guide.</p>",
    status: "open",
    created_at: isoDaysAgo(2),
    updated_at: isoDaysAgo(2),
  },
  {
    case_id: "CASE-0002-SMITH",
    claim_id: "CLM-002",
    student_id: "STU-002",
    provider_id: "PRV-001",
    fraud_score: 65.0,
    risk_level: "elevated",
    score_breakdown: {
      fee_deviation: 23.0,
      code_risk: 15.0,
      provider_history: 12.0,
      pattern_bonus: 10.0,
      confidence_adj: 0.92,
    },
    flags: [
      {
        fraud_type: "fee_deviation",
        code: "0120",
        billed_fee: 180.0,
        suggested_fee: 140.0,
        deviation_pct: 0.29,
        confidence: 0.92,
        evidence: "Fees 29% above ODA guide",
      },
    ],
    report_html:
      "<p>Billing analysis for claim <strong>CLM-002</strong> at Dr. Smith Dental Clinic flagged a fraud risk score of <strong>65/100 (ELEVATED)</strong>. One procedure exceeds the ODA guide tolerance.</p>",
    status: "open",
    created_at: isoDaysAgo(5),
    updated_at: isoDaysAgo(5),
  },
];

// Mutable status overlay so approve/dismiss persist across the SPA session.
const caseStatusOverrides: Record<string, string> = {};

export function getDemoCases(): DemoCase[] {
  return DEMO_CASES.map((c) => ({
    ...c,
    status: caseStatusOverrides[c.case_id] ?? c.status,
  }));
}

export function getDemoCase(caseId: string): DemoCase | null {
  const found = getDemoCases().find((c) => c.case_id === caseId);
  return found ? { ...found } : null;
}

export function setDemoCaseStatus(caseId: string, status: string): DemoCase | null {
  const exists = DEMO_CASES.some((c) => c.case_id === caseId);
  if (!exists) return null;
  caseStatusOverrides[caseId] = status;
  return getDemoCase(caseId);
}

// ── Benefits (UTSU 2025-2026 plan) ───────────────────────────────────────────
interface BenefitRow {
  category: string;
  annual_limit: number;
  used_ytd: number;
}

const STUDENT_BENEFITS: Record<string, BenefitRow[]> = {
  "STU-001": [
    { category: "dental", annual_limit: 750.0, used_ytd: 420.0 },
    { category: "vision", annual_limit: 150.0, used_ytd: 0.0 },
    { category: "paramedical", annual_limit: 500.0, used_ytd: 120.0 },
    { category: "psychology", annual_limit: 800.0, used_ytd: 0.0 },
    { category: "prescription", annual_limit: 200.0, used_ytd: 45.0 },
  ],
  "STU-002": [
    { category: "dental", annual_limit: 750.0, used_ytd: 200.0 },
    { category: "vision", annual_limit: 150.0, used_ytd: 150.0 },
  ],
  "STU-003": [
    { category: "dental", annual_limit: 750.0, used_ytd: 78.0 },
    { category: "vision", annual_limit: 150.0, used_ytd: 0.0 },
    { category: "paramedical", annual_limit: 500.0, used_ytd: 0.0 },
    { category: "psychology", annual_limit: 300.0, used_ytd: 0.0 },
    { category: "prescription", annual_limit: 3000.0, used_ytd: 0.0 },
  ],
};

function coverageItemFor(row: BenefitRow): CoverageItem {
  const remaining = Math.round((row.annual_limit - row.used_ytd) * 100) / 100;
  const coverage_pct = row.category === "vision" || row.category === "psychology" ? 1.0 : 0.8;
  let recommendation: string | null = null;
  if (row.category === "vision" && remaining > 0) {
    recommendation = "You haven't used any vision benefits this year. Eye exams are fully covered.";
  } else if (row.category === "psychology" && remaining > 0) {
    recommendation = "Mental health visits are 100% covered up to $300. Consider scheduling a session.";
  } else if (remaining > 100) {
    recommendation = `You have $${remaining.toFixed(2)} unused in ${row.category}. Consider booking a covered visit before plan year ends.`;
  }
  return {
    category: row.category,
    annual_limit: row.annual_limit,
    used_ytd: row.used_ytd,
    remaining,
    coverage_pct,
    recommendation,
  };
}

export function getDemoBenefits(studentId: string): BenefitsReport {
  const rows = STUDENT_BENEFITS[studentId] ?? STUDENT_BENEFITS["STU-001"];
  const coverage_items = rows.map(coverageItemFor);
  const total_unused = Math.round(coverage_items.reduce((s, i) => s + i.remaining, 0) * 100) / 100;
  return {
    student_id: studentId,
    plan_type: "UTSU_2025",
    coverage_items,
    total_unused,
    savings_from_fraud_flag: null,
  };
}

// ── Clinics (OHIP/UHIP near UofT) ────────────────────────────────────────────
export interface DemoClinic {
  name: string;
  address: string;
  phone: string;
  hours: string;
  distance: string;
  rating: number;
  ohip: boolean;
  uhip: boolean;
  specialties: string[];
  accepting: boolean;
  source: string;
}

export const DEMO_CLINICS: DemoClinic[] = [
  { name: "UofT Health & Wellness Centre", address: "214 College St, Toronto, ON M5T 2Z9", phone: "(416) 978-8030", hours: "Mon-Fri 9am-5pm", distance: "On campus", rating: 4.5, ohip: true, uhip: true, specialties: ["General", "Mental Health", "Dental Referrals"], accepting: true, source: "static" },
  { name: "Harbord Dental Centre", address: "376 Harbord St, Toronto, ON M6G 1H8", phone: "(416) 923-3434", hours: "Mon-Sat 9am-6pm", distance: "0.5 km", rating: 4.3, ohip: false, uhip: true, specialties: ["General Dentistry", "Cleanings", "Fillings", "Crowns"], accepting: true, source: "static" },
  { name: "Bloor West Dental Group", address: "2339 Bloor St W, Toronto, ON M6S 1P1", phone: "(416) 762-2312", hours: "Mon-Fri 8am-7pm, Sat 9am-4pm", distance: "1.2 km", rating: 4.6, ohip: false, uhip: true, specialties: ["General Dentistry", "Orthodontics", "Oral Surgery"], accepting: true, source: "static" },
  { name: "College Spadina Health Centre", address: "720 Spadina Ave #200, Toronto, ON M5S 2T9", phone: "(416) 323-9772", hours: "Mon-Fri 9am-5pm", distance: "0.3 km", rating: 4.1, ohip: true, uhip: true, specialties: ["Walk-in", "General Practice", "Lab Work"], accepting: true, source: "static" },
  { name: "Kensington Health", address: "25 Brunswick Ave, Toronto, ON M5S 2L9", phone: "(416) 967-1500", hours: "Mon-Fri 8:30am-4:30pm", distance: "0.8 km", rating: 4.4, ohip: true, uhip: true, specialties: ["Physiotherapy", "Mental Health", "Dental"], accepting: true, source: "static" },
  { name: "Smile Zone Dental", address: "181 University Ave #200, Toronto, ON M5H 3M7", phone: "(416) 361-9333", hours: "Mon-Sat 8am-8pm", distance: "1.5 km", rating: 4.7, ohip: false, uhip: true, specialties: ["General Dentistry", "Cosmetic", "Emergency"], accepting: true, source: "static" },
  { name: "Annex Paramedical Clinic", address: "460 Bloor St W, Toronto, ON M5S 1X8", phone: "(416) 966-1204", hours: "Mon-Fri 10am-7pm, Sat 10am-3pm", distance: "0.6 km", rating: 4.2, ohip: true, uhip: true, specialties: ["Physiotherapy", "Chiropractic", "Massage Therapy", "Acupuncture"], accepting: true, source: "static" },
  { name: "Bathurst-College Medical Centre", address: "340 College St #500, Toronto, ON M5T 3A9", phone: "(416) 920-3535", hours: "Mon-Fri 9am-6pm", distance: "0.4 km", rating: 4.0, ohip: true, uhip: false, specialties: ["Family Medicine", "Dermatology", "Pharmacy"], accepting: false, source: "static" },
];

// ── Audit log ────────────────────────────────────────────────────────────────
export interface DemoAuditEntry {
  log_id: string;
  case_id: string | null;
  claim_id: string | null;
  student_id: string;
  action: string;
  agent: string;
  details: Record<string, unknown>;
  timestamp: string;
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

export const DEMO_AUDIT: DemoAuditEntry[] = [
  { log_id: "log-0001", case_id: "CASE-0001-DT-GRP", claim_id: "CLM-001", student_id: "STU-001", action: "claim_uploaded", agent: "api", details: { filename: "upcoded_dental.pdf", file_size: 18244 }, timestamp: hoursAgo(48) },
  { log_id: "log-0002", case_id: "CASE-0001-DT-GRP", claim_id: "CLM-001", student_id: "STU-001", action: "fraud_flags_detected", agent: "fraud_analyst", details: { flags: 5, max_deviation_pct: 5.36 }, timestamp: hoursAgo(48) },
  { log_id: "log-0003", case_id: "CASE-0001-DT-GRP", claim_id: "CLM-001", student_id: "STU-001", action: "fraud_scored", agent: "scoring_engine", details: { score: 89.0, level: "high" }, timestamp: hoursAgo(48) },
  { log_id: "log-0004", case_id: "CASE-0001-DT-GRP", claim_id: "CLM-001", student_id: "STU-001", action: "compliance_approved", agent: "compliance_gate", details: { method: "watsonx", bias_checked: true }, timestamp: hoursAgo(48) },
  { log_id: "log-0005", case_id: "CASE-0001-DT-GRP", claim_id: "CLM-001", student_id: "STU-001", action: "case_created", agent: "audit_logger", details: { case_id: "CASE-0001-DT-GRP" }, timestamp: hoursAgo(48) },
  { log_id: "log-0006", case_id: "CASE-0002-SMITH", claim_id: "CLM-002", student_id: "STU-002", action: "claim_uploaded", agent: "api", details: { filename: "scaling_receipt.jpg", file_size: 9871 }, timestamp: hoursAgo(120) },
  { log_id: "log-0007", case_id: "CASE-0002-SMITH", claim_id: "CLM-002", student_id: "STU-002", action: "fraud_scored", agent: "scoring_engine", details: { score: 65.0, level: "elevated" }, timestamp: hoursAgo(120) },
  { log_id: "log-0008", case_id: null, claim_id: "CLM-003", student_id: "STU-003", action: "claim_uploaded", agent: "api", details: { filename: "clean_dental.pdf", file_size: 15002 }, timestamp: hoursAgo(6) },
  { log_id: "log-0009", case_id: null, claim_id: "CLM-003", student_id: "STU-003", action: "fraud_scored", agent: "scoring_engine", details: { score: 0.0, level: "low" }, timestamp: hoursAgo(6) },
];

// ── Pipeline simulation (upload flow) ────────────────────────────────────────
type Scenario = "clean" | "upcoded" | "unbundled";

interface ScenarioSpec {
  procedures: number;
  flags: FraudFlag[];
  score: number;
  level: string;
  breakdown: { fee_deviation: number; code_risk: number; provider_history: number; pattern_bonus: number; confidence_adj: number };
  treatments: number;
  gaps: number;
  savings: number | null;
  summary: string;
}

const SCENARIOS: Record<Scenario, ScenarioSpec> = {
  clean: {
    procedures: 3,
    flags: [],
    score: 0.0,
    level: "low",
    breakdown: { fee_deviation: 0.0, code_risk: 0.0, provider_history: 0.0, pattern_bonus: 0.0, confidence_adj: 1.0 },
    treatments: 3,
    gaps: 2,
    savings: null,
    summary:
      "Your dental receipt looks clean with no billing irregularities detected. You have $1,815 in unused benefits this year.",
  },
  upcoded: {
    procedures: 4,
    flags: [
      { fraud_type: "fee_deviation", code: "11101", billed_fee: 150.0, suggested_fee: 78.0, deviation_pct: 0.923, confidence: 0.85, evidence: "Fee $150.00 exceeds ODA guide $78.00 by 92.3% (tolerance: 30%)" },
      { fraud_type: "fee_deviation", code: "02202", billed_fee: 85.0, suggested_fee: 42.0, deviation_pct: 1.024, confidence: 0.85, evidence: "Fee $85.00 exceeds ODA guide $42.00 by 102.4% (tolerance: 30%)" },
      { fraud_type: "fee_deviation", code: "43421", billed_fee: 350.0, suggested_fee: 195.0, deviation_pct: 0.795, confidence: 0.85, evidence: "Fee $350.00 exceeds ODA guide $195.00 by 79.5% (tolerance: 15%)" },
      { fraud_type: "upcoding", code: "43421", billed_fee: 350.0, suggested_fee: 55.0, deviation_pct: 5.364, confidence: 0.75, evidence: "Procedure 43421 (Root planing) may be upcoded from 11117 (Scaling). Billed $350.00 vs typical $55.00" },
      { fraud_type: "fee_deviation", code: "11117", billed_fee: 95.0, suggested_fee: 55.0, deviation_pct: 0.727, confidence: 0.85, evidence: "Fee $95.00 exceeds ODA guide $55.00 by 72.7% (tolerance: 15%)" },
    ],
    score: 60.0,
    level: "high",
    breakdown: { fee_deviation: 40.0, code_risk: 25.0, provider_history: 5.0, pattern_bonus: 10.0, confidence_adj: 0.75 },
    treatments: 4,
    gaps: 2,
    savings: 605.0,
    summary:
      "Our analysis found 5 potential billing irregularities with a fraud risk score of 60/100 (high). Issues detected: fee deviation, upcoding. You have $1,815 in unused benefits this year.",
  },
  unbundled: {
    procedures: 7,
    flags: [
      { fraud_type: "fee_deviation", code: "23112", billed_fee: 220.0, suggested_fee: 190.0, deviation_pct: 0.158, confidence: 0.85, evidence: "Fee $220.00 exceeds ODA guide $190.00 by 15.8% (tolerance: 15%)" },
      { fraud_type: "fee_deviation", code: "23112", billed_fee: 220.0, suggested_fee: 190.0, deviation_pct: 0.158, confidence: 0.85, evidence: "Fee $220.00 exceeds ODA guide $190.00 by 15.8% (tolerance: 15%)" },
      { fraud_type: "fee_deviation", code: "11117", billed_fee: 75.0, suggested_fee: 55.0, deviation_pct: 0.364, confidence: 0.85, evidence: "Fee $75.00 exceeds ODA guide $55.00 by 36.4% (tolerance: 15%)" },
      { fraud_type: "fee_deviation", code: "11117", billed_fee: 75.0, suggested_fee: 55.0, deviation_pct: 0.364, confidence: 0.85, evidence: "Fee $75.00 exceeds ODA guide $55.00 by 36.4% (tolerance: 15%)" },
      { fraud_type: "fee_deviation", code: "11117", billed_fee: 75.0, suggested_fee: 55.0, deviation_pct: 0.364, confidence: 0.85, evidence: "Fee $75.00 exceeds ODA guide $55.00 by 36.4% (tolerance: 15%)" },
      { fraud_type: "duplicate_claim", code: "23112", billed_fee: 440.0, suggested_fee: 190.0, deviation_pct: 1.316, confidence: 0.8, evidence: "Procedure 23112 billed 2 times for tooth 21" },
      { fraud_type: "unbundling", code: "11117", billed_fee: 225.0, suggested_fee: 110.0, deviation_pct: 1.045, confidence: 0.7, evidence: "Multiple scaling units (3) billed separately, may represent unbundled comprehensive cleaning" },
    ],
    score: 56.0,
    level: "high",
    breakdown: { fee_deviation: 40.0, code_risk: 25.0, provider_history: 5.0, pattern_bonus: 10.0, confidence_adj: 0.7 },
    treatments: 7,
    gaps: 2,
    savings: 485.0,
    summary:
      "Our analysis found 7 potential billing irregularities with a fraud risk score of 56/100 (high). Issues detected: fee deviation, duplicate claim, unbundling. You have $1,815 in unused benefits this year.",
  },
};

function scenarioForFilename(name: string): Scenario {
  const n = (name || "").toLowerCase();
  if (n.includes("clean")) return "clean";
  if (n.includes("unbundl")) return "unbundled";
  if (n.includes("upcod")) return "upcoded";
  // Default to the most compelling fraud case for an arbitrary upload.
  return "upcoded";
}

function shortId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function buildTraces(spec: ScenarioSpec, claimId: string, caseId: string | null): AgentTrace[] {
  const now = Date.now();
  let t = 0;
  const stamp = () => new Date(now + (t += 90)).toISOString();
  const claimPrefix = claimId.slice(0, 8);
  const casePrefix = (caseId ?? shortId()).slice(0, 8);
  const complianceMethod = "watsonx";
  const defs: Array<[string, string, number]> = [
    ["ocr_agent", `OCR extracted ${spec.procedures} procedures (demo mode)`, 8],
    ["normalizer", `Normalized ${spec.procedures} procedures, claim_id=${claimPrefix}, 0 warnings`, 3],
    ["history_enricher", "Enriched with 3 past claims at provider", 4],
    ["persister", `Persisted claim ${claimPrefix} to database`, 22],
    ["fraud_analyst", `Found ${spec.flags.length} fraud flags across ${spec.procedures} procedures`, 6],
    ["health_extractor", `Extracted ${spec.treatments} treatments, found ${spec.gaps} preventive care gaps`, 2],
    ["scoring_engine", `Fraud score: ${spec.score.toFixed(1)}/100 (${spec.level})`, 18],
    ["watsonx_summarizer", `Generated plain-English summary using IBM Granite 3-8B (${complianceMethod})`, 1],
    ["benefits_navigator", "Benefits report: $1815.00 total unused coverage across 5 categories", 3],
    ["action_generator", `Generated ${spec.flags.length > 0 ? 2 : 0} candidate action plans`, 5],
    ["optimization_engine", `Ranked ${spec.flags.length > 0 ? 2 : 0} action plans by priority`, 1],
    ["report_drafter", "Generated billing analysis report", 4],
    ["compliance_gate", `Compliance approved (via ${complianceMethod})`, 20],
    ["audit_logger", caseId ? `Audit logged, case_id=${casePrefix}` : "Audit logged", 15],
  ];
  return defs.map(([agent, message, duration_ms]) => ({
    agent,
    event: "complete",
    message,
    duration_ms,
    timestamp: stamp(),
  }));
}

function rankedPlansFor(spec: ScenarioSpec): PipelineResult["ranked_plans"] {
  if (spec.flags.length === 0) return [];
  return [
    {
      plan: {
        plan_id: shortId(),
        name: "Dispute overcharges with provider",
        steps: ["Generate ODA-backed dispute letter", "Submit to provider billing office", "Escalate to insurer if unresolved"],
        expected_savings: spec.savings ?? 0,
        effort_required: 0.3,
        fraud_severity: spec.score / 100,
        confidence: 0.9,
      },
      priority_score: 0.85,
    },
    {
      plan: {
        plan_id: shortId(),
        name: "Claim unused benefits before year-end",
        steps: ["Review $1,815 in unused coverage", "Book covered preventive visits"],
        expected_savings: 1815,
        effort_required: 0.2,
        fraud_severity: 0.0,
        confidence: 0.8,
      },
      priority_score: 0.6,
    },
  ];
}

function buildPipelineResult(scenario: Scenario, studentId = "STU-001"): PipelineResult {
  const spec = SCENARIOS[scenario];
  const claim_id = shortId();
  const case_id = spec.flags.length > 0 && spec.score >= 51 ? shortId() : null;
  const benefits = getDemoBenefits(studentId);
  benefits.savings_from_fraud_flag = spec.savings;
  return {
    claim_id,
    student_id: studentId,
    timestamp: new Date().toISOString(),
    fraud_score: { score: spec.score, level: spec.level, breakdown: spec.breakdown },
    fraud_flags: spec.flags,
    benefits_report: benefits,
    health_signals: { treatments: [], gaps: [] },
    ranked_plans: rankedPlansFor(spec),
    watsonx_summary: spec.summary,
    report_html: `<p>${spec.summary}</p>`,
    compliance_approved: true,
    agent_traces: buildTraces(spec, claim_id, case_id),
    errors: [],
  };
}

// Seed claims so the dashboard / claim history is populated on first load.
const seededClaims: PipelineResult[] = [
  buildPipelineResult("upcoded"),
  buildPipelineResult("unbundled"),
  buildPipelineResult("clean"),
];

const sessionClaims: PipelineResult[] = [];

export function getDemoClaims(): PipelineResult[] {
  return [...sessionClaims, ...seededClaims];
}

export function getDemoClaim(claimId: string): PipelineResult | null {
  const all = getDemoClaims();
  const found = all.find((c) => c.claim_id === claimId);
  if (found) return found;
  // Case-linked claims (CLM-001 / CLM-002) referenced by the cases detail page.
  if (claimId === "CLM-001") return buildPipelineResult("upcoded");
  if (claimId === "CLM-002") return buildPipelineResult("unbundled");
  return null;
}

/**
 * Simulate the 14-agent pipeline. Streams each agent trace via onTrace (so the
 * UI lights up progressively), then resolves with the full pipeline result.
 */
export async function simulateUpload(
  file: File,
  onTrace?: (trace: AgentTrace) => void
): Promise<PipelineResult> {
  const scenario = scenarioForFilename(file?.name ?? "");
  const result = buildPipelineResult(scenario);
  if (onTrace) {
    for (const trace of result.agent_traces) {
      await new Promise((r) => setTimeout(r, 170));
      onTrace(trace);
    }
  }
  sessionClaims.unshift(result);
  return result;
}

export function getDemoMetrics(): Record<string, unknown> {
  const claims = getDemoClaims();
  const scores = claims.map((c) => c.fraud_score?.score ?? 0);
  const flags = claims.reduce((s, c) => s + (c.fraud_flags?.length ?? 0), 0);
  const avg = scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
  return {
    agents: { total_runs: claims.length, avg_duration_ms: 842 },
    pipeline: {
      total_runs: claims.length,
      avg_fraud_score: Math.round(avg * 10) / 10,
      total_flags: flags,
    },
  };
}

// ── Chat assistant (local keyword responder, mirrors backend fallback) ────────
export function demoChatReply(message: string): string {
  const m = (message || "").toLowerCase();
  const has = (...words: string[]) => words.some((w) => m.includes(w));
  if (has("mental", "stress", "anxiety", "depress", "counsell", "psych")) {
    return "Your UTSU plan covers psychology services at 100% (up to $800/year). UofT Health & Wellness offers same-week counselling at (416) 978-8030, and the My SSP line (1-844-451-9700) is free 24/7 for students.";
  }
  if (has("dental", "dentist", "tooth", "teeth", "cleaning", "scaling")) {
    return "Dental is covered at 80% up to $750/year. A typical exam + cleaning runs $150-220 — well within your remaining balance. Most plans cover a checkup every 6 months. If a fee looks high, upload the receipt and I'll check it against the ODA guide.";
  }
  if (has("vision", "eye", "glasses", "contacts")) {
    return "Vision is covered at 100% up to $150/year, and you haven't used any yet. Annual eye exams and a portion of glasses/contacts are eligible.";
  }
  if (has("physio", "massage", "chiro", "paramedical")) {
    return "Paramedical services (physiotherapy, massage, chiropractic, acupuncture) are covered at 80% up to $500/year combined.";
  }
  if (has("prescription", "drug", "medication", "pharmacy")) {
    return "Prescription drugs are covered at 80%. Keep your receipts — I can flag any pharmacy overcharges against typical dispensing fees.";
  }
  if (has("fraud", "overcharge", "dispute", "too much")) {
    return "If a provider billed above the Ontario Dental Association fee guide, VIGIL flags it and can draft a dispute letter you can send to the clinic or insurer. Upload the receipt on the Upload page to run the analysis.";
  }
  if (has("coverage", "plan", "insurance", "benefit")) {
    return "Your UTSU 2025-2026 plan covers dental ($750), vision ($150), paramedical ($500), psychology ($800) and prescriptions. You currently have about $1,815 in unused coverage — see the Benefits page for the full breakdown.";
  }
  if (has("hello", "hi", "hey")) {
    return "Hi! I'm the VIGIL Health Assistant. I can explain your UTSU coverage, help you spot billing fraud, and point you to clinics near campus. What would you like to know?";
  }
  return "I can help with your UTSU health & dental coverage, spotting billing fraud on receipts, and finding OHIP/UHIP clinics near UofT. Try asking about dental, vision, mental health, or how fraud detection works.";
}

// ── Dispute letter (client-side minimal PDF) ──────────────────────────────────
function escapePdfText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function buildDisputeLetterPdf(caseId: string): Blob {
  const c = getDemoCase(caseId) ?? DEMO_CASES[0];
  const provider = DEMO_PROVIDERS.find((p) => p.provider_id === c.provider_id);
  const today = new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
  const overcharge = c.flags.reduce(
    (s, f) => s + (f.billed_fee && f.suggested_fee ? f.billed_fee - f.suggested_fee : 0),
    0
  );
  const lines = [
    "VIGIL  -  Billing Dispute Letter",
    "",
    today,
    "",
    `To: ${provider?.provider_name ?? "Billing Department"}`,
    provider?.address ?? "",
    "",
    `Re: Disputed charges on claim ${c.claim_id ?? c.case_id}`,
    "",
    "To whom it may concern,",
    "",
    "An automated review of the attached healthcare receipt identified charges",
    "that exceed the Ontario Dental Association (ODA) suggested fee guide. The",
    `flagged fraud risk score for this claim is ${c.fraud_score}/100 (${c.risk_level.toUpperCase()}).`,
    "",
    "Itemized discrepancies:",
    ...c.flags.map(
      (f) =>
        `  - Code ${f.code} (${f.fraud_type.replace(/_/g, " ")}): billed $${(f.billed_fee ?? 0).toFixed(
          2
        )}, ODA guide $${(f.suggested_fee ?? 0).toFixed(2)}`
    ),
    "",
    `Total amount disputed: $${overcharge.toFixed(2)}`,
    "",
    "I respectfully request a corrected invoice reflecting the ODA guide fees,",
    "or a written explanation of the charges above. I have retained a copy of",
    "this analysis for my insurer.",
    "",
    "Sincerely,",
    "A UTSU Plan Member",
  ];

  const header = "%PDF-1.4\n";
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  objects.push(
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>"
  );
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const body =
    "BT\n/F1 11 Tf\n72 720 Td\n14 TL\n" +
    lines.map((l) => `(${escapePdfText(l)}) Tj T*`).join("\n") +
    "\nET";
  const stream = `<< /Length ${body.length} >>\nstream\n${body}\nendstream`;
  objects.push(stream);

  let pdf = header;
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.forEach((off) => {
    pdf += `${off.toString().padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}
