"use client";

import { useEffect, useState } from "react";
import { getBenefits } from "@/lib/api";
import { BenefitsCard } from "@/components/BenefitsCard";
import type { BenefitsReport } from "@/lib/api";

export default function MyPlanPage() {
  const [report, setReport] = useState<BenefitsReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getBenefits("STU-001");
        setReport(data);
      } catch {
        setReport(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-normal text-foreground leading-tight">
          My Plan
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Your student health coverage at a glance
        </p>
      </div>

      {loading ? (
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      ) : (
        <div>
          <BenefitsCard report={report} />

          {report && report.coverage_items.some((i) => i.recommendation) && (
            <div className="mt-5 bg-card rounded-lg border border-border p-5">
              <p className="font-mono text-2xs uppercase tracking-[0.1em] text-muted-foreground mb-3">
                Recommendations
              </p>
              <div className="space-y-2.5">
                {report.coverage_items
                  .filter((item) => item.recommendation)
                  .map((item) => (
                    <div
                      key={item.category}
                      className="border-l-2 border-primary/30 pl-3"
                    >
                      <p className="text-sm font-medium text-foreground capitalize mb-0.5">
                        {item.category}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.recommendation}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
