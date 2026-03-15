"use client";

import { useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { AgentTracePanel } from "@/components/AgentTracePanel";
import { FraudCaseCard } from "@/components/FraudCaseCard";
import { BenefitsCard } from "@/components/BenefitsCard";
import { uploadClaim } from "@/lib/api";
import type { PipelineResult, AgentTrace } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PulsatingButton } from "@/components/ui/pulsating-button";
import { AlertCircle, Scan } from "lucide-react";

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
        <p className="text-muted-foreground mt-1">Upload a healthcare receipt to analyze for fraud and discover unused benefits</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <UploadZone onUpload={handleUpload} isLoading={isLoading} />

          <PulsatingButton
            onClick={handleAnalyze}
            disabled={!selectedFile || isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed"
            pulseColor="#22c55e"
          >
            <Scan className="w-4 h-4 mr-2" />
            {isLoading ? "Analyzing..." : "Analyze Receipt"}
          </PulsatingButton>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FraudCaseCard fraudScore={result.fraud_score} flags={result.fraud_flags} />
              <BenefitsCard report={result.benefits_report} />
            </div>
          )}

          {result?.report_html && (
            <Card>
              <CardHeader><CardTitle>Full Report</CardTitle></CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: result.report_html }} />
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <AgentTracePanel traces={traces} isRunning={isLoading} />
          {result && result.ranked_plans && result.ranked_plans.length > 0 && (
            <Card className="mt-6">
              <CardHeader><CardTitle className="text-sm">Recommended Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {result.ranked_plans.map((rp, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-800">{rp.plan.name as string}</span>
                      <span className="text-xs text-muted-foreground">Priority: {rp.priority_score}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
