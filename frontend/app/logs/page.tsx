"use client";

import { useEffect, useState } from "react";
import { getAuditLogs } from "@/lib/api";
import {
  ScrollText,
  Activity,
  ShieldCheck,
  AlertTriangle,
  FileSearch,
  User,
  Upload,
  Settings,
} from "lucide-react";

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: typeof Activity }> = {
  compliance_check: { label: "Compliance Check", color: "bg-blue-100 text-blue-700", icon: ShieldCheck },
  fraud_analysis: { label: "Fraud Analysis", color: "bg-red-100 text-red-700", icon: AlertTriangle },
  claim_upload: { label: "Claim Upload", color: "bg-vigil-100 text-vigil-700", icon: Upload },
  case_created: { label: "Case Created", color: "bg-amber-100 text-amber-700", icon: FileSearch },
  user_login: { label: "User Login", color: "bg-slate-100 text-slate-600", icon: User },
  settings_change: { label: "Settings", color: "bg-purple-100 text-purple-700", icon: Settings },
};

const DEMO_AUDIT = [
  { timestamp: "2026-03-15T10:23:00Z", action: "compliance_check", agent: "compliance_gate", claim_id: "CLM-2026-0042", details: { approved: true, compliance_method: "watsonx", issues_count: 0 } },
  { timestamp: "2026-03-15T10:22:55Z", action: "fraud_analysis", agent: "fraud_analyst", claim_id: "CLM-2026-0042", details: { fraud_score: 67, flags_count: 3 } },
  { timestamp: "2026-03-15T10:22:40Z", action: "claim_upload", agent: "ocr_agent", claim_id: "CLM-2026-0042", details: { filename: "dental_receipt_042.pdf", pages: 1 } },
  { timestamp: "2026-03-15T09:15:00Z", action: "compliance_check", agent: "compliance_gate", claim_id: "CLM-2026-0038", details: { approved: true, compliance_method: "watsonx", issues_count: 0 } },
  { timestamp: "2026-03-15T09:14:50Z", action: "fraud_analysis", agent: "fraud_analyst", claim_id: "CLM-2026-0038", details: { fraud_score: 42, flags_count: 1 } },
  { timestamp: "2026-03-14T16:42:00Z", action: "compliance_check", agent: "compliance_gate", claim_id: "CLM-2026-0035", details: { approved: false, compliance_method: "watsonx", issues_count: 2 } },
  { timestamp: "2026-03-14T16:41:45Z", action: "fraud_analysis", agent: "fraud_analyst", claim_id: "CLM-2026-0035", details: { fraud_score: 78, flags_count: 4 } },
  { timestamp: "2026-03-14T16:41:30Z", action: "claim_upload", agent: "ocr_agent", claim_id: "CLM-2026-0035", details: { filename: "dental_receipt_035.pdf", pages: 2 } },
  { timestamp: "2026-03-14T14:08:00Z", action: "compliance_check", agent: "compliance_gate", claim_id: "CLM-2026-0031", details: { approved: true, compliance_method: "local", issues_count: 0 } },
  { timestamp: "2026-03-14T11:30:00Z", action: "compliance_check", agent: "compliance_gate", claim_id: "CLM-2026-0027", details: { approved: true, compliance_method: "watsonx", issues_count: 0 } },
];

export default function AuditLogPage() {
  const [entries, setEntries] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAuditLogs(100, 0);
        setEntries(data.entries || []);
      } catch {
        // Backend may not be running
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const useDemoData = !loading && entries.length === 0;
  const displayEntries = useDemoData ? DEMO_AUDIT : entries;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-heading text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <ScrollText className="w-5 h-5 text-slate-600" />
            </div>
            Audit Log
          </h1>
          <p className="text-sm text-slate-500 mt-2 ml-[52px]">
            Complete activity trail for all agent actions and compliance decisions
          </p>
        </div>
      </div>

      {/* Demo banner */}
      {useDemoData && (
        <div className="mb-6 card border-slate-200 bg-slate-50/50 p-4 flex items-center gap-3">
          <Activity className="w-5 h-5 text-slate-500 flex-shrink-0" />
          <p className="text-sm text-slate-600">
            Showing demo data. Process claims to see live audit entries.
          </p>
        </div>
      )}

      {/* Audit Table */}
      {loading ? (
        <div className="card p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-32 rounded bg-slate-100 animate-pulse" />
              <div className="h-4 w-24 rounded bg-slate-100 animate-pulse" />
              <div className="h-4 w-20 rounded bg-slate-100 animate-pulse" />
              <div className="h-4 flex-1 rounded bg-slate-100 animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-6 py-2.5 bg-slate-50/50 border-b border-slate-100 grid grid-cols-12 text-xs font-medium text-slate-400 uppercase tracking-wider">
            <span className="col-span-2">Timestamp</span>
            <span className="col-span-2">Action</span>
            <span className="col-span-2">Agent</span>
            <span className="col-span-2">Claim ID</span>
            <span className="col-span-4">Details</span>
          </div>
          <div className="divide-y divide-slate-50">
            {displayEntries.slice(0, 50).map((entry, idx) => {
              const action = (entry.action as string) || "unknown";
              const config = ACTION_CONFIG[action] || { label: action, color: "bg-slate-100 text-slate-600", icon: Activity };
              const Icon = config.icon;
              const details = (entry.details || {}) as Record<string, unknown>;
              const timestamp = entry.timestamp as string;
              const agent = (entry.agent as string) || "--";
              const claimId = (entry.claim_id as string) || "--";

              // Build details summary
              const detailParts: string[] = [];
              if (details.approved !== undefined) detailParts.push(details.approved ? "Approved" : "Flagged");
              if (details.compliance_method) detailParts.push(`via ${details.compliance_method}`);
              if (details.fraud_score) detailParts.push(`score: ${details.fraud_score}`);
              if (details.flags_count) detailParts.push(`${details.flags_count} flags`);
              if (details.issues_count && (details.issues_count as number) > 0) detailParts.push(`${details.issues_count} issues`);
              if (details.filename) detailParts.push(details.filename as string);

              return (
                <div
                  key={idx}
                  className="px-6 py-3.5 grid grid-cols-12 items-center hover:bg-slate-50/50 transition-colors"
                >
                  <span className="col-span-2 text-sm text-slate-500">
                    {timestamp
                      ? new Date(timestamp).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : "--"}
                  </span>
                  <span className="col-span-2">
                    <span className={`badge inline-flex items-center gap-1 ${config.color}`}>
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </span>
                  <span className="col-span-2 text-sm text-slate-600 font-mono">
                    {agent}
                  </span>
                  <span className="col-span-2 text-sm font-medium text-slate-700 font-mono">
                    {claimId !== "--" ? claimId.slice(0, 16) : "--"}
                  </span>
                  <span className="col-span-4 text-sm text-slate-500">
                    {detailParts.join(" · ") || "--"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
