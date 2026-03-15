"use client";

import { useEffect, useState } from "react";
import { getBenefits, getClaims } from "@/lib/api";
import type { BenefitsReport, PipelineResult } from "@/lib/api";
import {
  Activity,
  Heart,
  Brain,
  Eye,
  Stethoscope,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Shield,
} from "lucide-react";

// Preventive care schedule (months between visits)
const PREVENTIVE_SCHEDULE = [
  { key: "dental_exam", label: "Dental Exam", interval: 6, icon: Stethoscope, category: "dental" },
  { key: "cleaning", label: "Professional Cleaning", interval: 6, icon: Activity, category: "dental" },
  { key: "xrays", label: "Dental X-Rays", interval: 12, icon: Eye, category: "dental" },
  { key: "fluoride", label: "Fluoride Treatment", interval: 6, icon: Shield, category: "dental" },
  { key: "eye_exam", label: "Eye Examination", interval: 12, icon: Eye, category: "vision" },
  { key: "mental_health", label: "Mental Health Check-in", interval: 3, icon: Brain, category: "psychology" },
];

function computeWellnessScore(benefits: BenefitsReport | null, claims: PipelineResult[]): number {
  if (!benefits) return 0;
  let score = 50; // base

  // Benefit utilization (up to 25 points)
  const totalLimit = benefits.coverage_items.reduce((s, c) => s + c.annual_limit, 0);
  const totalUsed = benefits.coverage_items.reduce((s, c) => s + c.used_ytd, 0);
  const utilizationRate = totalLimit > 0 ? totalUsed / totalLimit : 0;
  score += Math.min(25, utilizationRate * 50); // max 25 for 50%+ utilization

  // Preventive care engagement (up to 15 points)
  const hasDentalVisit = claims.some((c) =>
    c.fraud_flags?.length === 0 || c.fraud_score?.score === 0
  );
  if (hasDentalVisit) score += 10;

  // Mental health engagement (up to 10 points)
  const psychUsed = benefits.coverage_items.find((c) => c.category === "psychology");
  if (psychUsed && psychUsed.used_ytd > 0) score += 10;
  else score -= 5; // penalty for not using mental health benefits

  return Math.min(100, Math.max(0, Math.round(score)));
}

function getScoreColor(score: number): string {
  if (score >= 75) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

function getScoreBg(score: number): string {
  if (score >= 75) return "bg-emerald-50 border-emerald-200";
  if (score >= 50) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

function getScoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 45) return "Needs Attention";
  return "At Risk";
}

// Simulated treatment timeline data
const TREATMENT_TIMELINE = [
  { date: "2025-03-05", procedure: "Scaling and Polishing", provider: "Spadina Dental", status: "completed", category: "preventive" },
  { date: "2025-02-10", procedure: "Recall Examination", provider: "Maple Dental Centre", status: "completed", category: "diagnostic" },
  { date: "2025-01-15", procedure: "Composite Filling (tooth 21)", provider: "College Park Dental", status: "completed", category: "restorative" },
  { date: "2024-11-20", procedure: "Bitewing X-Rays", provider: "UofT Dental Clinic", status: "completed", category: "diagnostic" },
  { date: "2024-09-15", procedure: "Recall Examination", provider: "UofT Dental Clinic", status: "completed", category: "diagnostic" },
];

const UPCOMING_CARE = [
  { date: "2025-04-10", procedure: "Dental Exam (due)", priority: "normal", category: "dental" },
  { date: "2025-04-15", procedure: "Professional Cleaning", priority: "normal", category: "dental" },
  { date: "2025-05-01", procedure: "Mental Health Check-in", priority: "recommended", category: "psychology" },
  { date: "2025-06-20", procedure: "Eye Examination", priority: "normal", category: "vision" },
  { date: "2025-09-15", procedure: "Fluoride Treatment", priority: "low", category: "dental" },
];

const categoryColors: Record<string, string> = {
  diagnostic: "bg-blue-100 text-blue-700",
  preventive: "bg-emerald-100 text-emerald-700",
  restorative: "bg-amber-100 text-amber-700",
  dental: "bg-blue-100 text-blue-700",
  psychology: "bg-purple-100 text-purple-700",
  vision: "bg-indigo-100 text-indigo-700",
};

const priorityStyles: Record<string, string> = {
  normal: "border-l-blue-400",
  recommended: "border-l-purple-500",
  low: "border-l-gray-300",
  overdue: "border-l-red-500",
};

export default function HealthPage() {
  const [benefits, setBenefits] = useState<BenefitsReport | null>(null);
  const [claims, setClaims] = useState<PipelineResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [b, c] = await Promise.allSettled([
        getBenefits("STU-001"),
        getClaims(),
      ]);
      if (b.status === "fulfilled") setBenefits(b.value);
      if (c.status === "fulfilled") setClaims(c.value.claims || []);
      setLoading(false);
    }
    load();
  }, []);

  const wellnessScore = computeWellnessScore(benefits, claims);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-48 bg-gray-100 rounded-xl" />
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Heart className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health Dashboard</h1>
          <p className="text-sm text-gray-500">Your wellness overview and care timeline</p>
        </div>
      </div>

      {/* Wellness Score */}
      <div className={`rounded-xl border-2 p-6 ${getScoreBg(wellnessScore)}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Health Readiness Score</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-5xl font-black ${getScoreColor(wellnessScore)}`}>
                {wellnessScore}
              </span>
              <span className="text-lg text-gray-400">/100</span>
            </div>
            <p className={`text-sm font-semibold mt-1 ${getScoreColor(wellnessScore)}`}>
              {getScoreLabel(wellnessScore)}
            </p>
          </div>
          <div className="text-right space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Preventive care on track
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Mental health check-in recommended
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              {benefits ? `$${benefits.total_unused.toFixed(0)} unused coverage` : "Loading..."}
            </div>
          </div>
        </div>
      </div>

      {/* Preventive Care Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          Preventive Care Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PREVENTIVE_SCHEDULE.map((item) => {
            const Icon = item.icon;
            const isOverdue = item.key === "mental_health";
            const isDue = item.key === "fluoride";
            return (
              <div
                key={item.key}
                className={`rounded-lg border p-3 ${
                  isOverdue
                    ? "border-purple-200 bg-purple-50"
                    : isDue
                    ? "border-amber-200 bg-amber-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${isOverdue ? "text-purple-600" : isDue ? "text-amber-600" : "text-emerald-600"}`} />
                  <span className="text-xs font-semibold text-gray-700">{item.label}</span>
                </div>
                <p className={`text-[10px] font-medium ${isOverdue ? "text-purple-600" : isDue ? "text-amber-600" : "text-emerald-600"}`}>
                  {isOverdue ? "Recommended" : isDue ? "Due soon" : "On track"}
                </p>
                <p className="text-[10px] text-gray-400">Every {item.interval} months</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mental Health Nudge */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-purple-900">Mental Wellness Reminder</h3>
            <p className="text-sm text-purple-700 mt-1">
              Your UTSU plan covers 100% of psychology services up to $300/year.
              {benefits?.coverage_items.find((c) => c.category === "psychology")?.used_ytd === 0
                ? " You haven't used any of this benefit yet."
                : ""}
              {" "}Regular check-ins with a counsellor can help manage academic stress,
              anxiety, and improve overall wellbeing.
            </p>
            <p className="text-xs text-purple-500 mt-2">
              UofT Health & Wellness: (416) 978-8030 | My SSP: 1-844-451-9700 (24/7)
            </p>
          </div>
        </div>
      </div>

      {/* Treatment Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" />
          Treatment History
        </h2>
        <div className="space-y-3">
          {TREATMENT_TIMELINE.map((t, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5" />
                {i < TREATMENT_TIMELINE.length - 1 && (
                  <div className="w-0.5 h-8 bg-gray-200" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{t.procedure}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${categoryColors[t.category] || "bg-gray-100 text-gray-600"}`}>
                    {t.category}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{t.provider} | {t.date}</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Care */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          Upcoming Recommended Care
        </h2>
        <div className="space-y-2">
          {UPCOMING_CARE.map((u, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-3 rounded-lg border-l-4 bg-gray-50 ${priorityStyles[u.priority]}`}
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{u.procedure}</p>
                <p className="text-xs text-gray-500">{u.date}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${categoryColors[u.category] || "bg-gray-100 text-gray-600"}`}>
                {u.category}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Health Tips */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Why Preventive Care Matters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
          <div className="p-3 bg-emerald-50 rounded-lg">
            <p className="font-medium text-emerald-800 mb-1">Regular Dental Exams</p>
            <p className="text-xs text-emerald-700">Early detection of oral cancer, gum disease, and cavities can save you thousands and prevent serious health complications.</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="font-medium text-purple-800 mb-1">Mental Health Check-ins</p>
            <p className="text-xs text-purple-700">1 in 3 university students report significant stress. Regular counselling sessions can improve academic performance and quality of life.</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="font-medium text-blue-800 mb-1">Vision Care</p>
            <p className="text-xs text-blue-700">Students spend 8+ hours on screens daily. Annual eye exams can detect vision changes early and prevent digital eye strain.</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg">
            <p className="font-medium text-amber-800 mb-1">Paramedical Services</p>
            <p className="text-xs text-amber-700">Physiotherapy, chiropractic, and massage therapy are covered up to $500/year. Great for posture-related issues from studying.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
