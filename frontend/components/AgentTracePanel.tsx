"use client";

import type { AgentTrace } from "@/lib/api";
import { Activity, Check, X, ShieldCheck } from "lucide-react";

function IbmLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="100" height="4" />
      <rect x="0" y="8" width="100" height="4" />
      <rect x="0" y="16" width="16" height="4" />
      <rect x="28" y="16" width="44" height="4" />
      <rect x="84" y="16" width="16" height="4" />
      <rect x="0" y="24" width="16" height="4" />
      <rect x="28" y="24" width="44" height="4" />
      <rect x="84" y="24" width="16" height="4" />
      <rect x="0" y="32" width="100" height="4" />
      <rect x="0" y="36" width="100" height="4" />
    </svg>
  );
}

function isWatsonxTrace(trace: AgentTrace): boolean {
  return trace.agent === "compliance_gate" && trace.event === "complete";
}

interface AgentTracePanelProps {
  traces: AgentTrace[];
  isRunning: boolean;
}

const layerConfig: Record<string, { label: string; icon: typeof Eye; color: string }> = {
  Perception: { label: "Perception", icon: Eye, color: "text-blue-600 bg-blue-50 border-blue-200" },
  Reasoning: { label: "Reasoning", icon: Brain, color: "text-red-600 bg-red-50 border-red-200" },
  Planning: { label: "Planning", icon: Lightbulb, color: "text-amber-600 bg-amber-50 border-amber-200" },
  Action: { label: "Action", icon: Zap, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
};

const agentLayer: Record<string, string> = {
  ocr_agent: "Perception",
  normalizer: "Perception",
  history_enricher: "Perception",
  persister: "Perception",
  fraud_analyst: "Reasoning",
  health_extractor: "Reasoning",
  scoring_engine: "Reasoning",
  benefits_navigator: "Planning",
  action_generator: "Planning",
  optimization_engine: "Planning",
  report_drafter: "Action",
  compliance_gate: "Action",
  audit_logger: "Action",
};

const agentLabels: Record<string, string> = {
  ocr_agent: "OCR Agent",
  normalizer: "Normalizer",
  history_enricher: "History Enricher",
  persister: "Persister",
  fraud_analyst: "Fraud Analyst",
  health_extractor: "Health Extractor",
  scoring_engine: "Scoring Engine",
  benefits_navigator: "Benefits Navigator",
  action_generator: "Action Generator",
  optimization_engine: "Optimization Engine",
  report_drafter: "Report Drafter",
  compliance_gate: "Compliance Gate",
  audit_logger: "Audit Logger",
  pipeline: "Pipeline",
};

function StatusIcon({ event }: { event: string }) {
  if (event === "complete") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (event === "error") return <XCircle className="w-4 h-4 text-red-500" />;
  if (event === "start") return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
  return <Activity className="w-4 h-4 text-gray-400" />;
}

// Group traces by layer for the progress overview
function getLayerProgress(traces: AgentTrace[]) {
  const layers = ["Perception", "Reasoning", "Planning", "Action"];
  return layers.map((layer) => {
    const layerTraces = traces.filter((t) => agentLayer[t.agent] === layer);
    const completed = layerTraces.filter((t) => t.event === "complete").length;
    const errors = layerTraces.filter((t) => t.event === "error").length;
    const total = new Set(layerTraces.map((t) => t.agent)).size;
    const hasActivity = layerTraces.length > 0;
    const isComplete = hasActivity && completed > 0 && errors === 0;
    const hasError = errors > 0;
    return { layer, completed, errors, total, hasActivity, isComplete, hasError };
  });
}

export function AgentTracePanel({ traces, isRunning }: AgentTracePanelProps) {
  const progress = getLayerProgress(traces);

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" />
          Agent Trace
        </h3>
        {isRunning && (
          <span className="flex items-center text-xs text-vigil-600 font-medium">
            <span className="animate-pulse mr-1.5 h-2 w-2 rounded-full bg-vigil-500 inline-block" />
            Running
          </span>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {traces.length === 0 ? (
          <p className="p-6 text-sm text-slate-400 text-center">
            Upload a receipt to see the agent pipeline in action
          </p>
        ) : (
          <div className="divide-y divide-slate-50">
            {traces.map((trace, idx) => {
              const watsonx = isWatsonxTrace(trace);
              return (
                <div
                  key={idx}
                  className={`px-4 py-3 flex items-start gap-3 ${
                    watsonx ? "bg-blue-50/60 border-l-2 border-blue-500" : ""
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        watsonx
                          ? "bg-blue-600 text-white"
                          : agentColors[trace.agent] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {watsonx ? (
                        "IBM WatsonX"
                      ) : (
                        trace.agent
                      )}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">{trace.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {watsonx && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                          <ShieldCheck className="w-3 h-3" />
                          Granite 3 8B
                        </span>
                      )}
                      {agentLayer[trace.agent] && (
                        <span className="text-xs text-slate-400">
                          {agentLayer[trace.agent]}
                        </span>
                      )}
                      {trace.duration_ms !== null && (
                        <span className="text-xs text-slate-400">
                          {trace.duration_ms}ms
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {trace.event === "complete" && (
                      <Check className="w-4 h-4 text-vigil-500" />
                    )}
                    {trace.event === "error" && (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
