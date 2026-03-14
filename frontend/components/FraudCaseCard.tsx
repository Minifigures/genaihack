"use client";

import type { FraudScore, FraudFlag } from "@/lib/api";

interface FraudCaseCardProps {
  fraudScore: FraudScore | null;
  flags: FraudFlag[];
}

const levelColors: Record<string, { bg: string; text: string; bar: string }> = {
  low: { bg: "bg-green-50", text: "text-green-700", bar: "bg-green-500" },
  elevated: { bg: "bg-yellow-50", text: "text-yellow-700", bar: "bg-yellow-500" },
  high: { bg: "bg-orange-50", text: "text-orange-700", bar: "bg-orange-500" },
  critical: { bg: "bg-red-50", text: "text-red-700", bar: "bg-red-500" },
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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Fraud Analysis</h3>
        <p className="text-sm text-gray-500">No fraud analysis available</p>
      </div>
    );
  }

  const colors = levelColors[fraudScore.level] || levelColors.low;

  return (
    <div className={`rounded-lg border p-6 ${colors.bg}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Fraud Risk Score</h3>
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${colors.text} ${colors.bg} border`}>
          {fraudScore.level.toUpperCase()}
        </span>
      </div>

      {/* Score bar */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-2">
          <span className={`text-4xl font-bold ${colors.text}`}>{fraudScore.score}</span>
          <span className="text-gray-500 text-sm">/ 100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`${colors.bar} h-3 rounded-full transition-all duration-500`}
            style={{ width: `${fraudScore.score}%` }}
          />
        </div>
      </div>

      {/* Score breakdown */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white bg-opacity-60 rounded p-3">
          <p className="text-xs text-gray-500">Fee Deviation</p>
          <p className="text-lg font-semibold">{fraudScore.breakdown.fee_deviation}/40</p>
        </div>
        <div className="bg-white bg-opacity-60 rounded p-3">
          <p className="text-xs text-gray-500">Code Risk</p>
          <p className="text-lg font-semibold">{fraudScore.breakdown.code_risk}/25</p>
        </div>
        <div className="bg-white bg-opacity-60 rounded p-3">
          <p className="text-xs text-gray-500">Provider History</p>
          <p className="text-lg font-semibold">{fraudScore.breakdown.provider_history}/25</p>
        </div>
        <div className="bg-white bg-opacity-60 rounded p-3">
          <p className="text-xs text-gray-500">Pattern Bonus</p>
          <p className="text-lg font-semibold">{fraudScore.breakdown.pattern_bonus}/10</p>
        </div>
      </div>

      {/* Fraud flags */}
      {flags.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Fraud Flags ({flags.length})
          </h4>
          <div className="space-y-2">
            {flags.map((flag, idx) => (
              <div key={idx} className="bg-white bg-opacity-70 rounded p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 bg-red-100 text-red-700 rounded">
                    {fraudTypeLabels[flag.fraud_type] || flag.fraud_type}
                  </span>
                  <span className="text-xs text-gray-500">Code: {flag.code}</span>
                  {flag.deviation_pct !== null && (
                    <span className="text-xs text-red-600 font-medium">
                      +{(flag.deviation_pct * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700">{flag.evidence}</p>
                <div className="flex gap-4 mt-1 text-xs text-gray-500">
                  <span>Billed: ${flag.billed_fee.toFixed(2)}</span>
                  {flag.suggested_fee !== null && (
                    <span>ODA Guide: ${flag.suggested_fee.toFixed(2)}</span>
                  )}
                  <span>Confidence: {(flag.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
