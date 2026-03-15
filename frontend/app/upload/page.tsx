"use client";

import { useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { AgentTracePanel } from "@/components/AgentTracePanel";
import { FraudCaseCard } from "@/components/FraudCaseCard";
import { BenefitsCard } from "@/components/BenefitsCard";
import { uploadClaim } from "@/lib/api";
import type { PipelineResult, AgentTrace } from "@/lib/api";
import { FileUp, AlertCircle, Sparkles, ShieldCheck, ShieldAlert } from "lucide-react";

function IbmLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="100" height="4" />
      <rect x="0" y="8" width="100" height="4" />
      <rect x="0" y="16" width="16" height="4" />
      <rect x="28" y="16" width="44" height="4" />
      <rect x="84" y="16" width="16" height="4" />
      <rect x="0" y="24" width="16" height="4" />
      <rect x="28" y="24" width="44" height="4" />
      <rect x="84" y="24" width="16" height="4" />
      <rect x="0" y="32" width="100" height="4" />
      <rect x="0" y="36" width="100" height="4" />
    </svg>
  );
}

export default function UploadPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [traces, setTraces] = useState<AgentTrace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function handleUpload(file: File) {
    setSelectedFile(file);
  }

  async function handleAnalyze() {
    if (!selectedFile) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setTraces([]);

    try {
      const pipelineResult = await uploadClaim(selectedFile);
      setResult(pipelineResult);
      setTraces(pipelineResult.agent_traces || []);
      if (pipelineResult.errors && pipelineResult.errors.length > 0) {
        setError(
          `Pipeline completed with ${pipelineResult.errors.length} error(s)`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-heading text-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-vigil-50 flex items-center justify-center">
            <FileUp className="w-5 h-5 text-vigil-600" />
          </div>
          Upload Receipt
        </h1>
        <p className="text-sm text-slate-500 mt-2 ml-[52px]">
          Upload a healthcare receipt to analyze for fraud and discover unused
          benefits
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <UploadZone onUpload={handleUpload} isLoading={isLoading} />

          <button
            onClick={handleAnalyze}
            disabled={!selectedFile || isLoading}
            className="btn-primary w-full py-3 text-base"
          >
            <Sparkles className="w-4 h-4" />
            {isLoading ? "Analyzing..." : "Analyze Receipt"}
          </PulsatingButton>

          {error && (
            <div className="card border-red-200 bg-red-50 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FraudCaseCard
                fraudScore={result.fraud_score}
                flags={result.fraud_flags}
              />
              <BenefitsCard report={result.benefits_report} />
              <FraudCaseCard fraudScore={result.fraud_score} flags={result.fraud_flags ?? []} />
            </div>
          )}

          {result && (
            (() => {
              const complianceTrace = traces.find(
                (t) => t.agent === "compliance_gate" && t.event === "complete"
              );
              const usedWatsonx = !!complianceTrace;
              const approved = result.compliance_approved;

              return (
                <div
                  className={`rounded-lg border p-4 flex items-center gap-3 ${
                    approved
                      ? "bg-blue-50 border-blue-200"
                      : "bg-amber-50 border-amber-200"
                  }`}
                >
                  {approved ? (
                    <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        approved ? "text-blue-800" : "text-amber-800"
                      }`}
                    >
                      {approved
                        ? "Compliance Check Passed"
                        : "Compliance Issues Detected"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {usedWatsonx
                        ? "Verified by IBM WatsonX Granite for bias, explainability & regulatory compliance"
                        : "Verified by local compliance filter"}
                    </p>
                  </div>
                  {usedWatsonx && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600 text-white text-xs font-medium flex-shrink-0">
                      IBM WatsonX
                    </span>
                  )}
                </div>
              );
            })()
          )}

          {result?.report_html && (
            <div className="card p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-4">
                Full Report
              </h3>
              <div
                className="prose prose-sm max-w-none prose-slate"
                dangerouslySetInnerHTML={{ __html: result.report_html }}
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <AgentTracePanel traces={traces} isRunning={isLoading} />

          {result && result.ranked_plans && result.ranked_plans.length > 0 && (
            <div className="card mt-6 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Recommended Actions
              </h3>
              <div className="space-y-2">
                {result.ranked_plans.map((rp, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-800">
                        {rp.plan.name as string}
                      </span>
                      <span className="text-xs text-slate-500">
                        Priority: {rp.priority_score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
