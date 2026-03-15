"use client";

import { useEffect, useState } from "react";
import { getBenefits } from "@/lib/api";
import { BenefitsCard } from "@/components/BenefitsCard";
import type { BenefitsReport } from "@/lib/api";
import { Users } from "lucide-react";

const BENCHMARK_DATA: Record<string, number> = {
  dental: 65,
  vision: 40,
  paramedical: 25,
  psychology: 15,
  prescription: 20,
};

function getComparisonColor(studentPct: number, benchmarkPct: number): string {
  if (studentPct >= benchmarkPct) return "text-emerald-600";
  if (studentPct >= benchmarkPct * 0.5) return "text-amber-600";
  return "text-red-600";
}

function getBarColor(studentPct: number, benchmarkPct: number): string {
  if (studentPct >= benchmarkPct) return "bg-emerald-500";
  if (studentPct >= benchmarkPct * 0.5) return "bg-amber-500";
  return "bg-red-500";
}

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
        <div className="max-w-2xl space-y-6">
          <BenefitsCard report={report} />

          {/* Students Like You benchmark widget */}
          {report && report.coverage_items.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Students Like You</h3>
                  <p className="text-xs text-gray-500">
                    How your benefit usage compares to other UofT students by March
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {report.coverage_items.map((item) => {
                  const benchmark = BENCHMARK_DATA[item.category] ?? 50;
                  const studentPct =
                    item.annual_limit > 0
                      ? Math.round((item.used_ytd / item.annual_limit) * 100)
                      : 0;
                  const compColor = getComparisonColor(studentPct, benchmark);
                  const barColor = getBarColor(studentPct, benchmark);

                  return (
                    <div key={item.category}>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {item.category}
                        </span>
                        <span className={`text-sm font-semibold ${compColor}`}>
                          {studentPct >= benchmark ? "Above" : "Below"} average
                        </span>
                      </div>

                      {/* Student bar */}
                      <div className="relative mb-1">
                        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div
                            className={`${barColor} h-4 rounded-full transition-all relative`}
                            style={{ width: `${Math.min(100, studentPct)}%` }}
                          >
                            <span className="absolute right-2 top-0.5 text-[10px] font-bold text-white drop-shadow">
                              {studentPct > 8 ? `${studentPct}%` : ""}
                            </span>
                          </div>
                        </div>
                        {/* Benchmark marker */}
                        <div
                          className="absolute top-0 h-4 border-r-2 border-dashed border-gray-600"
                          style={{ left: `${Math.min(100, benchmark)}%` }}
                        />
                      </div>

                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">
                          You: {studentPct}%
                        </span>
                        <span className="text-xs text-gray-500">
                          Avg student: {benchmark}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <p className="text-xs text-indigo-700">
                  Students in your program typically use {BENCHMARK_DATA.dental}% of their dental
                  coverage by March. Green means you are on track, amber means
                  you may be underusing benefits, and red means you are
                  significantly below average.
                </p>
              </div>
            </div>
          )}

          {report && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
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
