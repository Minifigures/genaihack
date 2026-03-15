"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { KPICard } from "@/components/KPICard";
import { getAuditLogs } from "@/lib/api";
import {
  ShieldCheck,
  ClipboardCheck,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Eye,
  Scale,
  Lock,
  Cpu,
  Activity,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// ── Demo data ────────────────────────────────────────────────────────────────
const DEMO_ENTRIES = [
  {
    timestamp: "2026-03-15T10:23:00Z",
    claim_id: "CLM-2026-0042",
    action: "compliance_check",
    details: { compliance_method: "watsonx", approved: true, issues_count: 0, issues: [] },
  },
  {
    timestamp: "2026-03-15T09:15:00Z",
    claim_id: "CLM-2026-0038",
    action: "compliance_check",
    details: { compliance_method: "watsonx", approved: true, issues_count: 0, issues: [] },
  },
  {
    timestamp: "2026-03-14T16:42:00Z",
    claim_id: "CLM-2026-0035",
    action: "compliance_check",
    details: { compliance_method: "watsonx", approved: false, issues_count: 2, issues: ["Insufficient evidence for flag on code D7140", "Low confidence threshold not met"] },
  },
  {
    timestamp: "2026-03-14T14:08:00Z",
    claim_id: "CLM-2026-0031",
    action: "compliance_check",
    details: { compliance_method: "local", approved: true, issues_count: 0, issues: [] },
  },
  {
    timestamp: "2026-03-14T11:30:00Z",
    claim_id: "CLM-2026-0027",
    action: "compliance_check",
    details: { compliance_method: "watsonx", approved: true, issues_count: 0, issues: [] },
  },
];

const AI_PILLARS = [
  { icon: Eye, title: "Transparency", description: "Full model lineage and decision audit trails" },
  { icon: Brain, title: "Explainability", description: "Every flag includes verifiable, concrete evidence" },
  { icon: Scale, title: "Fairness", description: "Active bias detection across all fraud assessments" },
  { icon: Lock, title: "Privacy", description: "No PII sent to external models; data stays sovereign" },
  { icon: ShieldCheck, title: "Robustness", description: "Automatic local fallback if WatsonX is unavailable" },
];

const EVAL_CRITERIA = ["Bias Detection", "Explainability", "Proportionality", "Regulatory Compliance"];

const PIE_COLORS = ["#2563eb", "#94a3b8"]; // blue-600, slate-400
const BAR_COLORS = { pass: "#10b981", fail: "#ef4444" }; // green-500, red-500

// ── Scoped CSS animations (all in one file for easy revert) ──────────────────
const scopedStyles = `
@keyframes gov-slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes gov-slide-right {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes gov-scale-in {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes gov-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes gov-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes gov-glow-pulse {
  0%, 100% { box-shadow: 0 0 8px rgba(37, 99, 235, 0.2); }
  50% { box-shadow: 0 0 20px rgba(37, 99, 235, 0.4); }
}
@keyframes gov-border-draw {
  from { width: 0; }
  to { width: 100%; }
}
.gov-slide-up { animation: gov-slide-up 0.6s ease-out both; }
.gov-slide-right { animation: gov-slide-right 0.5s ease-out both; }
.gov-scale-in { animation: gov-scale-in 0.5s ease-out both; }
.gov-shimmer-bg {
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: gov-shimmer 3s linear infinite;
}
.gov-float { animation: gov-float 3s ease-in-out infinite; }
.gov-glow { animation: gov-glow-pulse 2s ease-in-out infinite; }
.gov-card-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.gov-card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
`;

// ── Animated counter hook ────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || target === 0) return;
    started.current = true;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(eased * target * 10) / 10);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
}

// ── Animated section wrapper ─────────────────────────────────────────────────
function FadeInSection({ delay = 0, children, className = "" }: { delay?: number; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`gov-slide-up ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function AnimatedBar({ value, color }: { value: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min(value, 100)), 300);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// ── Custom pie label ─────────────────────────────────────────────────────────
function PieLabel({ cx, cy, value, name }: { cx: number; cy: number; value: number; name: string }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="text-xs fill-slate-600">
      <tspan x={cx} dy="-8" className="text-lg font-bold fill-slate-800">{value}</tspan>
      <tspan x={cx} dy="18" className="text-[10px] fill-slate-400">{name}</tspan>
    </text>
  );
}

export default function GovernancePage() {
  const [auditEntries, setAuditEntries] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAuditLogs(200, 0);
        setAuditEntries(data.entries || []);
      } catch {
        // Backend may not be running — demo mode
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filter to compliance checks only
  const complianceEntries = auditEntries.filter((e) => e.action === "compliance_check");
  const useDemoData = !loading && complianceEntries.length === 0;
  const displayEntries = useDemoData ? DEMO_ENTRIES : complianceEntries;

  // Compute KPIs
  const totalChecks = displayEntries.length;
  const passedChecks = displayEntries.filter(
    (e) => (e.details as Record<string, unknown>)?.approved === true
  ).length;
  const failedChecks = totalChecks - passedChecks;
  const passRateNum = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;
  const passRate = totalChecks > 0 ? passRateNum.toFixed(1) : "--";
  const watsonxChecks = displayEntries.filter(
    (e) => (e.details as Record<string, unknown>)?.compliance_method === "watsonx"
  ).length;
  const localChecks = totalChecks - watsonxChecks;
  const watsonxRateNum = totalChecks > 0 ? (watsonxChecks / totalChecks) * 100 : 0;
  const watsonxRate = totalChecks > 0 ? watsonxRateNum.toFixed(1) : "--";
  const totalIssues = displayEntries.reduce(
    (sum, e) => sum + ((e.details as Record<string, unknown>)?.issues_count as number || 0),
    0
  );
  const avgIssues = totalChecks > 0 ? (totalIssues / totalChecks).toFixed(1) : "--";

  // Animated counters
  const animTotal = useAnimatedCounter(totalChecks);
  const animPassRate = useAnimatedCounter(passRateNum);
  const animWatsonx = useAnimatedCounter(watsonxRateNum);

  // Chart data
  const methodData = [
    { name: "WatsonX", value: watsonxChecks },
    { name: "Local", value: localChecks },
  ];
  const verdictData = [
    { name: "Pass", value: passedChecks, fill: BAR_COLORS.pass },
    { name: "Fail", value: failedChecks, fill: BAR_COLORS.fail },
  ];

  const renderCustomLabel = useCallback(
    ({ cx, cy }: { cx: number; cy: number }) => (
      <PieLabel cx={cx} cy={cy} value={watsonxChecks} name="WatsonX" />
    ),
    [watsonxChecks]
  );

  return (
    <div className="animate-fade-in">
      {/* Scoped styles */}
      <style dangerouslySetInnerHTML={{ __html: scopedStyles }} />

      {/* ── Header with IBM branding ──────────────────────────────────────── */}
      <FadeInSection>
        <div className="relative mb-8 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-8 overflow-hidden">
          {/* Animated background orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-4 right-8 w-64 h-64 rounded-full bg-white/10 blur-3xl gov-float" />
            <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-blue-300/20 blur-2xl gov-float" style={{ animationDelay: "1.5s" }} />
            <div className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full bg-blue-400/10 blur-2xl gov-float" style={{ animationDelay: "0.8s" }} />
          </div>

          {/* Shimmer overlay */}
          <div className="absolute inset-0 gov-shimmer-bg pointer-events-none" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 gov-glow">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  AI Governance
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-sm font-medium text-blue-100 border border-white/20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                    </span>
                    Live
                  </span>
                </h1>
                <p className="text-blue-200 text-sm mt-1">
                  WatsonX-powered compliance monitoring and responsible AI transparency
                </p>
              </div>
            </div>

            {/* IBM WatsonX brand block */}
            <div className="hidden md:flex items-center gap-3 gov-slide-right" style={{ animationDelay: "300ms" }}>
              <div className="text-right">
                <p className="text-xs text-blue-200 uppercase tracking-wider">Powered by</p>
                <p className="text-xl font-bold text-white tracking-tight">IBM WatsonX</p>
                <p className="text-xs text-blue-300">Granite 3 8B Instruct</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center gov-float" style={{ animationDelay: "0.5s" }}>
                <span className="text-blue-700 font-black text-lg tracking-tight">IBM</span>
              </div>
            </div>
          </div>
        </div>
      </FadeInSection>

      {/* Demo banner */}
      {useDemoData && (
        <FadeInSection delay={100}>
          <div className="mb-6 card border-blue-200 bg-blue-50/50 p-4 flex items-center gap-3">
            <Activity className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Showing demo data. Process claims to see live governance metrics.
            </p>
          </div>
        </FadeInSection>
      )}

      {/* ── KPI Cards with animated counters + progress bars ─────────────── */}
      <FadeInSection delay={150}>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-5">
                <div className="h-4 w-24 rounded bg-slate-100 animate-pulse mb-3" />
                <div className="h-8 w-16 rounded bg-slate-100 animate-pulse mb-2" />
                <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
            {[
              { delay: "0ms", card: <KPICard title="Compliance Checks" value={Math.round(animTotal)} subtitle="total checks run" color="blue" icon={ClipboardCheck} /> },
              {
                delay: "100ms",
                card: (
                  <div>
                    <KPICard title="Pass Rate" value={passRate === "--" ? "--" : `${animPassRate.toFixed(1)}%`} subtitle="checks approved" color="green" icon={CheckCircle2} />
                    {passRate !== "--" && <div className="px-5 pb-4 -mt-2"><AnimatedBar value={passRateNum} color="bg-vigil-500" /></div>}
                  </div>
                ),
              },
              {
                delay: "200ms",
                card: (
                  <div>
                    <KPICard title="WatsonX Usage" value={watsonxRate === "--" ? "--" : `${animWatsonx.toFixed(1)}%`} subtitle="via IBM Granite" color="blue" icon={Brain} />
                    {watsonxRate !== "--" && <div className="px-5 pb-4 -mt-2"><AnimatedBar value={watsonxRateNum} color="bg-blue-500" /></div>}
                  </div>
                ),
              },
              {
                delay: "300ms",
                card: <KPICard title="Avg Issues/Check" value={avgIssues} subtitle="issues detected" color={avgIssues !== "--" && parseFloat(avgIssues as string) > 1 ? "yellow" : "gray"} icon={AlertTriangle} />,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="opacity-0 animate-fade-in"
                style={{ animationDelay: item.delay, animationFillMode: "forwards" }}
              >
                {item.card}
              </div>
            ))}
          </div>
        )}
      </FadeInSection>

      {/* ── Charts Row ────────────────────────────────────────────────────── */}
      <FadeInSection delay={300}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Method Distribution Donut */}
          <div className="card p-6 gov-card-hover gov-scale-in" style={{ animationDelay: "350ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-800">Compliance Method Distribution</h3>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={methodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      labelLine={false}
                      label={renderCustomLabel}
                    >
                      {methodData.map((_entry, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                    <span className="text-sm text-slate-600">IBM WatsonX</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{watsonxChecks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-400" />
                    <span className="text-sm text-slate-600">Local Fallback</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{localChecks}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Verdict Breakdown Bar Chart */}
          <div className="card p-6 gov-card-hover gov-scale-in" style={{ animationDelay: "450ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-800">Verdict Breakdown</h3>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={verdictData} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {verdictData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </FadeInSection>

      {/* ── Model Transparency + AI Ethics ────────────────────────────────── */}
      <FadeInSection delay={400}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Model Transparency Card */}
          <div className="lg:col-span-2 card p-6 border-l-[3px] border-l-blue-500 gov-card-hover">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center gov-glow">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-800">Model Transparency</h2>
                <p className="text-xs text-slate-400">IBM WatsonX Compliance Gate Configuration</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: "Model", value: "IBM Granite 3 8B Instruct", mono: false },
                { label: "Model ID", value: "ibm/granite-3-8b-instruct", mono: true },
                { label: "Provider", value: "IBM WatsonX", mono: false },
                { label: "Temperature", value: "0.1", mono: true, suffix: "(deterministic)" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-4 bg-slate-50 rounded-lg hover:bg-blue-50 hover:shadow-sm transition-all duration-300 gov-slide-right"
                  style={{ animationDelay: `${500 + i * 100}ms` }}
                >
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
                  <p className={`text-sm ${item.mono ? "font-mono text-slate-700" : "font-semibold text-slate-800"}`}>
                    {item.value}
                    {item.suffix && <span className="text-slate-400 text-xs ml-1">{item.suffix}</span>}
                  </p>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                Evaluation Criteria
              </p>
              <div className="flex flex-wrap gap-2">
                {EVAL_CRITERIA.map((criterion, i) => (
                  <span
                    key={criterion}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium opacity-0 animate-fade-in"
                    style={{ animationDelay: `${500 + i * 80}ms`, animationFillMode: "forwards" }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {criterion}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-300 gov-slide-up" style={{ animationDelay: "900ms" }}>
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Why Granite?</span>{" "}
                IBM Granite models are purpose-built for enterprise AI with built-in safety
                guardrails, full data transparency, and indemnification — making them ideal
                for regulated healthcare compliance decisions.
              </p>
            </div>
          </div>

          {/* AI Ethics Alignment Card */}
          <div className="card p-6 border-l-[3px] border-l-blue-500 gov-card-hover">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center gov-glow">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-base font-semibold text-slate-800">AI Ethics Alignment</h2>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              VIGIL aligns with IBM&apos;s Pillars of Trustworthy AI
            </p>

            <div className="space-y-2">
              {AI_PILLARS.map((pillar, i) => (
                <div
                  key={pillar.title}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50 hover:shadow-sm hover:translate-x-1 transition-all duration-300 cursor-default gov-slide-right"
                  style={{ animationDelay: `${700 + i * 120}ms` }}
                >
                  <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-blue-100 transition-colors">
                    <pillar.icon className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{pillar.title}</p>
                    <p className="text-xs text-slate-500">{pillar.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeInSection>

      {/* ── Compliance Audit Trail ─────────────────────────────────────────── */}
      <FadeInSection delay={500}>
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Compliance Audit Trail</h2>
            {useDemoData && (
              <span className="text-xs text-slate-400 italic">Demo data</span>
            )}
          </div>

          {displayEntries.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No compliance checks yet</p>
              <p className="text-sm text-slate-400 mt-1">Upload a receipt to trigger the compliance gate</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-2.5 bg-slate-50/50 border-b border-slate-100 grid grid-cols-5 text-xs font-medium text-slate-400 uppercase tracking-wider">
                <span>Timestamp</span>
                <span>Claim ID</span>
                <span>Method</span>
                <span>Verdict</span>
                <span className="text-right">Issues</span>
              </div>
              <div className="divide-y divide-slate-50">
                {displayEntries.slice(0, 20).map((entry, idx) => {
                  const details = (entry.details || {}) as Record<string, unknown>;
                  const approved = details.approved as boolean;
                  const method = (details.compliance_method as string) || "local";
                  const issuesCount = (details.issues_count as number) || 0;
                  const timestamp = entry.timestamp as string;
                  const claimId = entry.claim_id as string;

                  return (
                    <div
                      key={idx}
                      className="px-6 py-3.5 grid grid-cols-5 items-center hover:bg-blue-50/30 transition-all duration-200 gov-slide-up"
                      style={{ animationDelay: `${700 + idx * 80}ms` }}
                    >
                      <span className="text-sm text-slate-500">
                        {timestamp
                          ? new Date(timestamp).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "--"}
                      </span>
                      <span className="text-sm font-medium text-slate-700 font-mono">
                        {claimId ? claimId.slice(0, 16) : "--"}
                      </span>
                      <span>
                        <span
                          className={`badge ${
                            method === "watsonx"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {method === "watsonx" ? "WatsonX" : "Local"}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        {/* Pulse dot */}
                        <span className="relative flex h-2.5 w-2.5">
                          {approved && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                          )}
                          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${approved ? "bg-green-500" : "bg-red-500"}`} />
                        </span>
                        <span
                          className={`badge ${
                            approved
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {approved ? "Pass" : "Fail"}
                        </span>
                      </span>
                      <span className="text-sm text-slate-400 text-right">{issuesCount}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </FadeInSection>
    </div>
  );
}
