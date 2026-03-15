"use client";

import type { AgentTrace } from "@/lib/api";
import { Activity, Check, X } from "lucide-react";

interface AgentTracePanelProps {
  traces: AgentTrace[];
  isRunning: boolean;
}

const agentColors: Record<string, string> = {
  ocr_agent: "bg-blue-100 text-blue-800",
  normalizer: "bg-indigo-100 text-indigo-800",
  history_enricher: "bg-purple-100 text-purple-800",
  persister: "bg-gray-100 text-gray-800",
  fraud_analyst: "bg-red-100 text-red-800",
  health_extractor: "bg-pink-100 text-pink-800",
  scoring_engine: "bg-orange-100 text-orange-800",
  benefits_navigator: "bg-green-100 text-green-800",
  action_generator: "bg-teal-100 text-teal-800",
  optimization_engine: "bg-cyan-100 text-cyan-800",
  report_drafter: "bg-yellow-100 text-yellow-800",
  compliance_gate: "bg-amber-100 text-amber-800",
  audit_logger: "bg-slate-100 text-slate-800",
  pipeline: "bg-vigil-100 text-vigil-800",
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

export function AgentTracePanel({ traces, isRunning }: AgentTracePanelProps) {
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
            {traces.map((trace, idx) => (
              <div key={idx} className="px-4 py-3 flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      agentColors[trace.agent] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {trace.agent}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{trace.message}</p>
                  <div className="flex items-center gap-2 mt-1">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
