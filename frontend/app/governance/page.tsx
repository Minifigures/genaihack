"use client";

import { useEffect, useState } from "react";
import { KPICard } from "@/components/KPICard";
import { getAuditLogs } from "@/lib/api";
import {
  ShieldCheck,
  ClipboardCheck,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Eye,
  Scale,
  Lock,
  Cpu,
  Activity,
} from "lucide-react";

// Demo data when no real audit entries exist
const DEMO_ENTRIES = [
  {
    timestamp: "2026-03-15T10:23:00Z",
    claim_id: "CLM-2026-0042",
    action: "compliance_check",
    details: { compliance_method: "watsonx", approved: true, issues_count: 0, issues: [] },
  },
  {
    timestamp: "2026-03-15T09:15:00Z",
    claim_id: "CLM-2026-0038",
    action: "compliance_check",
    details: { compliance_method: "watsonx", approved: true, issues_count: 0, issues: [] },
  },
  {
    timestamp: "2026-03-14T16:42:00Z",
    claim_id: "CLM-2026-0035",
    action: "compliance_check",
    details: { compliance_method: "watsonx", approved: false, issues_count: 2, issues: ["Insufficient evidence for flag on code D7140", "Low confidence threshold not met"] },
  },
  {
    timestamp: "2026-03-14T14:08:00Z",
    claim_id: "CLM-2026-0031",
    action: "compliance_check",
    details: { compliance_method: "local", approved: true, issues_count: 0, issues: [] },
  },
  {
    timestamp: "2026-03-14T11:30:00Z",
    claim_id: "CLM-2026-0027",
    action: "compliance_check",
    details: { compliance_method: "watsonx", approved: true, issues_count: 0, issues: [] },
  },
];

const AI_PILLARS = [
  { icon: Eye, title: "Transparency", description: "Full model lineage and decision audit trails" },
  { icon: Brain, title: "Explainability", description: "Every flag includes verifiable, concrete evidence" },
  { icon: Scale, title: "Fairness", description: "Active bias detection across all fraud assessments" },
  { icon: Lock, title: "Privacy", description: "No PII sent to external models; data stays sovereign" },
  { icon: ShieldCheck, title: "Robustness", description: "Automatic local fallback if WatsonX is unavailable" },
];

const EVAL_CRITERIA = ["Bias Detection", "Explainability", "Proportionality", "Regulatory Compliance"];

export default function GovernancePage() {
  const [auditEntries, setAuditEntries] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAuditLogs(200, 0);
        setAuditEntries(data.entries || []);
      } catch {
        // Backend may not be running — demo mode
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filter to compliance checks only
  const complianceEntries = auditEntries.filter((e) => e.action === "compliance_check");
  const useDemoData = !loading && complianceEntries.length === 0;
  const displayEntries = useDemoData ? DEMO_ENTRIES : complianceEntries;

  // Compute KPIs
  const totalChecks = displayEntries.length;
  const passedChecks = displayEntries.filter(
    (e) => (e.details as Record<string, unknown>)?.approved === true
  ).length;
  const passRate = totalChecks > 0 ? ((passedChecks / totalChecks) * 100).toFixed(1) : "--";
  const watsonxChecks = displayEntries.filter(
    (e) => (e.details as Record<string, unknown>)?.compliance_method === "watsonx"
  ).length;
  const watsonxRate = totalChecks > 0 ? ((watsonxChecks / totalChecks) * 100).toFixed(1) : "--";
  const totalIssues = displayEntries.reduce(
    (sum, e) => sum + ((e.details as Record<string, unknown>)?.issues_count as number || 0),
    0
  );
  const avgIssues = totalChecks > 0 ? (totalIssues / totalChecks).toFixed(1) : "--";

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-heading text-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </div>
          AI Governance
        </h1>
        <p className="text-sm text-slate-500 mt-2 ml-[52px]">
          WatsonX-powered compliance monitoring and responsible AI transparency
        </p>
      </div>

      {/* Demo banner */}
      {useDemoData && (
        <div className="mb-6 card border-blue-200 bg-blue-50/50 p-4 flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            Showing demo data. Process claims to see live governance metrics.
          </p>
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-5">
              <div className="h-4 w-24 rounded bg-slate-100 animate-pulse mb-3" />
              <div className="h-8 w-16 rounded bg-slate-100 animate-pulse mb-2" />
              <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <KPICard
            title="Compliance Checks"
            value={totalChecks}
            subtitle="total checks run"
            color="blue"
            icon={ClipboardCheck}
          />
          <KPICard
            title="Pass Rate"
            value={passRate === "--" ? "--" : `${passRate}%`}
            subtitle="checks approved"
            color="green"
            icon={CheckCircle2}
          />
          <KPICard
            title="WatsonX Usage"
            value={watsonxRate === "--" ? "--" : `${watsonxRate}%`}
            subtitle="via IBM Granite"
            color="blue"
            icon={Brain}
          />
          <KPICard
            title="Avg Issues/Check"
            value={avgIssues}
            subtitle="issues detected"
            color={avgIssues !== "--" && parseFloat(avgIssues as string) > 1 ? "yellow" : "gray"}
            icon={AlertTriangle}
          />
        </div>
      )}

      {/* Model Transparency + AI Ethics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Model Transparency Card */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Model Transparency</h2>
              <p className="text-xs text-slate-400">IBM WatsonX Compliance Gate Configuration</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Model</p>
              <p className="text-sm font-semibold text-slate-800">IBM Granite 3 8B Instruct</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Model ID</p>
              <p className="text-sm font-mono text-slate-700">ibm/granite-3-8b-instruct</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Provider</p>
              <p className="text-sm font-semibold text-slate-800">IBM WatsonX</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Temperature</p>
              <p className="text-sm font-mono text-slate-700">
                0.1 <span className="text-slate-400 text-xs">(deterministic)</span>
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              Evaluation Criteria
            </p>
            <div className="flex flex-wrap gap-2">
              {EVAL_CRITERIA.map((criterion) => (
                <span
                  key={criterion}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {criterion}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Why Granite?</span>{" "}
              IBM Granite models are purpose-built for enterprise AI with built-in safety
              guardrails, full data transparency, and indemnification — making them ideal
              for regulated healthcare compliance decisions.
            </p>
          </div>
        </div>

        {/* AI Ethics Alignment Card */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-semibold text-slate-800">AI Ethics Alignment</h2>
          </div>

          <p className="text-xs text-slate-500 mb-4">
            VIGIL aligns with IBM&apos;s Pillars of Trustworthy AI
          </p>

          <div className="space-y-3">
            {AI_PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <pillar.icon className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{pillar.title}</p>
                  <p className="text-xs text-slate-500">{pillar.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance Audit Trail */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Compliance Audit Trail</h2>
          {useDemoData && (
            <span className="text-xs text-slate-400 italic">Demo data</span>
          )}
        </div>

        {displayEntries.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No compliance checks yet</p>
            <p className="text-sm text-slate-400 mt-1">Upload a receipt to trigger the compliance gate</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-2.5 bg-slate-50/50 border-b border-slate-100 grid grid-cols-5 text-xs font-medium text-slate-400 uppercase tracking-wider">
              <span>Timestamp</span>
              <span>Claim ID</span>
              <span>Method</span>
              <span>Verdict</span>
              <span className="text-right">Issues</span>
            </div>
            <div className="divide-y divide-slate-50">
              {displayEntries.slice(0, 20).map((entry, idx) => {
                const details = (entry.details || {}) as Record<string, unknown>;
                const approved = details.approved as boolean;
                const method = (details.compliance_method as string) || "local";
                const issuesCount = (details.issues_count as number) || 0;
                const timestamp = entry.timestamp as string;
                const claimId = entry.claim_id as string;

                return (
                  <div
                    key={idx}
                    className="px-6 py-3.5 grid grid-cols-5 items-center hover:bg-slate-50/50 transition-colors"
                  >
                    <span className="text-sm text-slate-500">
                      {timestamp
                        ? new Date(timestamp).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--"}
                    </span>
                    <span className="text-sm font-medium text-slate-700 font-mono">
                      {claimId ? claimId.slice(0, 16) : "--"}
                    </span>
                    <span>
                      <span
                        className={`badge ${
                          method === "watsonx"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {method === "watsonx" ? "WatsonX" : "Local"}
                      </span>
                    </span>
                    <span>
                      <span
                        className={`badge ${
                          approved
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {approved ? "Pass" : "Fail"}
                      </span>
                    </span>
                    <span className="text-sm text-slate-400 text-right">{issuesCount}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
