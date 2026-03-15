"use client";

import { useEffect, useState } from "react";
import { getBenefits } from "@/lib/api";
import { BenefitsCard } from "@/components/BenefitsCard";
import type { BenefitsReport } from "@/lib/api";
import { Users } from "lucide-react";

const BENCHMARK_DATA: Record<string, number> = {
  dental: 65,
  vision: 40,
  paramedical: 25,
  psychology: 15,
  prescription: 20,
};

function getComparisonColor(studentPct: number, benchmarkPct: number): string {
  if (studentPct >= benchmarkPct) return "text-[hsl(var(--status-resolved-fg))]";
  if (studentPct >= benchmarkPct * 0.5) return "text-[hsl(43_96%_38%)]";
  return "text-[hsl(var(--status-review-fg))]";
}

function getBarColor(studentPct: number, benchmarkPct: number): string {
  if (studentPct >= benchmarkPct) return "bg-primary";
  if (studentPct >= benchmarkPct * 0.5) return "bg-[hsl(43_96%_50%)]";
  return "bg-[hsl(var(--status-review-fg))]";
}

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

          {/* Students Like You benchmark widget */}
          {report && report.coverage_items.length > 0 && (
            <div className="mt-5 bg-card rounded-lg border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-muted rounded-sm flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-mono text-2xs uppercase tracking-[0.1em] text-muted-foreground">
                    Students Like You
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Benefit usage vs other UofT students by March
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {report.coverage_items.map((item) => {
                  const benchmark = BENCHMARK_DATA[item.category] ?? 50;
                  const studentPct =
                    item.annual_limit > 0
                      ? Math.round((item.used_ytd / item.annual_limit) * 100)
                      : 0;
                  const compColor = getComparisonColor(studentPct, benchmark);
                  const barColor = getBarColor(studentPct, benchmark);

                  return (
                    <div key={item.category}>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-sm font-medium text-foreground capitalize">
                          {item.category}
                        </span>
                        <span className={`text-xs font-medium ${compColor}`}>
                          {studentPct >= benchmark ? "Above" : "Below"} average
                        </span>
                      </div>

                      {/* Student bar */}
                      <div className="relative mb-1">
                        <div className="w-full bg-muted rounded-sm h-3 overflow-hidden">
                          <div
                            className={`${barColor} h-3 rounded-sm transition-all relative`}
                            style={{ width: `${Math.min(100, studentPct)}%` }}
                          >
                            <span className="absolute right-2 top-0.5 text-[10px] font-bold text-white drop-shadow">
                              {studentPct > 8 ? `${studentPct}%` : ""}
                            </span>
                          </div>
                        </div>
                        {/* Benchmark marker */}
                        <div
                          className="absolute top-0 h-3 border-r-2 border-dashed border-muted-foreground/50"
                          style={{ left: `${Math.min(100, benchmark)}%` }}
                        />
                      </div>

                      <div className="flex justify-between">
                        <span className="font-mono text-2xs text-muted-foreground">
                          You: {studentPct}%
                        </span>
                        <span className="font-mono text-2xs text-muted-foreground">
                          Avg student: {benchmark}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 p-3 bg-muted rounded-sm border border-border">
                <p className="font-mono text-2xs text-muted-foreground">
                  Students in your program typically use {BENCHMARK_DATA.dental}% of their dental
                  coverage by March. Green means you are on track, amber means you may be
                  underusing benefits, and red means you are significantly below average.
                </p>
              </div>
            </div>
          )}

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
