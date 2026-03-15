"use client";

import type { BenefitsReport } from "@/lib/api";

interface BenefitsCardProps {
  report: BenefitsReport | null;
}

// Flat category bar colors — no gradients
const categoryBar: Record<string, string> = {
  dental:       "bg-primary",
  vision:       "bg-[hsl(221_83%_53%)]",
  paramedical:  "bg-[hsl(162_63%_41%)]",
  psychology:   "bg-[hsl(271_60%_52%)]",
  prescription: "bg-[hsl(25_90%_52%)]",
};

export function BenefitsCard({ report }: BenefitsCardProps) {
  if (!report) {
    return (
      <div className="bg-card rounded-lg border border-border p-5">
        <p className="text-sm font-medium text-foreground mb-1">Benefits Summary</p>
        <p className="text-sm text-muted-foreground">No benefits data available</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-base font-medium text-foreground">Benefits Summary</p>
        <span className="font-mono text-2xs text-muted-foreground uppercase tracking-wider">
          {report.plan_type}
        </span>
      </div>

      {/* Unused coverage callout */}
      <div className="bg-[hsl(var(--status-resolved-bg))] border border-[hsl(var(--status-resolved-border))] rounded-lg px-4 py-3 mb-5">
        <p className="font-mono text-2xs text-[hsl(var(--status-resolved-fg))] uppercase tracking-wider mb-1">
          Total Unused Coverage
        </p>
        <p className="font-mono text-[1.75rem] font-medium text-[hsl(var(--status-resolved-fg))] leading-none tabular">
          ${report.total_unused.toFixed(2)}
        </p>
        {report.savings_from_fraud_flag !== null && report.savings_from_fraud_flag > 0 && (
          <p className="text-xs text-[hsl(var(--status-review-fg))] mt-1.5">
            + ${report.savings_from_fraud_flag.toFixed(2)} potential savings from billing irregularities
          </p>
        )}
      </div>

      {/* Coverage items */}
      <div className="space-y-4">
        {report.coverage_items.map((item) => {
          const usagePct = item.annual_limit > 0
            ? (item.used_ytd / item.annual_limit) * 100
            : 0;
          const barColor = categoryBar[item.category] ?? "bg-muted-foreground";

          return (
            <div key={item.category}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm font-medium text-foreground capitalize">
                  {item.category}
                </span>
                <span className="font-mono text-xs text-muted-foreground tabular">
                  ${item.used_ytd.toFixed(0)} / ${item.annual_limit.toFixed(0)}
                </span>
              </div>
              {/* Progress bar — 4px, no rounded-full */}
              <div className="w-full bg-muted rounded-sm h-1">
                <div
                  className={`${barColor} h-1 rounded-sm transition-all duration-500`}
                  style={{ width: `${Math.min(100, usagePct)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-2xs text-muted-foreground tabular">
                  ${item.remaining.toFixed(0)} remaining
                </span>
                <span className="font-mono text-2xs text-muted-foreground">
                  {item.coverage_pct * 100}% covered
                </span>
              </div>
              {item.recommendation && (
                <p className="text-xs text-primary mt-1.5 border-l-2 border-primary/30 pl-2">
                  {item.recommendation}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
