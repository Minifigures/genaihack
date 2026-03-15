"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getClaim } from "@/lib/api";
import { FraudCaseCard } from "@/components/FraudCaseCard";
import { BenefitsCard } from "@/components/BenefitsCard";
import { AgentTracePanel } from "@/components/AgentTracePanel";
import type { PipelineResult } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = params.id as string;
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getClaim(caseId);
        setResult(data);
      } catch {
        // Not found
      } finally {
        setLoading(false);
      }
    }
    if (caseId) load();
  }, [caseId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Case not found</p>
          <Link href="/cases" className="text-emerald-600 hover:text-emerald-700 text-sm mt-2 inline-block">
            Back to cases
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cases" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 font-mono">
              {caseId.slice(0, 8).toUpperCase()}
            </h1>
            {result.fraud_score && (
              <Badge variant={result.fraud_score.level === "critical" || result.fraud_score.level === "high" ? "destructive" : "secondary"}>
                {result.fraud_score.level.toUpperCase()}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Claim <span className="font-mono">{result.claim_id.slice(0, 8)}</span> |
            Student: {result.student_id} |
            {result.timestamp ? new Date(result.timestamp).toLocaleDateString() : "--"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <FraudCaseCard
            fraudScore={result.fraud_score}
            flags={result.fraud_flags}
          />
          <BenefitsCard report={result.benefits_report} />

          {result.report_html && (
            <Card>
              <CardHeader>
                <CardTitle>Full Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ __html: result.report_html }}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <AgentTracePanel
            traces={result.agent_traces || []}
            isRunning={false}
          />
        </div>
      </div>
    </div>
  );
}
