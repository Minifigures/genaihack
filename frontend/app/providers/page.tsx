"use client";

import { useEffect, useState } from "react";
import { getProviders } from "@/lib/api";
import type { ProviderStats } from "@/lib/api";

const tierStyles: Record<string, string> = {
  clean: "bg-green-100 text-green-700",
  flagged_once: "bg-yellow-100 text-yellow-700",
  flagged_multiple: "bg-orange-100 text-orange-700",
  confirmed_fraud: "bg-red-100 text-red-700",
};

const tierLabels: Record<string, string> = {
  clean: "Clean",
  flagged_once: "Flagged Once",
  flagged_multiple: "Flagged Multiple",
  confirmed_fraud: "Confirmed Fraud",
};

function computeGrade(avgDeviation: number, flaggedClaims: number): { grade: string; color: string; bgColor: string } {
  const devPct = avgDeviation * 100;

  if (devPct < 10 && flaggedClaims === 0) {
    return { grade: "A+", color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200" };
  }
  if (devPct < 15 && flaggedClaims === 0) {
    return { grade: "A", color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200" };
  }
  if (devPct < 25 && flaggedClaims <= 1) {
    return { grade: "B", color: "text-green-700", bgColor: "bg-green-50 border-green-200" };
  }
  if (devPct < 40 && flaggedClaims <= 2) {
    return { grade: "C", color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200" };
  }
  if (devPct < 60 && flaggedClaims <= 3) {
    return { grade: "D", color: "text-red-600", bgColor: "bg-red-50 border-red-200" };
  }
  return { grade: "F", color: "text-red-700", bgColor: "bg-red-100 border-red-300" };
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<ProviderStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getProviders();
        setProviders(data.providers);
      } catch {
        // API may not be running
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Provider Risk Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">
        Report cards based on billing patterns, fee guide adherence, and fraud flag history.
      </p>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {providers.map((provider) => {
            const { grade, color, bgColor } = computeGrade(
              provider.avg_fee_deviation,
              provider.flagged_claims
            );

            return (
              <div
                key={provider.provider_id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="flex">
                  {/* Grade badge */}
                  <div className={`flex flex-col items-center justify-center w-24 shrink-0 border-r ${bgColor}`}>
                    <span className={`text-3xl font-black ${color}`}>{grade}</span>
                    <span className="text-[10px] font-medium text-gray-500 mt-0.5 uppercase tracking-wider">
                      Grade
                    </span>
                  </div>

                  {/* Provider info */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800">
                          {provider.provider_name}
                        </h3>
                        <p className="text-xs text-gray-500">{provider.address}</p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          tierStyles[provider.risk_tier] || tierStyles.clean
                        }`}
                      >
                        {tierLabels[provider.risk_tier] || provider.risk_tier}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Claims Analysed</p>
                        <p className="text-lg font-semibold">{provider.total_claims}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Fraud Flags</p>
                        <p className={`text-lg font-semibold ${provider.flagged_claims > 0 ? "text-red-600" : "text-gray-900"}`}>
                          {provider.flagged_claims}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Avg Deviation</p>
                        <p className="text-lg font-semibold">
                          {(provider.avg_fee_deviation * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    {/* Community intelligence badge */}
                    {(provider.flagged_by_students ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5 mb-2 px-2.5 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
                        <svg className="w-3.5 h-3.5 text-orange-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-medium text-orange-700">
                          {provider.flagged_by_students} other students have flagged this provider for similar billing patterns
                        </span>
                      </div>
                    )}

                    {provider.common_fraud_types.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {provider.common_fraud_types.map((type) => (
                          <span key={type} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">
                            {type.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
