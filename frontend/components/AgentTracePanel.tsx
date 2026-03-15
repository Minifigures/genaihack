"use client";

import type { AgentTrace } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Eye,
  Brain,
  Lightbulb,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Agent Pipeline</CardTitle>
          {isRunning && (
            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Running
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Layer progress overview */}
        <div className="flex gap-1">
          {progress.map(({ layer, hasActivity, isComplete, hasError }) => {
            const config = layerConfig[layer];
            return (
              <div
                key={layer}
                className={cn(
                  "flex-1 h-2 rounded-full transition-all duration-500",
                  !hasActivity && "bg-gray-100",
                  hasActivity && !isComplete && !hasError && "bg-blue-300 animate-pulse",
                  isComplete && "bg-emerald-500",
                  hasError && "bg-red-400"
                )}
                title={`${config.label}: ${isComplete ? "Complete" : hasError ? "Error" : hasActivity ? "Running" : "Pending"}`}
              />
            );
          })}
        </div>

        {/* Layer labels */}
        <div className="flex gap-1 -mt-2">
          {progress.map(({ layer }) => {
            const config = layerConfig[layer];
            return (
              <div key={layer} className="flex-1 text-center">
                <span className="text-[10px] text-muted-foreground">{config.label}</span>
              </div>
            );
          })}
        </div>

        {/* Detailed trace log */}
        <ScrollArea className="h-[320px]">
          {traces.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Activity className="w-8 h-8 text-gray-300 mb-3" />
              <p className="text-sm text-muted-foreground">
                Upload a receipt to see the agent pipeline in action
              </p>
            </div>
          ) : (
            <div className="space-y-1 pr-3">
              {traces.map((trace, idx) => {
                const layer = agentLayer[trace.agent];
                const config = layer ? layerConfig[layer] : null;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors animate-in fade-in slide-in-from-bottom-1 duration-300"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <StatusIcon event={trace.event} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-900">
                          {agentLabels[trace.agent] || trace.agent}
                        </span>
                        {config && (
                          <Badge variant="outline" className={cn("text-[10px] px-1 py-0 h-4", config.color)}>
                            {config.label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {trace.message}
                      </p>
                    </div>
                    {trace.duration_ms !== null && (
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                        {trace.duration_ms}ms
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
