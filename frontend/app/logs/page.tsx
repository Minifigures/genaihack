"use client";

import { useEffect, useState } from "react";
import { getAuditLogs } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollText } from "lucide-react";

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
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
          <ScrollText className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-muted-foreground">{logs.length} entries</p>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              No audit entries yet. Process a claim to generate audit logs.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead className="max-w-[300px]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {String(log.timestamp || "")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{String(log.action || "")}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {String(log.agent || "")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                      {JSON.stringify(log.details || {})}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
