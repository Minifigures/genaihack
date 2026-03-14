"use client";

import { useEffect, useState } from "react";
import { getBenefits } from "@/lib/api";
import { BenefitsCard } from "@/components/BenefitsCard";
import type { BenefitsReport } from "@/lib/api";

export default function BenefitsPage() {
  const [report, setReport] = useState<BenefitsReport | null>(null);
  const [studentId, setStudentId] = useState("STU-001");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getBenefits(studentId);
        setReport(data);
      } catch {
        setReport(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [studentId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Benefits Explorer</h1>
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-vigil-500 focus:ring-vigil-500 text-sm p-2 border"
        >
          <option value="STU-001">STU-001 (Alex Chen)</option>
          <option value="STU-002">STU-002 (Jordan Williams)</option>
          <option value="STU-003">STU-003 (Priya Patel)</option>
        </select>
      </div>

      {loading ? (
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
      ) : (
        <div className="max-w-2xl">
          <BenefitsCard report={report} />

          {report && (
            <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Recommendations
              </h3>
              <div className="space-y-3">
                {report.coverage_items
                  .filter((item) => item.recommendation)
                  .map((item) => (
                    <div
                      key={item.category}
                      className="p-3 bg-vigil-50 rounded-lg border border-vigil-100"
                    >
                      <p className="text-sm font-medium text-vigil-800 capitalize">
                        {item.category}
                      </p>
                      <p className="text-sm text-vigil-700 mt-1">
                        {item.recommendation}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
