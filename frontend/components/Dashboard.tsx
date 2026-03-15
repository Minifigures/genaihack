"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KPICard } from "@/components/KPICard";
import { getClaims, getProviders, getBenefits } from "@/lib/api";
import type { PipelineResult, ProviderStats, BenefitsReport } from "@/lib/api";
import {
  FileSearch,
  AlertTriangle,
  Gauge,
  ShieldAlert,
  Upload,
  ArrowUpRight,
  FileX,
  Heart,
  Activity,
} from "lucide-react";

export default function DashboardPage() {
  const [claims, setClaims] = useState<PipelineResult[]>([]);
  const [providers, setProviders] = useState<ProviderStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [claimsResult, providersResult] = await Promise.allSettled([
        getClaims(),
        getProviders(),
      ]);
      if (claimsResult.status === "fulfilled") {
        setClaims(claimsResult.value.claims || []);
      }
      if (providersResult.status === "fulfilled") {
        setProviders(providersResult.value.providers || []);
      }
      setLoading(false);
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
        <div className="space-y-4">
          <div className="h-14 rounded-lg bg-muted animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-48 rounded-lg bg-muted animate-pulse" />
            <div className="h-48 rounded-lg bg-muted animate-pulse" />
          </div>
          <div className="h-36 rounded-lg bg-muted animate-pulse" />
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
              delay={0}
            />
            <KPICard
              title="Fraud Flags"
              value={totalFlags}
              subtitle="across all claims"
              color="red"
              icon={AlertTriangle}
              delay={0.1}
            />
            <KPICard
              title="Wellness Score"
              value={claims.length > 0 ? 72 : "--"}
              subtitle="health readiness"
              color="green"
              icon={Heart}
              delay={0.2}
            />
            <KPICard
              title="Preventive Care"
              value={claims.length > 0 ? "On Track" : "--"}
              subtitle="next exam in 30 days"
              color="green"
              icon={Activity}
              delay={0.3}
            />
          </div>

          {/* Health Insights Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Link href="/health" className="group card p-5 border-l-4 border-l-emerald-500 hover:shadow-elevated transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Your Health Dashboard</p>
                  <p className="text-xs text-slate-500 mt-1">
                    View your treatment timeline, preventive care status, and wellness recommendations
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </Link>
            <div className="card p-5 border-l-4 border-l-purple-500">
              <p className="text-sm font-semibold text-slate-800">Mental Health Coverage</p>
              <p className="text-xs text-slate-500 mt-1">
                Your plan covers 100% of psychology services. 1 in 3 students benefit from regular counselling sessions.
              </p>
            </div>
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
