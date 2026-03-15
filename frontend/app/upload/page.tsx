"use client";

import { useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { AgentTracePanel } from "@/components/AgentTracePanel";
import { FraudCaseCard } from "@/components/FraudCaseCard";
import { BenefitsCard } from "@/components/BenefitsCard";
import { uploadClaim } from "@/lib/api";
import type { PipelineResult, AgentTrace } from "@/lib/api";
import { FileUp, AlertCircle, Sparkles } from "lucide-react";

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
        <div className="lg:col-span-2 space-y-6">
          <UploadZone onUpload={handleUpload} isLoading={isLoading} />

          <button
            onClick={handleAnalyze}
            disabled={!selectedFile || isLoading}
            className="btn-primary w-full py-3 text-base"
          >
            <Sparkles className="w-4 h-4" />
            {isLoading ? "Analyzing..." : "Analyze Receipt"}
          </button>

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
            </div>
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

        <div>
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
