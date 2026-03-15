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
      <div className="mb-8">
        <h1 className="font-display text-2xl font-normal text-foreground leading-tight">
          Submit a Receipt
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          See what you&apos;re covered for — VIGIL checks your benefits and flags anything unusual
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <UploadZone onUpload={handleUpload} isLoading={isLoading} />

          <PulsatingButton
            onClick={handleAnalyze}
            disabled={!selectedFile || isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 font-medium text-sm rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
            pulseColor="hsl(142 63% 32%)"
          >
            <Scan className="w-4 h-4 mr-2" />
            {isLoading ? "Analyzing..." : "Analyze Receipt"}
          </PulsatingButton>

          {error && (
            <Alert variant="destructive" className="rounded-lg border">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-4">
              <BenefitsCard report={result.benefits_report} />
              <FraudCaseCard fraudScore={result.fraud_score} flags={result.fraud_flags ?? []} />
            </div>
          )}

          {result?.report_html && (
            <Card>
              <CardHeader className="border-b border-border pb-3">
                <CardTitle className="text-base font-medium">Detailed Analysis</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div dangerouslySetInnerHTML={{ __html: result.report_html }} />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <AgentTracePanel traces={traces} isRunning={isLoading} />

          {result && result.ranked_plans && result.ranked_plans.length > 0 && (
            <div className="bg-card rounded-lg border border-border p-5">
              <p className="font-mono text-2xs uppercase tracking-[0.1em] text-muted-foreground mb-3">
                Recommended Actions
              </p>
              <div className="space-y-2">
                {result.ranked_plans.map((rp, idx) => (
                  <div key={idx} className="bg-muted rounded-sm px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-foreground">{rp.plan.name as string}</span>
                      <span className="font-mono text-2xs text-muted-foreground shrink-0">
                        {rp.priority_score}
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
