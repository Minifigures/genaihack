"use client";

import { useEffect, useState } from "react";
import { getClaims } from "@/lib/api";
import type { PipelineResult } from "@/lib/api";
import { FolderSearch, FileX } from "lucide-react";

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
        setClaims(
          data.claims.filter((c) => c.fraud_score && c.fraud_score.score > 25)
        );
      } catch {
        // API may not be running
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-heading text-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-vigil-50 flex items-center justify-center">
            <FolderSearch className="w-5 h-5 text-vigil-600" />
          </div>
          Fraud Cases
        </h1>
        <p className="text-sm text-slate-500 mt-2 ml-[52px]">
          Claims flagged with elevated or higher risk scores
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6">
              <div className="skeleton h-5 w-48 rounded mb-3" />
              <div className="skeleton h-4 w-32 rounded mb-4" />
              <div className="flex gap-2">
                <div className="skeleton h-6 w-24 rounded-full" />
                <div className="skeleton h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="card p-16 text-center">
          <FileX className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No fraud cases yet</p>
          <p className="text-sm text-slate-400 mt-1">
            Upload a receipt to get started
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div key={claim.claim_id} className="card-hover p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 font-mono">
                    {claim.claim_id.slice(0, 12)}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Student: {claim.student_id} |{" "}
                    {claim.timestamp
                      ? new Date(claim.timestamp).toLocaleDateString()
                      : "--"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {claim.fraud_score && (
                    <span
                      className={`badge ${
                        levelStyles[claim.fraud_score.level] || levelStyles.low
                      }`}
                    >
                      {claim.fraud_score.score}/100{" "}
                      {claim.fraud_score.level.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              {claim.fraud_flags && claim.fraud_flags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {claim.fraud_flags.map((flag, idx) => (
                    <span
                      key={idx}
                      className="badge bg-red-50 text-red-700"
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
