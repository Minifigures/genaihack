"use client";

import type { FraudScore, FraudFlag } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { ShieldAlert, AlertTriangle } from "lucide-react";

interface FraudCaseCardProps {
  fraudScore: FraudScore | null;
  flags: FraudFlag[];
}

const levelConfig: Record<string, { color: string; gaugeColor: string; label: string; variant: "destructive" | "secondary" | "outline" }> = {
  low: { color: "text-emerald-700", gaugeColor: "#22c55e", label: "LOW RISK", variant: "secondary" },
  elevated: { color: "text-amber-700", gaugeColor: "#f59e0b", label: "ELEVATED", variant: "outline" },
  high: { color: "text-orange-700", gaugeColor: "#f97316", label: "HIGH RISK", variant: "destructive" },
  critical: { color: "text-red-700", gaugeColor: "#ef4444", label: "CRITICAL", variant: "destructive" },
};

const fraudTypeLabels: Record<string, string> = {
  upcoding: "Upcoding",
  unbundling: "Unbundling",
  phantom_billing: "Phantom Billing",
  fee_deviation: "Fee Deviation",
  duplicate_claim: "Duplicate Claim",
};

export function FraudCaseCard({ fraudScore, flags }: FraudCaseCardProps) {
  if (!fraudScore) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Fraud Analysis</h3>
          <p className="text-sm text-muted-foreground">No fraud analysis available</p>
        </CardContent>
      </Card>
    );
  }

  const config = levelConfig[fraudScore.level] || levelConfig.low;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            Fraud Analysis
          </CardTitle>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Gauge + Score */}
        <div className="flex items-center gap-6 mb-6">
          <AnimatedCircularProgressBar
            value={fraudScore.score}
            max={100}
            min={0}
            gaugePrimaryColor={config.gaugeColor}
            gaugeSecondaryColor="#e5e7eb"
            className="size-28 text-xl"
          />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-3">Score Breakdown</p>
            <div className="space-y-2">
              <BreakdownBar label="Fee Deviation" value={fraudScore.breakdown.fee_deviation} max={40} />
              <BreakdownBar label="Code Risk" value={fraudScore.breakdown.code_risk} max={25} />
              <BreakdownBar label="Provider History" value={fraudScore.breakdown.provider_history} max={25} />
              <BreakdownBar label="Pattern Bonus" value={fraudScore.breakdown.pattern_bonus} max={10} />
            </div>
          </div>
        </div>

        {/* Fraud flags with comparison bars */}
        {flags.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Fraud Flags ({flags.length})
            </h4>
            <div className="space-y-3">
              {flags.map((flag, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 text-xs">
                      {fraudTypeLabels[flag.fraud_type] || flag.fraud_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Code: {flag.code}</span>
                    {flag.deviation_pct !== null && (
                      <Badge variant="destructive" className="text-[10px] h-5">
                        +{(flag.deviation_pct * 100).toFixed(0)}% overcharge
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 mb-2">{flag.evidence}</p>

                  {/* What You Paid vs What You Should Have Paid */}
                  {flag.suggested_fee !== null && flag.suggested_fee > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>ODA Guide: ${flag.suggested_fee.toFixed(2)}</span>
                        <span>Billed: ${flag.billed_fee.toFixed(2)}</span>
                      </div>
                      <div className="flex h-5 rounded-full overflow-hidden bg-gray-200">
                        <div
                          className="bg-emerald-500 flex items-center justify-center"
                          style={{ width: `${Math.min(100, (flag.suggested_fee / flag.billed_fee) * 100)}%` }}
                        >
                          <span className="text-[9px] text-white font-medium">Fair</span>
                        </div>
                        <div
                          className="bg-red-400 flex items-center justify-center"
                          style={{ width: `${Math.max(0, 100 - (flag.suggested_fee / flag.billed_fee) * 100)}%` }}
                        >
                          <span className="text-[9px] text-white font-medium">
                            +${(flag.billed_fee - flag.suggested_fee).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Confidence: {(flag.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BreakdownBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full">
        <div
          className={`h-1.5 rounded-full transition-all duration-700 ${
            pct > 70 ? "bg-red-500" : pct > 40 ? "bg-amber-500" : "bg-emerald-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
