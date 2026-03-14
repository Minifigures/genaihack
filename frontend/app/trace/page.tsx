"use client";

import { useEffect, useState, useCallback } from "react";
import { AgentTracePanel } from "@/components/AgentTracePanel";
import { TraceWebSocket } from "@/lib/websocket";
import type { AgentTrace } from "@/lib/api";
import type { WSMessage } from "@/lib/websocket";

export default function TracePage() {
  const [traces, setTraces] = useState<AgentTrace[]>([]);
  const [connected, setConnected] = useState(false);

  const handleMessage = useCallback((msg: WSMessage) => {
    const trace: AgentTrace = {
      agent: msg.agent,
      event: msg.event,
      message: msg.message,
      duration_ms: msg.duration_ms,
      timestamp: new Date().toISOString(),
    };
    setTraces((prev) => [...prev, trace]);
  }, []);

  useEffect(() => {
    const ws = new TraceWebSocket();
    ws.onMessage(handleMessage);
    ws.connect();
    setConnected(true);

    return () => {
      ws.disconnect();
      setConnected(false);
    };
  }, [handleMessage]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agent Trace Viewer</h1>
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm text-gray-500">
            {connected ? "Connected" : "Disconnected"}
          </span>
          <button
            onClick={() => setTraces([])}
            className="ml-4 text-sm text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
      </div>

      <AgentTracePanel traces={traces} isRunning={connected} />
    </div>
  );
}
