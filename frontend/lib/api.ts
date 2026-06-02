import { supabase, supabaseConfigured } from "@/lib/supabase";
import {
  getDemoCases,
  getDemoCase,
  setDemoCaseStatus,
  getDemoBenefits,
  getDemoClaims,
  getDemoClaim,
  getDemoMetrics,
  simulateUpload,
  buildDisputeLetterPdf,
  DEMO_PROVIDERS,
  DEMO_AUDIT,
} from "@/lib/demo-data";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// A "real" backend is only used when an explicit non-localhost URL is set.
// Otherwise we serve faithful demo data instantly (no failed-fetch latency).
const HAS_BACKEND =
  !!process.env.NEXT_PUBLIC_API_URL &&
  !API_BASE.includes("localhost") &&
  !API_BASE.includes("127.0.0.1");

async function getAuthHeaders() {
  if (!supabaseConfigured) return {};
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return {
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

// Fetch JSON from the real backend with a timeout. Throws on timeout, network
// error, non-2xx, or an { error } body so the caller falls back to demo data.
async function fetchJson<T>(path: string, init: RequestInit = {}, timeoutMs = 6000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = { ...(init.headers || {}), ...(await getAuthHeaders()) };
    const response = await fetch(`${API_BASE}${path}`, { ...init, headers, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data && typeof data === "object" && "error" in data) {
      throw new Error(String((data as { error: unknown }).error));
    }
    return data as T;
  } finally {
    clearTimeout(timer);
  }
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
  watsonx_summary: string | null;
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

export async function uploadClaim(file: File, onTrace?: (trace: AgentTrace) => void): Promise<PipelineResult> {
  if (HAS_BACKEND) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await fetchJson<PipelineResult>(
        "/api/claims/upload",
        { method: "POST", body: formData },
        45000
      );
      // Replay the returned traces so the panel animates even with a live backend.
      if (onTrace && Array.isArray(result.agent_traces)) {
        for (const trace of result.agent_traces) {
          await new Promise((r) => setTimeout(r, 120));
          onTrace(trace);
        }
      }
      return result;
    } catch {
      // fall through to simulation
    }
  }
  return simulateUpload(file, onTrace);
}

export async function getClaims(): Promise<{ claims: PipelineResult[]; total: number }> {
  if (HAS_BACKEND) {
    try {
      const data = await fetchJson<{ claims: PipelineResult[]; total: number }>("/api/claims");
      if (data.claims && data.claims.length > 0) return data;
    } catch {
      /* fall through */
    }
  }
  const claims = getDemoClaims();
  return { claims, total: claims.length };
}

export async function getClaim(claimId: string): Promise<PipelineResult> {
  if (HAS_BACKEND) {
    try {
      return await fetchJson<PipelineResult>(`/api/claims/${claimId}`);
    } catch {
      /* fall through */
    }
  }
  const claim = getDemoClaim(claimId);
  if (!claim) throw new Error("Claim not found");
  return claim;
}

export async function getCases(): Promise<{ cases: Array<Record<string, unknown>>; total: number }> {
  if (HAS_BACKEND) {
    try {
      const data = await fetchJson<{ cases: Array<Record<string, unknown>>; total: number }>("/api/cases");
      if (data.cases && data.cases.length > 0) return data;
    } catch {
      /* fall through */
    }
  }
  const cases = getDemoCases() as unknown as Array<Record<string, unknown>>;
  return { cases, total: cases.length };
}

export async function getCase(caseId: string): Promise<Record<string, unknown>> {
  if (HAS_BACKEND) {
    try {
      return await fetchJson<Record<string, unknown>>(`/api/cases/${caseId}`);
    } catch {
      /* fall through */
    }
  }
  const found = getDemoCase(caseId);
  return (found as unknown as Record<string, unknown>) ?? { error: "Case not found" };
}

export async function getBenefits(studentId: string): Promise<BenefitsReport> {
  if (HAS_BACKEND) {
    try {
      return await fetchJson<BenefitsReport>(`/api/benefits/${studentId}`);
    } catch {
      /* fall through */
    }
  }
  return getDemoBenefits(studentId);
}

export async function getProviders(): Promise<{ providers: ProviderStats[]; total: number }> {
  if (HAS_BACKEND) {
    try {
      const data = await fetchJson<{ providers: ProviderStats[]; total: number }>("/api/providers");
      if (data.providers && data.providers.length > 0) return data;
    } catch {
      /* fall through */
    }
  }
  return { providers: DEMO_PROVIDERS, total: DEMO_PROVIDERS.length };
}

export async function getAuditLogs(
  limit: number = 50,
  offset: number = 0
): Promise<{ entries: Array<Record<string, unknown>>; total: number }> {
  if (HAS_BACKEND) {
    try {
      const data = await fetchJson<{ entries: Array<Record<string, unknown>>; total: number }>(
        `/api/audit?limit=${limit}&offset=${offset}`
      );
      if (data.entries && data.entries.length > 0) return data;
    } catch {
      /* fall through */
    }
  }
  const entries = DEMO_AUDIT.slice(offset, offset + limit) as unknown as Array<Record<string, unknown>>;
  return { entries, total: DEMO_AUDIT.length };
}

export async function getMetrics(): Promise<Record<string, unknown>> {
  if (HAS_BACKEND) {
    try {
      return await fetchJson<Record<string, unknown>>("/api/metrics");
    } catch {
      /* fall through */
    }
  }
  return getDemoMetrics();
}

export async function approveCase(caseId: string): Promise<Record<string, unknown>> {
  if (HAS_BACKEND) {
    try {
      return await fetchJson<Record<string, unknown>>(`/api/cases/${caseId}/approve`, { method: "POST" });
    } catch {
      /* fall through */
    }
  }
  return (setDemoCaseStatus(caseId, "approved") as unknown as Record<string, unknown>) ?? { error: "Case not found" };
}

export async function dismissCase(caseId: string): Promise<Record<string, unknown>> {
  if (HAS_BACKEND) {
    try {
      return await fetchJson<Record<string, unknown>>(`/api/cases/${caseId}/dismiss`, { method: "POST" });
    } catch {
      /* fall through */
    }
  }
  return (setDemoCaseStatus(caseId, "dismissed") as unknown as Record<string, unknown>) ?? { error: "Case not found" };
}

function triggerDownload(blob: Blob, caseId: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dispute-letter-${caseId.slice(0, 8)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export async function downloadDisputeLetter(caseId: string): Promise<void> {
  if (HAS_BACKEND) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/api/cases/${caseId}/dispute-letter`, { headers });
      if (response.ok) {
        triggerDownload(await response.blob(), caseId);
        return;
      }
    } catch {
      /* fall through */
    }
  }
  triggerDownload(buildDisputeLetterPdf(caseId), caseId);
}
