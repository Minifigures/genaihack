"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KPICard } from "@/components/KPICard";
import { getClaims, getProviders } from "@/lib/api";
import type { PipelineResult, ProviderStats } from "@/lib/api";
import {
  FileSearch,
  AlertTriangle,
  Gauge,
  ShieldAlert,
  Upload,
  ArrowUpRight,
  FileX,
} from "lucide-react";

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
        setClaims(claimsData.claims || []);
        setProviders(providerData.providers || []);
      } catch {
        // API may not be running
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalFlags = claims.reduce(
    (sum, c) => sum + (c.fraud_flags?.length || 0),
    0
  );
  const avgScore =
    claims.length > 0
      ? claims.reduce((sum, c) => sum + (c.fraud_score?.score || 0), 0) /
        claims.length
      : 0;
  const highRiskProviders = providers.filter(
    (p) =>
      p.risk_tier === "confirmed_fraud" || p.risk_tier === "flagged_multiple"
  );

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-heading text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Healthcare billing fraud detection overview
          </p>
        </div>
        <Link href="/upload" className="btn-primary">
          <Upload className="w-4 h-4" />
          Upload Receipt
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-5">
              <div className="skeleton h-4 w-24 rounded mb-3" />
              <div className="skeleton h-8 w-16 rounded mb-2" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
            <KPICard
              title="Claims Analyzed"
              value={claims.length}
              subtitle="receipts processed"
              color="blue"
              icon={FileSearch}
            />
            <KPICard
              title="Fraud Flags"
              value={totalFlags}
              subtitle="across all claims"
              color="red"
              icon={AlertTriangle}
            />
            <KPICard
              title="Avg Fraud Score"
              value={avgScore > 0 ? avgScore.toFixed(1) : "--"}
              subtitle="out of 100"
              color="yellow"
              icon={Gauge}
            />
            <KPICard
              title="High Risk Providers"
              value={highRiskProviders.length}
              subtitle={`of ${providers.length} total`}
              color="red"
              icon={ShieldAlert}
            />
          </div>

          {/* Recent claims */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">
                Recent Claims
              </h2>
              <Link
                href="/cases"
                className="text-sm text-vigil-600 hover:text-vigil-700 font-medium inline-flex items-center gap-1"
              >
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {claims.length === 0 ? (
              <div className="p-12 text-center">
                <FileX className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">
                  No claims analyzed yet
                </p>
                <Link
                  href="/upload"
                  className="text-sm text-vigil-600 hover:text-vigil-700 font-medium mt-2 inline-block"
                >
                  Upload your first receipt
                </Link>
              </div>
            ) : (
              <>
                <div className="px-6 py-2.5 bg-slate-50/50 border-b border-slate-100 grid grid-cols-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  <span>Claim ID</span>
                  <span>Date</span>
                  <span>Risk Score</span>
                  <span className="text-right">Flags</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {claims.slice(0, 5).map((claim) => (
                    <div
                      key={claim.claim_id}
                      className="px-6 py-3.5 grid grid-cols-4 items-center hover:bg-slate-50/50 transition-colors"
                    >
                      <span className="text-sm font-medium text-slate-700 font-mono">
                        {claim.claim_id.slice(0, 12)}
                      </span>
                      <span className="text-sm text-slate-500">
                        {claim.timestamp
                          ? new Date(claim.timestamp).toLocaleDateString()
                          : "--"}
                      </span>
                      {claim.fraud_score && (
                        <span
                          className={`badge w-fit ${
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
                      <span className="text-sm text-slate-400 text-right">
                        {claim.fraud_flags?.length || 0} flags
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
