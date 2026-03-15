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
import { Upload, ArrowRight } from "lucide-react";

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
          <h1 className="text-2xl font-bold text-gray-900">VIGIL Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Healthcare billing fraud detection system
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Claims</CardTitle>
              {claims.length > 0 && (
                <Link href="/cases">
                  <Button variant="ghost" size="sm" className="gap-1 text-emerald-700">
                    View all <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {claims.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">No claims analyzed yet</p>
                  <Link href="/upload">
                    <Button variant="outline" className="gap-2">
                      <Upload className="w-4 h-4" />
                      Upload your first receipt
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {claims.slice(0, 5).map((claim) => (
                    <div key={claim.claim_id} className="py-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          Claim <span className="font-mono">{claim.claim_id.slice(0, 8).toUpperCase()}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {claim.timestamp ? new Date(claim.timestamp).toLocaleDateString() : "--"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {claim.fraud_score && (
                          <Badge
                            variant={
                              claim.fraud_score.level === "critical" || claim.fraud_score.level === "high"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {claim.fraud_score.score}/100
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {claim.fraud_flags?.length || 0} flags
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
