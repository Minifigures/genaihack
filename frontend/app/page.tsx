"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KPICard } from "@/components/KPICard";
import { getClaims, getProviders } from "@/lib/api";
import type { PipelineResult, ProviderStats } from "@/lib/api";

export default function DashboardPage() {
  const [claims, setClaims] = useState<PipelineResult[]>([]);
  const [providers, setProviders] = useState<ProviderStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [claimsData, providerData] = await Promise.all([
          getClaims(),
          getProviders(),
        ]);
        setClaims(claimsData.claims);
        setProviders(providerData.providers);
      } catch {
        // API may not be running
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalFlags = claims.reduce((sum, c) => sum + (c.fraud_flags?.length || 0), 0);
  const avgScore = claims.length > 0
    ? claims.reduce((sum, c) => sum + (c.fraud_score?.score || 0), 0) / claims.length
    : 0;
  const highRiskProviders = providers.filter(
    (p) => p.risk_tier === "confirmed_fraud" || p.risk_tier === "flagged_multiple"
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">VIGIL Dashboard</h1>
          <p className="text-gray-500 mt-1">Healthcare billing fraud detection system</p>
        </div>
        <Link
          href="/upload"
          className="bg-vigil-600 text-white px-6 py-2.5 rounded-lg hover:bg-vigil-700 transition-colors font-medium"
        >
          Upload Receipt
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <KPICard
              title="Claims Analyzed"
              value={claims.length}
              subtitle="receipts processed"
              color="blue"
            />
            <KPICard
              title="Fraud Flags"
              value={totalFlags}
              subtitle="across all claims"
              color="red"
            />
            <KPICard
              title="Avg Fraud Score"
              value={avgScore > 0 ? avgScore.toFixed(1) : "--"}
              subtitle="out of 100"
              color="yellow"
            />
            <KPICard
              title="High Risk Providers"
              value={highRiskProviders.length}
              subtitle={`of ${providers.length} total`}
              color="red"
            />
          </div>

          {/* Recent claims */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Recent Claims</h2>
            </div>
            {claims.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">No claims analyzed yet</p>
                <Link
                  href="/upload"
                  className="text-vigil-600 hover:text-vigil-700 font-medium"
                >
                  Upload your first receipt
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {claims.slice(0, 5).map((claim) => (
                  <div key={claim.claim_id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Claim {claim.claim_id.slice(0, 8)}...
                      </p>
                      <p className="text-xs text-gray-500">{claim.timestamp}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {claim.fraud_score && (
                        <span
                          className={`text-sm font-medium px-2 py-1 rounded ${
                            claim.fraud_score.level === "critical"
                              ? "bg-red-100 text-red-700"
                              : claim.fraud_score.level === "high"
                              ? "bg-orange-100 text-orange-700"
                              : claim.fraud_score.level === "elevated"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {claim.fraud_score.score}/100
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {claim.fraud_flags?.length || 0} flags
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
