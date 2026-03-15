import { supabase } from "@/lib/supabase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
  };
}

export interface FraudFlag {
  fraud_type: string;
  code: string;
  billed_fee: number;
  suggested_fee: number | null;
  deviation_pct: number | null;
  confidence: number;
  evidence: string;
}

export interface ScoreBreakdown {
  fee_deviation: number;
  code_risk: number;
  provider_history: number;
  pattern_bonus: number;
  confidence_adj: number;
}

export interface FraudScore {
  score: number;
  level: string;
  breakdown: ScoreBreakdown;
}

export interface CoverageItem {
  category: string;
  annual_limit: number;
  used_ytd: number;
  remaining: number;
  coverage_pct: number;
  recommendation: string | null;
}

export interface BenefitsReport {
  student_id: string;
  plan_type: string;
  coverage_items: CoverageItem[];
  total_unused: number;
  savings_from_fraud_flag: number | null;
}

export interface AgentTrace {
  agent: string;
  event: string;
  message: string;
  duration_ms: number | null;
  timestamp: string;
}

export interface PipelineResult {
  claim_id: string;
  student_id: string;
  timestamp: string;
  fraud_score: FraudScore | null;
  fraud_flags: FraudFlag[];
  benefits_report: BenefitsReport | null;
  health_signals: { treatments: Array<Record<string, unknown>>; gaps: Array<Record<string, unknown>> } | null;
  ranked_plans: Array<{ plan: Record<string, unknown>; priority_score: number }>;
  report_html: string | null;
  compliance_approved: boolean;
  agent_traces: AgentTrace[];
  errors: string[];
}

export interface ProviderStats {
  provider_id: string;
  provider_name: string;
  address: string | null;
  total_claims: number;
  flagged_claims: number;
  avg_fee_deviation: number;
  risk_tier: string;
  common_fraud_types: string[];
  last_claim_date: string | null;
  flagged_by_students?: number;
}

export async function uploadClaim(file: File): Promise<PipelineResult> {
  const formData = new FormData();
  formData.append("file", file);

  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/claims/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
}

export async function getClaims(): Promise<{ claims: PipelineResult[]; total: number }> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/claims`, { headers });
  return response.json();
}

export async function getClaim(claimId: string): Promise<PipelineResult> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/claims/${claimId}`, { headers });
  return response.json();
}

export async function getCases(): Promise<{ cases: Array<Record<string, unknown>>; total: number }> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/cases`, { headers });
  return response.json();
}

export async function getBenefits(studentId: string): Promise<BenefitsReport> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/benefits/${studentId}`, { headers });
  return response.json();
}

export async function getProviders(): Promise<{ providers: ProviderStats[]; total: number }> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/providers`, { headers });
  return response.json();
}

export async function getAuditLogs(limit: number = 50, offset: number = 0): Promise<{ entries: Array<Record<string, unknown>>; total: number }> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/audit?limit=${limit}&offset=${offset}`, { headers });
  return response.json();
}

export async function getMetrics(): Promise<Record<string, unknown>> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/metrics`, { headers });
  return response.json();
}

export async function approveCase(caseId: string): Promise<Record<string, unknown>> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/cases/${caseId}/approve`, {
    method: "POST",
    headers,
  });
  return response.json();
}

export async function dismissCase(caseId: string): Promise<Record<string, unknown>> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/cases/${caseId}/dismiss`, {
    method: "POST",
    headers,
  });
  return response.json();
}

export async function downloadDisputeLetter(caseId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/cases/${caseId}/dispute-letter`, {
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to generate dispute letter");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dispute-letter-${caseId.slice(0, 8)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
