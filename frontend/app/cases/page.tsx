"use client";

import { useEffect, useState } from "react";
import { getClaims } from "@/lib/api";
import type { PipelineResult } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert } from "lucide-react";

const levelVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  low: "secondary",
  elevated: "outline",
  high: "destructive",
  critical: "destructive",
};

export default function CasesPage() {
  const [claims, setClaims] = useState<PipelineResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getClaims();
        setClaims(data.claims.filter((c) => c.fraud_score && c.fraud_score.score > 25));
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
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fraud Cases</h1>
          <p className="text-sm text-muted-foreground">{claims.length} cases flagged</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No fraud cases yet. Upload a receipt to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <Card key={claim.claim_id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      Case {claim.claim_id.slice(0, 8)}...
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Student: {claim.student_id} | {claim.timestamp ? new Date(claim.timestamp).toLocaleDateString() : "--"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {claim.fraud_score && (
                      <Badge variant={levelVariant[claim.fraud_score.level] || "secondary"}>
                        {claim.fraud_score.score}/100 {claim.fraud_score.level.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>
                {claim.fraud_flags && claim.fraud_flags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {claim.fraud_flags.map((flag, idx) => (
                      <Badge key={idx} variant="outline" className="text-red-700 border-red-200 bg-red-50">
                        {flag.fraud_type} (Code {flag.code})
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
