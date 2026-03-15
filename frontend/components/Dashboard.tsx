"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getClaims, getBenefits } from "@/lib/api";
import type { PipelineResult, BenefitsReport } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Upload, ArrowRight, ShieldAlert, TrendingUp, Sparkles } from "lucide-react";

// Category color map for benefits bars
const categoryColors: Record<string, string> = {
  dental:       "bg-primary",
  vision:       "bg-[hsl(221_83%_53%)]",
  paramedical:  "bg-[hsl(162_63%_41%)]",
  psychology:   "bg-[hsl(271_60%_52%)]",
  prescription: "bg-[hsl(25_90%_52%)]",
};

const fraudLevelColors: Record<string, { bar: string; badge: string; text: string }> = {
  low:      { bar: "bg-primary",      badge: "bg-[hsl(var(--status-resolved-bg))] text-[hsl(var(--status-resolved-fg))] border-[hsl(var(--status-resolved-border))]",   text: "text-[hsl(var(--status-resolved-fg))]"   },
  elevated: { bar: "bg-[hsl(43_96%_50%)]", badge: "bg-[hsl(var(--status-review-bg))] text-[hsl(var(--status-review-fg))] border-[hsl(var(--status-review-border))]", text: "text-[hsl(var(--status-review-fg))]" },
  high:     { bar: "bg-orange-500",   badge: "bg-orange-50 text-orange-800 border-orange-200",   text: "text-orange-800"   },
  critical: { bar: "bg-red-500",      badge: "bg-red-50 text-red-800 border-red-200",             text: "text-red-800"     },
};

export default function DashboardPage() {
  const [claims, setClaims] = useState<PipelineResult[]>([]);
  const [benefits, setBenefits] = useState<BenefitsReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [claimsResult, benefitsResult] = await Promise.allSettled([
        getClaims(),
        getBenefits("STU-001"),
      ]);
      if (claimsResult.status === "fulfilled") {
        setClaims(claimsResult.value.claims || []);
      }
      if (benefitsResult.status === "fulfilled") {
        setBenefits(benefitsResult.value);
      }
      setLoading(false);
    }
    load();
  }, []);

  // ── Derived fraud metrics ──────────────────────────────────────────────────
  const totalFlags = claims.reduce((n, c) => n + (c.fraud_flags?.length || 0), 0);
  const avgScore = claims.length > 0
    ? claims.reduce((n, c) => n + (c.fraud_score?.score || 0), 0) / claims.length
    : 0;
  const topScore = claims.reduce((max, c) => Math.max(max, c.fraud_score?.score || 0), 0);
  const topClaim = claims.find((c) => (c.fraud_score?.score || 0) === topScore);
  const topLevel = topClaim?.fraud_score?.level ?? "low";

  const totalOvercharge = claims.reduce((sum, c) => {
    return sum + (c.fraud_flags || []).reduce((s, f) => {
      if (f.suggested_fee !== null && f.billed_fee > f.suggested_fee) {
        return s + (f.billed_fee - f.suggested_fee);
      }
      return s;
    }, 0);
  }, 0);

  // Flag type breakdown
  const flagTypeCounts: Record<string, number> = {};
  claims.forEach((c) => {
    (c.fraud_flags || []).forEach((f) => {
      flagTypeCounts[f.fraud_type] = (flagTypeCounts[f.fraud_type] || 0) + 1;
    });
  });
  const flagTypes = Object.entries(flagTypeCounts).sort((a, b) => b[1] - a[1]);

  const fraudTypeLabels: Record<string, string> = {
    upcoding:        "Overcharge",
    unbundling:      "Split Billing",
    phantom_billing: "Phantom Charge",
    fee_deviation:   "Fee Deviation",
    duplicate_claim: "Duplicate",
  };

  // ── Derived benefits metrics ───────────────────────────────────────────────
  const totalUnused  = benefits?.total_unused ?? 0;
  const totalLimit   = benefits?.coverage_items.reduce((n, i) => n + i.annual_limit, 0) ?? 0;
  const totalUsed    = benefits?.coverage_items.reduce((n, i) => n + i.used_ytd, 0) ?? 0;
  const usagePct     = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

  // ── AI Summary ────────────────────────────────────────────────────────────
  const summaryParts: string[] = [];
  if (claims.length > 0) summaryParts.push(`${claims.length} claim${claims.length !== 1 ? "s" : ""} analyzed`);
  if (totalFlags > 0) summaryParts.push(`${totalFlags} irregularit${totalFlags !== 1 ? "ies" : "y"} flagged`);
  else if (claims.length > 0) summaryParts.push("no billing irregularities detected");
  if (totalOvercharge > 0) summaryParts.push(`~$${totalOvercharge.toFixed(0)} in potential overcharges`);
  if (totalUnused > 0) summaryParts.push(`$${totalUnused.toFixed(0)} in unused coverage remaining`);
  const summaryText = summaryParts.length > 0 ? summaryParts.join(" · ") : null;

  const levelCfg = fraudLevelColors[topLevel] ?? fraudLevelColors.low;

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-normal text-foreground leading-tight">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Healthcare billing fraud detection
          </p>
        </div>
        <Link href="/upload">
          <Button className="gap-2">
            <Upload className="w-4 h-4" />
            Submit Receipt
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-14 rounded-lg bg-muted animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-48 rounded-lg bg-muted animate-pulse" />
            <div className="h-48 rounded-lg bg-muted animate-pulse" />
          </div>
          <div className="h-36 rounded-lg bg-muted animate-pulse" />
        </div>
      ) : (
        <div className="space-y-4">

          {/* ── AI Summary Banner ── */}
          {summaryText && (
            <div className="bg-card rounded-lg border border-border px-4 py-3 flex items-start gap-3">
              <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">{summaryText}</p>
            </div>
          )}

          {/* ── Two-col cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Fraud Risk Card */}
            <div className="bg-card rounded-lg border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="font-mono text-2xs uppercase tracking-[0.1em] text-muted-foreground">
                    Fraud Risk
                  </p>
                </div>
                {claims.length > 0 && (
                  <span className={`inline-flex items-center px-2 py-px text-[11px] font-medium rounded-sm border ${levelCfg.badge}`}>
                    {topLevel === "critical" ? "Review Required"
                      : topLevel === "high" ? "Review Recommended"
                      : topLevel === "elevated" ? "Minor Note"
                      : "Looks Good"}
                  </span>
                )}
              </div>

              {claims.length === 0 ? (
                <div className="py-4">
                  <p className="font-mono text-[2.5rem] font-medium leading-none tabular text-muted-foreground/30 mb-3">—</p>
                  <p className="text-sm text-muted-foreground mb-3">No claims analyzed yet</p>
                  <Link href="/upload">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      Submit a receipt
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  {/* Score */}
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className={`font-mono text-[2.5rem] font-medium leading-none tabular ${levelCfg.text}`}>
                      {Math.round(topScore)}
                    </span>
                    <span className="text-sm text-muted-foreground">/100</span>
                    {claims.length > 1 && (
                      <span className="font-mono text-xs text-muted-foreground ml-2">
                        avg {avgScore.toFixed(0)}
                      </span>
                    )}
                  </div>

                  {/* Score bar */}
                  <div className="w-full bg-muted rounded-sm h-1 mb-4">
                    <div
                      className={`h-1 rounded-sm transition-all duration-700 ${levelCfg.bar}`}
                      style={{ width: `${topScore}%` }}
                    />
                  </div>

                  {/* Flag stats */}
                  <div className="flex items-center gap-4 mb-4">
                    <div>
                      <p className="font-mono text-[1.25rem] font-medium tabular text-foreground leading-none">
                        {totalFlags}
                      </p>
                      <p className="font-mono text-2xs text-muted-foreground mt-0.5">
                        {totalFlags === 1 ? "irregularity" : "irregularities"}
                      </p>
                    </div>
                    {totalOvercharge > 0 && (
                      <>
                        <div className="w-px h-8 bg-border" />
                        <div>
                          <p className="font-mono text-[1.25rem] font-medium tabular text-[hsl(var(--status-review-fg))] leading-none">
                            ${totalOvercharge.toFixed(0)}
                          </p>
                          <p className="font-mono text-2xs text-muted-foreground mt-0.5">est. overcharge</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Flag type breakdown */}
                  {flagTypes.length > 0 && (
                    <div className="space-y-1.5 border-t border-border pt-3">
                      {flagTypes.map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">
                            {fraudTypeLabels[type] ?? type}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted rounded-sm h-0.5">
                              <div
                                className="h-0.5 rounded-sm bg-[hsl(var(--status-review-fg))]"
                                style={{ width: `${(count / totalFlags) * 100}%` }}
                              />
                            </div>
                            <span className="font-mono text-2xs text-muted-foreground w-3 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Benefits Utilization Card */}
            <div className="bg-card rounded-lg border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="font-mono text-2xs uppercase tracking-[0.1em] text-muted-foreground">
                  Coverage Utilization
                </p>
              </div>

              {!benefits ? (
                <div className="py-4">
                  <p className="font-mono text-[2.5rem] font-medium leading-none tabular text-muted-foreground/30 mb-3">—</p>
                  <p className="text-sm text-muted-foreground">Benefits data unavailable</p>
                </div>
              ) : (
                <>
                  {/* Unused total */}
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="font-mono text-[2.5rem] font-medium leading-none tabular text-[hsl(var(--status-resolved-fg))]">
                      ${totalUnused > 0 ? totalUnused.toFixed(0) : "0"}
                    </span>
                    <span className="text-sm text-muted-foreground">unused</span>
                  </div>

                  {/* Overall bar */}
                  <div className="w-full bg-muted rounded-sm h-1 mb-1">
                    <div
                      className="h-1 rounded-sm bg-primary transition-all duration-700"
                      style={{ width: `${Math.min(100, usagePct)}%` }}
                    />
                  </div>
                  <p className="font-mono text-2xs text-muted-foreground mb-4">
                    {usagePct.toFixed(0)}% used · ${totalUsed.toFixed(0)} of ${totalLimit.toFixed(0)} annual
                  </p>

                  {/* Per-category breakdown */}
                  {benefits.coverage_items.length > 0 && (
                    <div className="space-y-2.5 border-t border-border pt-3">
                      {benefits.coverage_items.map((item) => {
                        const pct = item.annual_limit > 0
                          ? (item.used_ytd / item.annual_limit) * 100 : 0;
                        const barColor = categoryColors[item.category] ?? "bg-muted-foreground";
                        return (
                          <div key={item.category}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground capitalize">
                                {item.category}
                              </span>
                              <span className="font-mono text-2xs text-muted-foreground tabular">
                                ${item.remaining.toFixed(0)} left
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-sm h-0.5">
                              <div
                                className={`h-0.5 rounded-sm transition-all duration-500 ${barColor}`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Recent Claims ── */}
          <div className="bg-card rounded-lg border border-border">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <p className="text-sm font-medium text-foreground">Recent Claims</p>
              {claims.length > 0 && (
                <Link href="/cases">
                  <button className="font-mono text-xs text-primary hover:opacity-70 transition-opacity flex items-center gap-1">
                    View all <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              )}
            </div>

            {claims.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-muted-foreground">No receipts submitted yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {claims.slice(0, 5).map((claim) => {
                  const score = claim.fraud_score?.score ?? 0;
                  const level = claim.fraud_score?.level ?? "low";
                  const cfg = fraudLevelColors[level] ?? fraudLevelColors.low;
                  const flagCount = claim.fraud_flags?.length || 0;
                  return (
                    <Link key={claim.claim_id} href="/cases">
                      <div className="px-5 py-3 flex items-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="w-0.5 h-8 rounded-full bg-muted shrink-0 overflow-hidden">
                          <div
                            className={`w-full rounded-full ${cfg.bar} transition-all duration-500`}
                            style={{ height: `${score}%`, marginTop: `${100 - score}%` }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs font-medium text-foreground">
                            {claim.claim_id ? claim.claim_id.slice(0, 8).toUpperCase() : "—"}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {claim.timestamp
                              ? new Date(claim.timestamp).toLocaleDateString("en-CA", {
                                  year: "numeric", month: "short", day: "numeric",
                                })
                              : "—"}
                          </p>
                        </div>
                        <div className="w-20 hidden sm:block">
                          <div className="w-full bg-muted rounded-sm h-0.5">
                            <div className={`h-0.5 rounded-sm ${cfg.bar}`} style={{ width: `${score}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {claim.fraud_score && (
                            <span className={`font-mono text-xs font-medium px-2 py-px rounded-sm border ${cfg.badge}`}>
                              {Math.round(score)}/100
                            </span>
                          )}
                          <span className="font-mono text-xs text-muted-foreground">
                            {flagCount} {flagCount === 1 ? "flag" : "flags"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
