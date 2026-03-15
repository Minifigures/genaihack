"use client";

import type { FraudScore, FraudFlag } from "@/lib/api";
import { cn } from "@/lib/utils";

interface FraudCaseCardProps {
  fraudScore: FraudScore | null;
  flags: FraudFlag[];
}

// Level config — maps to CSS variables for status semantics
const levelConfig: Record<string, {
  bg: string; fg: string; border: string; bar: string; label: string;
}> = {
  low: {
    bg:     "bg-[hsl(var(--status-resolved-bg))]",
    fg:     "text-[hsl(var(--status-resolved-fg))]",
    border: "border-[hsl(var(--status-resolved-border))]",
    bar:    "bg-primary",
    label:  "Looks Good",
  },
  elevated: {
    bg:     "bg-[hsl(var(--status-review-bg))]",
    fg:     "text-[hsl(var(--status-review-fg))]",
    border: "border-[hsl(var(--status-review-border))]",
    bar:    "bg-[hsl(43_96%_50%)]",
    label:  "Minor Note",
  },
  high: {
    bg:     "bg-orange-50",
    fg:     "text-orange-800",
    border: "border-orange-200",
    bar:    "bg-orange-500",
    label:  "Review Recommended",
  },
  critical: {
    bg:     "bg-red-50",
    fg:     "text-red-800",
    border: "border-red-200",
    bar:    "bg-red-500",
    label:  "Review Required",
  },
};

const fraudTypeLabels: Record<string, string> = {
  upcoding:        "Overcharge Detected",
  unbundling:      "Split Billing Detected",
  phantom_billing: "Unrendered Service",
  fee_deviation:   "Fee Above Guide",
  duplicate_claim: "Duplicate Charge",
};

export function FraudCaseCard({ fraudScore, flags }: FraudCaseCardProps) {
  if (!fraudScore) {
    return (
      <div className="bg-card rounded-lg border border-border p-5">
        <p className="text-sm font-medium text-foreground mb-1">Billing Review</p>
        <p className="text-sm text-muted-foreground">No analysis available</p>
      </div>
    );
  }

  const cfg   = levelConfig[fraudScore.level] ?? levelConfig.low;
  const score = Math.round(Number(fraudScore.score) || 0);

  return (
    <div className={cn("rounded-lg border p-5", cfg.bg, cfg.border)}>

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-base font-medium text-foreground">Billing Review</p>
        <span className={cn(
          "inline-flex items-center px-2 py-px text-[11px] font-medium rounded-sm border",
          cfg.fg, cfg.bg, cfg.border
        )}>
          {cfg.label}
        </span>
      </div>

      {/* Score */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className={cn("font-mono text-[2.5rem] font-medium leading-none tabular", cfg.fg)}>
            {score}
          </span>
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>
        {/* Progress bar — 4px, flat, no rounded-full */}
        <div className="w-full bg-white/60 rounded-sm h-1">
          <div
            className={cn("h-1 rounded-sm transition-all duration-500", cfg.bar)}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Score breakdown — 2x2 grid of micro-stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { label: "Fee Diff",     value: `${fraudScore.breakdown.fee_deviation}/40` },
          { label: "Billing",      value: `${fraudScore.breakdown.code_risk}/25` },
          { label: "Provider",     value: `${fraudScore.breakdown.provider_history}/25` },
          { label: "Repeat",       value: `${fraudScore.breakdown.pattern_bonus}/10` },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/50 rounded-sm px-3 py-2 border border-white/60">
            <p className="font-mono text-2xs text-muted-foreground uppercase tracking-wider mb-0.5">
              {stat.label}
            </p>
            <p className={cn("font-mono text-sm font-medium tabular", cfg.fg)}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Irregularities */}
      {flags.length > 0 && (
        <div>
          <p className="font-mono text-2xs uppercase tracking-[0.1em] text-muted-foreground mb-2">
            Irregularities ({flags.length})
          </p>
          <div className="space-y-2">
            {flags.map((flag, idx) => (
              <div key={idx} className="bg-white/60 rounded-lg border border-white/80 px-3 py-2.5">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={cn(
                    "text-[11px] font-medium px-2 py-px rounded-sm border",
                    "bg-[hsl(var(--status-review-bg))] text-[hsl(var(--status-review-fg))] border-[hsl(var(--status-review-border))]"
                  )}>
                    {fraudTypeLabels[flag.fraud_type] ?? flag.fraud_type}
                  </span>
                  <span className="font-mono text-2xs text-muted-foreground">
                    Code {flag.code}
                  </span>
                  {flag.deviation_pct !== null && (
                    <span className="font-mono text-2xs text-[hsl(var(--status-review-fg))] font-medium">
                      +{(flag.deviation_pct * 100).toFixed(1)}% above guide
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground">{flag.evidence}</p>
                <div className="flex gap-4 mt-1">
                  <span className="font-mono text-2xs text-muted-foreground tabular">
                    Billed ${flag.billed_fee.toFixed(2)}
                  </span>
                  {flag.suggested_fee !== null && (
                    <span className="font-mono text-2xs text-muted-foreground tabular">
                      Expected ${flag.suggested_fee.toFixed(2)}
                    </span>
                  )}
                  <span className="font-mono text-2xs text-muted-foreground">
                    {(flag.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
