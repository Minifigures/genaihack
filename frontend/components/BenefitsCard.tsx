"use client";

import type { BenefitsReport } from "@/lib/api";

interface BenefitsCardProps {
  report: BenefitsReport | null;
}

const categoryColors: Record<string, string> = {
  dental: "bg-blue-500",
  vision: "bg-purple-500",
  paramedical: "bg-green-500",
  psychology: "bg-pink-500",
  prescription: "bg-orange-500",
};

export function BenefitsCard({ report }: BenefitsCardProps) {
  if (!report) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Benefits Summary</h3>
        <p className="text-sm text-gray-500">No benefits data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Benefits Summary</h3>
        <span className="text-xs text-gray-500">{report.plan_type}</span>
      </div>

      <div className="bg-vigil-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-vigil-700">Total Unused Coverage</p>
        <p className="text-3xl font-bold text-vigil-800">${report.total_unused.toFixed(2)}</p>
        {report.savings_from_fraud_flag !== null && report.savings_from_fraud_flag > 0 && (
          <p className="text-sm text-orange-600 mt-1">
            + ${report.savings_from_fraud_flag.toFixed(2)} potential savings from fraud flags
          </p>
        )}
      </div>

      <div className="space-y-4">
        {report.coverage_items.map((item) => {
          const usagePct = item.annual_limit > 0 ? (item.used_ytd / item.annual_limit) * 100 : 0;

          return (
            <div key={item.category}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {item.category}
                </span>
                <span className="text-sm text-gray-500">
                  ${item.used_ytd.toFixed(0)} / ${item.annual_limit.toFixed(0)}
                  <span className="ml-1 text-xs">
                    ({item.coverage_pct * 100}% covered)
                  </span>
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`${categoryColors[item.category] || "bg-gray-500"} h-2.5 rounded-full transition-all`}
                  style={{ width: `${Math.min(100, usagePct)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">
                  ${item.remaining.toFixed(0)} remaining
                </span>
              </div>
              {item.recommendation && (
                <p className="text-xs text-vigil-600 mt-1 bg-vigil-50 rounded px-2 py-1">
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
