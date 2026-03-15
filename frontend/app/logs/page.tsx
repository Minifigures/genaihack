"use client";

import { useEffect, useState } from "react";
import { getAuditLogs } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function LogsPage() {
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAuditLogs();
        setLogs(data.entries);
      } catch {
        // API may not be running
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-normal text-foreground leading-tight">
          Audit Log
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          {loading ? "Loading…" : `${logs.length} entries`}
        </p>
      </div>

      {loading ? (
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      ) : logs.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No audit entries yet. Process a claim to generate audit logs.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="font-mono text-2xs uppercase tracking-[0.1em] text-muted-foreground">
                  Timestamp
                </TableHead>
                <TableHead className="font-mono text-2xs uppercase tracking-[0.1em] text-muted-foreground">
                  Action
                </TableHead>
                <TableHead className="font-mono text-2xs uppercase tracking-[0.1em] text-muted-foreground">
                  Agent
                </TableHead>
                <TableHead className="font-mono text-2xs uppercase tracking-[0.1em] text-muted-foreground max-w-[300px]">
                  Details
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, idx) => (
                <TableRow key={idx} className="border-b border-border last:border-0">
                  <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {String(log.timestamp || "")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-2xs">
                      {String(log.action || "")}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {String(log.agent || "")}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">
                    {JSON.stringify(log.details || {})}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
