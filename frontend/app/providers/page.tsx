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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Provider Risk Dashboard</h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((provider) => (
            <div key={provider.provider_id} className="bg-white rounded-lg border border-gray-200 p-6">
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
                  <p className="text-xs text-gray-500">Total Claims</p>
                  <p className="text-lg font-semibold">{provider.total_claims}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Flagged</p>
                  <p className="text-lg font-semibold text-red-600">{provider.flagged_claims}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avg Deviation</p>
                  <p className="text-lg font-semibold">
                    {(provider.avg_fee_deviation * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              {provider.common_fraud_types.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {provider.common_fraud_types.map((type) => (
                    <span key={type} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">
                      {type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
