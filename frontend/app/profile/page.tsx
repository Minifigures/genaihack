"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCases, getProviders } from "@/lib/api";
import type { User } from "@supabase/supabase-js";
import type { ProviderStats } from "@/lib/api";
import { KPICard } from "@/components/KPICard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogOut, ScrollText, Mail, User as UserIcon, Calendar } from "lucide-react";
import Link from "next/link";

interface CaseRow {
  case_id: string;
  fraud_score: number;
  flags: Array<unknown>;
  status: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [providers, setProviders] = useState<ProviderStats[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      try {
        const [casesData, providerData] = await Promise.all([
          getCases(),
          getProviders(),
        ]);
        setCases((casesData.cases || []) as unknown as CaseRow[]);
        setProviders(providerData.providers || []);
      } catch {
        // API may not be running
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "ST";
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-CA", { year: "numeric", month: "long" })
    : null;

  const totalFlags = cases.reduce(
    (n, c) => n + (Array.isArray(c.flags) ? c.flags.length : 0), 0
  );
  const avgScore = cases.length > 0
    ? cases.reduce((n, c) => n + (c.fraud_score || 0), 0) / cases.length
    : 0;
  const highRiskProviders = providers.filter(
    (p) => p.risk_tier === "confirmed_fraud" || p.risk_tier === "flagged_multiple"
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-normal text-foreground leading-tight">
          Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Your account and activity
        </p>
      </div>

      {/* Account card */}
      <Card className="mb-4">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-4 mb-5">
            {/* Square monogram — 4px radius */}
            <div className="w-12 h-12 rounded-sm bg-muted border border-border flex items-center justify-center shrink-0">
              <span className="font-mono text-base font-semibold text-muted-foreground">
                {initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.email ?? "—"}
              </p>
              <p className="font-mono text-xs text-muted-foreground mt-0.5">
                Student · STU-001
              </p>
            </div>
            <Badge variant="resolved">Active</Badge>
          </div>

          <div className="space-y-2.5 text-sm border-t border-border pt-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span>{user?.email ?? "—"}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <UserIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Student ID: STU-001</span>
            </div>
            {memberSince && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>Member since {memberSince}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2.5 mt-0.5 border-t border-border">
              <span className="text-muted-foreground">Student Health Plan · 2025–2026</span>
              <Link href="/benefits" className="text-xs text-primary hover:opacity-80 transition-opacity">
                View My Plan →
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats — same shape as dashboard KPIs, 2-col grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <KPICard
            title="Cases Filed"
            value={cases.length}
            subtitle="receipts reviewed"
            color="blue"
          />
          <KPICard
            title="Irregularities"
            value={totalFlags}
            subtitle="across all claims"
            color="red"
          />
          <KPICard
            title="Avg Risk Score"
            value={avgScore > 0 ? avgScore.toFixed(1) : "—"}
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
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Link href="/logs">
          <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground">
            <ScrollText className="w-3.5 h-3.5" />
            Audit log
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="gap-1.5 text-muted-foreground"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
