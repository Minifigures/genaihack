"use client";

import { useEffect, useState } from "react";
import { getClaims } from "@/lib/api";
import type { PipelineResult } from "@/lib/api";

const levelStyles: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  elevated: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Fraud Cases</h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No fraud cases yet. Upload a receipt to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div key={claim.claim_id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    Case {claim.claim_id.slice(0, 8)}...
                  </h3>
                  <p className="text-xs text-gray-500">
                    Student: {claim.student_id} | {claim.timestamp}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {claim.fraud_score && (
                    <span
                      className={`text-sm font-medium px-3 py-1 rounded-full ${
                        levelStyles[claim.fraud_score.level] || levelStyles.low
                      }`}
                    >
                      {claim.fraud_score.score}/100 {claim.fraud_score.level.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              {claim.fraud_flags && claim.fraud_flags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {claim.fraud_flags.map((flag, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded"
                    >
                      {flag.fraud_type} (Code {flag.code})
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
