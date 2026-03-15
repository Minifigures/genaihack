"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getCase, getClaim, approveCase, dismissCase } from "@/lib/api";
import { FraudCaseCard } from "@/components/FraudCaseCard";
import { BenefitsCard } from "@/components/BenefitsCard";
import { AgentTracePanel } from "@/components/AgentTracePanel";
import type { PipelineResult, FraudScore, FraudFlag } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CaseDetail {
  case_id: string;
  claim_id: string | null;
  student_id: string;
  fraud_score: number;
  risk_level: string;
  score_breakdown: {
    fee_deviation: number;
    code_risk: number;
    provider_history: number;
    pattern_bonus: number;
    confidence_adj: number;
  } | null;
  flags: FraudFlag[];
  report_html: string | null;
  status: string;
  created_at: string | null;
}

type StatusKey = "open" | "approved" | "dismissed";

const statusConfig: Record<StatusKey, {
  icon: typeof Clock;
  label: string;
  badgeClass: string;
}> = {
  open: {
    icon: Clock,
    label: "Needs Review",
    badgeClass: "bg-[hsl(var(--status-review-bg))] text-[hsl(var(--status-review-fg))] border-[hsl(var(--status-review-border))]",
  },
  approved: {
    icon: CheckCircle2,
    label: "Resolved",
    badgeClass: "bg-[hsl(var(--status-resolved-bg))] text-[hsl(var(--status-resolved-fg))] border-[hsl(var(--status-resolved-border))]",
  },
  dismissed: {
    icon: XCircle,
    label: "Marked Correct",
    badgeClass: "bg-[hsl(var(--status-correct-bg))] text-[hsl(var(--status-correct-fg))] border-[hsl(var(--status-correct-border))]",
  },
};

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = params.id as string;
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [pipeline, setPipeline] = useState<PipelineResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState<"approve" | "dismiss" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function load() {
    try {
      const raw = await getCase(caseId);
      if (!raw || "error" in raw) { setLoading(false); return; }
      setCaseData(raw as unknown as CaseDetail);
      if (raw.claim_id) {
        try {
          const p = await getClaim(raw.claim_id as string);
          if (p && !("error" in p)) setPipeline(p);
        } catch {
          // Pipeline result unavailable after server restart
        }
      }
    } catch {
      // Not found
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (caseId) load(); }, [caseId]);

  async function handleAction() {
    if (!actionDialog || !caseData) return;
    setActionLoading(true);
    try {
      if (actionDialog === "approve") {
        await approveCase(caseData.case_id);
        toast.success("Marked as resolved");
      } else {
        await dismissCase(caseData.case_id);
        toast.success("Marked as correct");
      }
      await load();
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setActionLoading(false);
      setActionDialog(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="max-w-2xl mx-auto pt-20 text-center">
        <p className="text-sm text-muted-foreground mb-3">Case not found</p>
        <Link href="/cases" className="text-sm text-primary hover:opacity-80 transition-opacity">
          ← Back to My Claims
        </Link>
      </div>
    );
  }

  const dateLabel = caseData.created_at
    ? new Date(caseData.created_at).toLocaleDateString("en-CA", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "Date unknown";

  const statusKey = (caseData.status as StatusKey) in statusConfig
    ? (caseData.status as StatusKey)
    : "open";
  const statusInfo = statusConfig[statusKey];
  const StatusIcon = statusInfo.icon;
  const isOpen = caseData.status === "open";

  const fraudScore: FraudScore | null =
    caseData.score_breakdown && caseData.risk_level
      ? {
          score: Number(caseData.fraud_score) || 0,
          level: caseData.risk_level,
          breakdown: caseData.score_breakdown,
        }
      : null;

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <Link
          href="/cases"
          className="mt-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-display text-2xl font-normal text-foreground leading-tight">
              {dateLabel}
            </h1>
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-px text-[11px] font-medium rounded-sm border",
                statusInfo.badgeClass
              )}
            >
              <StatusIcon className="w-2.5 h-2.5" />
              {statusInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* Quick actions — open cases only */}
      {isOpen && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActionDialog("approve")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors duration-150"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--status-resolved-fg))]" />
            I've resolved this
          </button>
          <button
            onClick={() => setActionDialog("dismiss")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors duration-150"
          >
            <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
            Looks correct
          </button>
        </div>
      )}

      <div className="space-y-5">
        {/* Billing Review — always shown */}
        <FraudCaseCard fraudScore={fraudScore} flags={caseData.flags || []} />

        {/* Benefits — from pipeline if available */}
        {pipeline?.benefits_report && (
          <BenefitsCard report={pipeline.benefits_report} />
        )}

        {/* Detailed Report — from DB (persisted) or pipeline (in-memory) */}
        {(caseData.report_html || pipeline?.report_html) && (
          <Card>
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-base font-medium">Detailed Analysis</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div dangerouslySetInnerHTML={{ __html: (caseData.report_html || pipeline?.report_html)! }} />
            </CardContent>
          </Card>
        )}

        {/* Agent Trace */}
        {pipeline?.agent_traces && pipeline.agent_traces.length > 0 && (
          <AgentTracePanel traces={pipeline.agent_traces} isRunning={false} />
        )}
      </div>

      {/* Confirmation dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog === "approve" ? "Mark as resolved?" : "Mark as correct?"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog === "approve"
                ? "This confirms the billing irregularities are valid. We'll keep this on record."
                : "This marks the irregularities as expected. The claim will be closed."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setActionDialog(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleAction} disabled={actionLoading}>
              {actionLoading
                ? "Processing…"
                : actionDialog === "approve"
                ? "Yes, mark as resolved"
                : "Yes, looks correct"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
