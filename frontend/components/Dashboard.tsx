"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KPICard } from "@/components/KPICard";
import { getClaims, getProviders, getBenefits } from "@/lib/api";
import type { PipelineResult, ProviderStats, BenefitsReport } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FileSearch,
  AlertTriangle,
  Heart,
  DollarSign,
  Upload,
  ArrowUpRight,
  FileX,
  Bell,
  MapPin,
  Sparkles,
} from "lucide-react";

export default function DashboardPage() {
  const [claims, setClaims] = useState<PipelineResult[]>([]);
  const [providers, setProviders] = useState<ProviderStats[]>([]);
  const [benefits, setBenefits] = useState<BenefitsReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [claimsData, providerData, benefitsData] = await Promise.all([
          getClaims(),
          getProviders(),
          getBenefits("STU-001"),
        ]);
        setClaims(claimsData.claims || []);
        setProviders(providerData.providers || []);
        setBenefits(benefitsData);
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

  // Calculate total savings identified from overcharges
  const totalSavings = claims.reduce((sum, c) => {
    if (!c.fraud_flags) return sum;
    return sum + c.fraud_flags.reduce((flagSum, f) => {
      if (f.suggested_fee !== null && f.billed_fee > f.suggested_fee) {
        return flagSum + (f.billed_fee - f.suggested_fee);
      }
      return flagSum;
    }, 0);
  }, 0);

  // Build benefit alerts
  const benefitAlerts: Array<{ message: string; type: "warning" | "info" | "success" }> = [];
  if (benefits) {
    benefits.coverage_items.forEach((item) => {
      const usagePct = item.annual_limit > 0 ? (item.used_ytd / item.annual_limit) * 100 : 0;
      if (usagePct < 30 && item.remaining > 100) {
        benefitAlerts.push({
          message: `$${item.remaining.toFixed(0)} unused ${item.category} coverage. Book before your plan year ends!`,
          type: "warning",
        });
      }
    });
    if (benefits.total_unused > 500) {
      benefitAlerts.push({
        message: `You have $${benefits.total_unused.toFixed(0)} in total unused benefits. Don't leave money on the table!`,
        type: "info",
      });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Health Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your benefits, claims, and coverage at a glance
          </p>
        </div>
        <Link href="/upload">
          <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <Upload className="w-4 h-4" />
            Submit Receipt
          </Button>
        </Link>
      </div>

      {/* Benefit alerts */}
      {benefitAlerts.length > 0 && (
        <div className="space-y-2 mb-6">
          {benefitAlerts.slice(0, 3).map((alert, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                alert.type === "warning"
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              }`}
            >
              <Bell className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{alert.message}</p>
              <Link href="/benefits" className="ml-auto text-xs font-medium underline whitespace-nowrap">
                View benefits
              </Link>
            </div>
          ))}
        </div>
      )}

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
          {/* Student-focused KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
            <KPICard
              title="Unused Benefits"
              value={benefits ? `$${benefits.total_unused.toFixed(0)}` : "--"}
              subtitle="remaining this year"
              color="green"
              icon={DollarSign}
            />
            <KPICard
              title="Receipts Submitted"
              value={claims.length}
              subtitle="claims processed"
              color="blue"
              icon={FileSearch}
            />
            <KPICard
              title="Overcharges Found"
              value={totalSavings > 0 ? `$${totalSavings.toFixed(0)}` : "--"}
              subtitle={`${totalFlags} fraud flags detected`}
              color="red"
              icon={AlertTriangle}
            />
            <KPICard
              title="Coverage Categories"
              value={benefits?.coverage_items.length || 0}
              subtitle="benefit types available"
              color="yellow"
              icon={Heart}
            />
          </div>

          {/* Benefits overview + Quick actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Benefits summary */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-emerald-600" />
                  Your Benefits
                </CardTitle>
                <Link href="/benefits">
                  <Button variant="ghost" size="sm" className="gap-1 text-emerald-700">
                    Details <ArrowUpRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {benefits ? (
                  <div className="space-y-4">
                    {benefits.coverage_items.map((item) => {
                      const usagePct = item.annual_limit > 0
                        ? Math.round((item.used_ytd / item.annual_limit) * 100)
                        : 0;
                      return (
                        <div key={item.category}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-sm font-medium capitalize">{item.category}</span>
                            <span className="text-xs text-muted-foreground">
                              ${item.used_ytd.toFixed(0)} / ${item.annual_limit.toFixed(0)}
                            </span>
                          </div>
                          <Progress value={usagePct} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            ${item.remaining.toFixed(0)} remaining
                            {item.recommendation && (
                              <span className="text-emerald-600 ml-2">{item.recommendation}</span>
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No benefits data available</p>
                )}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/upload" className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <Upload className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Submit a Receipt</p>
                      <p className="text-xs text-muted-foreground">Get instant fraud analysis</p>
                    </div>
                  </div>
                </Link>
                <Link href="/benefits" className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Heart className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Check My Benefits</p>
                      <p className="text-xs text-muted-foreground">See your coverage status</p>
                    </div>
                  </div>
                </Link>
                <Link href="/clinics" className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Find a Clinic</p>
                      <p className="text-xs text-muted-foreground">OHIP/UHIP eligible providers</p>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent claims table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>Recent Submissions</CardTitle>
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
                  <p className="text-muted-foreground font-medium">No receipts submitted yet</p>
                  <Link
                    href="/upload"
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium mt-2 inline-block"
                  >
                    Submit your first receipt
                  </Link>
                </div>
              ) : (
                <>
                  <div className="px-6 py-2.5 bg-gray-50/50 border-y border-gray-100 grid grid-cols-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    <span>Claim ID</span>
                    <span>Date</span>
                    <span>Status</span>
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
                              {claim.fraud_score.level === "low" ? "Verified" : claim.fraud_score.level.toUpperCase()}
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
