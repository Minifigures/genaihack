"use client";

import { useEffect, useState } from "react";
import { getCases, approveCase, dismissCase, downloadDisputeLetter } from "@/lib/api";
import { FolderSearch, FileX, CheckCircle2, XCircle, FileDown, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface FraudCase {
  case_id: string;
  claim_id: string | null;
  student_id: string;
  provider_id?: string;
  fraud_score: number;
  risk_level: string;
  status: string;
  flags: Array<{ fraud_type: string; code: string; evidence?: string }>;
  created_at?: string;
}

// Cross-student provider intelligence (matches backend demo data)
const PROVIDER_STUDENT_FLAGS: Record<string, number> = {
  "PRV-001": 5,
  "PRV-003": 14,
  "PRV-004": 2,
};

const irregularityLabels: Record<string, string> = {
  upcoding: "Overcharge",
  unbundling: "Split Billing",
  phantom_billing: "Unrendered Service",
  fee_deviation: "Fee Above Guide",
  duplicate_claim: "Duplicate Charge",
};

const levelStyles: Record<string, string> = {
  low: "bg-green-50 text-green-700",
  elevated: "bg-yellow-50 text-yellow-700",
  high: "bg-orange-50 text-orange-700",
  critical: "bg-red-50 text-red-700",
};

export default function CasesPage() {
  const [cases, setCases] = useState<FraudCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

  async function loadCases() {
    try {
      const data = await getCases();
      setCases((data.cases || []) as unknown as FraudCase[]);
    } catch {
      // API may not be running
    } finally {
      setLoading(false);
    }
  }

  const openCases = cases.filter((c) => c.status === "open");
  const resolvedCases = cases.filter((c) => c.status !== "open");

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-heading text-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-vigil-50 flex items-center justify-center">
            <FolderSearch className="w-5 h-5 text-vigil-600" />
          </div>
          Fraud Cases
        </h1>
        <p className="text-sm text-slate-500 mt-2 ml-[52px]">
          {openCases.length} need{openCases.length === 1 ? "s" : ""} review
          {resolvedCases.length > 0 && ` · ${resolvedCases.length} resolved`}
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6">
              <div className="skeleton h-5 w-48 rounded mb-3" />
              <div className="skeleton h-4 w-32 rounded mb-4" />
              <div className="flex gap-2">
                <div className="skeleton h-6 w-24 rounded-full" />
                <div className="skeleton h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : cases.length === 0 ? (
        <div className="card p-16 text-center">
          <FileX className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No fraud cases yet</p>
          <p className="text-sm text-slate-400 mt-1">Upload a receipt to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => (
            <CaseCard
              key={c.case_id}
              fraudCase={c}
              onApprove={async () => {
                await approveCase(c.case_id);
                toast.success("Case approved");
                loadCases();
              }}
              onDismiss={async () => {
                await dismissCase(c.case_id);
                toast.success("Case dismissed");
                loadCases();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CaseCard({
  fraudCase,
  onApprove,
  onDismiss,
}: {
  fraudCase: FraudCase;
  onApprove?: () => void;
  onDismiss?: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const isOpen = fraudCase.status === "open";
  const providerFlagCount = fraudCase.provider_id
    ? PROVIDER_STUDENT_FLAGS[fraudCase.provider_id] ?? 0
    : 0;

  async function handleDownloadLetter() {
    setDownloading(true);
    try {
      await downloadDisputeLetter(fraudCase.case_id);
      toast.success("Dispute letter downloaded");
    } catch {
      toast.error("Failed to generate dispute letter");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="card-hover p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 font-mono">
            {fraudCase.case_id.slice(0, 12).toUpperCase()}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Student: {fraudCase.student_id}
            {fraudCase.claim_id && <> | Claim: {fraudCase.claim_id.slice(0, 8)}</>}
            {fraudCase.created_at && (
              <> | {new Date(fraudCase.created_at).toLocaleDateString()}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${levelStyles[fraudCase.risk_level] || levelStyles.low}`}>
            {fraudCase.fraud_score}/100 {(fraudCase.risk_level || "").toUpperCase()}
          </span>
          {!isOpen && (
            <span className={`badge ${fraudCase.status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              {fraudCase.status === "approved" ? "Approved" : "Dismissed"}
            </span>
          )}
        </div>
      </div>

      {/* Community intelligence banner */}
      {providerFlagCount > 0 && (
        <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
          <ShieldAlert className="w-3.5 h-3.5 text-orange-600 shrink-0" />
          <span className="text-xs font-medium text-orange-700">
            {providerFlagCount} other students have flagged this provider for similar billing patterns
          </span>
        </div>
      )}

      {/* Fraud flags */}
      {fraudCase.flags && fraudCase.flags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {fraudCase.flags.map((flag, idx) => (
            <span key={idx} className="badge bg-red-50 text-red-700">
              {irregularityLabels[flag.fraud_type] || flag.fraud_type.replace(/_/g, " ")}
              {flag.code && ` (${flag.code})`}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons for open cases */}
      {isOpen && onApprove && onDismiss && (
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={onApprove}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approve Dispute
          </button>
          <button
            onClick={onDismiss}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            Dismiss
          </button>
          <button
            onClick={handleDownloadLetter}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            <FileDown className="w-3.5 h-3.5" />
            {downloading ? "Generating..." : "Dispute Letter"}
          </button>
        </div>
      )}

      {/* Download letter for approved cases */}
      {fraudCase.status === "approved" && (
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={handleDownloadLetter}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            <FileDown className="w-3.5 h-3.5" />
            {downloading ? "Generating..." : "Download Dispute Letter"}
          </button>
        </div>
      )}
    </div>
  );
}
