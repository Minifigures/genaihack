"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getClaim } from "@/lib/api";
import { FraudCaseCard } from "@/components/FraudCaseCard";
import { BenefitsCard } from "@/components/BenefitsCard";
import { AgentTracePanel } from "@/components/AgentTracePanel";
import type { PipelineResult } from "@/lib/api";

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
    return <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />;
  }

  if (!result) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">Case not found</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Case {caseId.slice(0, 8)}...
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <FraudCaseCard
            fraudScore={result.fraud_score}
            flags={result.fraud_flags}
          />
          <BenefitsCard report={result.benefits_report} />

          {result.report_html && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Full Report</h3>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: result.report_html }}
              />
            </div>
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
