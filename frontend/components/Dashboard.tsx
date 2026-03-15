"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KPICard } from "@/components/KPICard";
import { getClaims, getProviders } from "@/lib/api";
import type { PipelineResult, ProviderStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
    (p) => p.risk_tier === "confirmed_fraud" || p.risk_tier === "flagged_multiple"
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Healthcare billing fraud detection overview
          </p>
        </div>
        <Link href="/upload">
          <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <Upload className="w-4 h-4" />
            Upload Receipt
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </Card>
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

          {/* Recent claims - data table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>Recent Claims</CardTitle>
              {claims.length > 0 && (
                <Link href="/cases">
                  <Button variant="ghost" size="sm" className="gap-1 text-emerald-700">
                    View all <ArrowUpRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {claims.length === 0 ? (
                <div className="p-12 text-center">
                  <FileX className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">No claims analyzed yet</p>
                  <Link
                    href="/upload"
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium mt-2 inline-block"
                  >
                    Upload your first receipt
                  </Link>
                </div>
              ) : (
                <>
                  <div className="px-6 py-2.5 bg-gray-50/50 border-y border-gray-100 grid grid-cols-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    <span>Claim ID</span>
                    <span>Date</span>
                    <span>Risk Score</span>
                    <span className="text-right">Flags</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {claims.slice(0, 5).map((claim) => (
                      <div
                        key={claim.claim_id}
                        className="px-6 py-3.5 grid grid-cols-4 items-center hover:bg-gray-50/50 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-700 font-mono">
                          {claim.claim_id.slice(0, 12).toUpperCase()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {claim.timestamp
                            ? new Date(claim.timestamp).toLocaleDateString()
                            : "--"}
                        </span>
                        <div>
                          {claim.fraud_score && (
                            <Badge
                              variant={
                                claim.fraud_score.level === "critical" || claim.fraud_score.level === "high"
                                  ? "destructive"
                                  : claim.fraud_score.level === "elevated"
                                  ? "outline"
                                  : "secondary"
                              }
                            >
                              {claim.fraud_score.score}/100
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground text-right">
                          {claim.fraud_flags?.length || 0} flags
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
