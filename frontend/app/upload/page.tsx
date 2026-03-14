"use client";

import { useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { AgentTracePanel } from "@/components/AgentTracePanel";
import { FraudCaseCard } from "@/components/FraudCaseCard";
import { BenefitsCard } from "@/components/BenefitsCard";
import { uploadClaim } from "@/lib/api";
import type { PipelineResult, AgentTrace } from "@/lib/api";

export default function UploadPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [traces, setTraces] = useState<AgentTrace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [studentId, setStudentId] = useState("STU-001");
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
      const pipelineResult = await uploadClaim(selectedFile, studentId);
      setResult(pipelineResult);
      setTraces(pipelineResult.agent_traces || []);

      if (pipelineResult.errors && pipelineResult.errors.length > 0) {
        setError(`Pipeline completed with ${pipelineResult.errors.length} error(s)`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Upload Receipt</h1>
        <p className="text-gray-500 mt-1">
          Upload a healthcare receipt to analyze for fraud and discover unused benefits
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <UploadZone onUpload={handleUpload} isLoading={isLoading} />

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <label className="text-sm font-medium text-gray-700">Student ID</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-vigil-500 focus:ring-vigil-500 text-sm p-2 border"
            >
              <option value="STU-001">STU-001 (Alex Chen, CS Year 3)</option>
              <option value="STU-002">STU-002 (Jordan Williams, Bio Year 2)</option>
              <option value="STU-003">STU-003 (Priya Patel, Eng Year 4)</option>
            </select>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!selectedFile || isLoading}
            className="w-full bg-vigil-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-vigil-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? "Analyzing..." : "Analyze Receipt"}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FraudCaseCard fraudScore={result.fraud_score} flags={result.fraud_flags} />
              <BenefitsCard report={result.benefits_report} />
            </div>
          )}

          {result?.report_html && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Full Report</h3>
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: result.report_html }} />
            </div>
          )}
        </div>

        <div>
          <AgentTracePanel traces={traces} isRunning={isLoading} />

          {result && result.ranked_plans && result.ranked_plans.length > 0 && (
            <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Recommended Actions</h3>
              <div className="space-y-2">
                {result.ranked_plans.map((rp, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-800">{rp.plan.name as string}</span>
                      <span className="text-xs text-gray-500">Priority: {rp.priority_score}</span>
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
