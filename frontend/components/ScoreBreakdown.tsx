"use client";

import type { ScoreBreakdown as ScoreBreakdownType } from "@/lib/api";

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdownType;
}

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  const components = [
    { label: "Fee Deviation", value: breakdown.fee_deviation, max: 40, color: "bg-red-500" },
    { label: "Code Risk", value: breakdown.code_risk, max: 25, color: "bg-orange-500" },
    { label: "Provider History", value: breakdown.provider_history, max: 25, color: "bg-yellow-500" },
    { label: "Pattern Bonus", value: breakdown.pattern_bonus, max: 10, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-3">
      {components.map((comp) => (
        <div key={comp.label}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{comp.label}</span>
            <span className="font-medium">
              {comp.value} / {comp.max}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${comp.color} h-2 rounded-full transition-all`}
              style={{ width: `${(comp.value / comp.max) * 100}%` }}
            />
          </div>
        </div>
      ))}
      <div className="pt-2 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Confidence Adjustment</span>
          <span className="font-medium">{breakdown.confidence_adj}</span>
        </div>
      </div>
    </div>
  );
}
