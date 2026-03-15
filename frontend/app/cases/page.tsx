"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCases, approveCase, dismissCase } from "@/lib/api";
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
import { CheckCircle2, XCircle, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FraudCase {
  case_id: string;
  claim_id: string | null;
  student_id: string;
  fraud_score: number;
  risk_level: string;
  status: string;
  flags: Array<{ fraud_type: string; code: string }>;
  created_at?: string;
}

const irregularityLabels: Record<string, string> = {
  upcoding:        "Overcharge",
  unbundling:      "Split Billing",
  phantom_billing: "Unrendered Service",
  fee_deviation:   "Fee Above Guide",
  duplicate_claim: "Duplicate Charge",
};

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

export default function ClaimsPage() {
  const [cases, setCases] = useState<FraudCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState<{
    type: "approve" | "dismiss";
    caseId: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadCases(); }, []);

  async function loadCases() {
    try {
      const data = await getCases();
      setCases((data.cases || []) as unknown as FraudCase[]);
    } catch {
      // API may not be running
    } finally {
      setLoading(false);
    }
  }

  async function handleAction() {
    if (!actionDialog) return;
    setActionLoading(true);
    try {
      if (actionDialog.type === "approve") {
        await approveCase(actionDialog.caseId);
        toast.success("Marked as resolved");
      } else {
        await dismissCase(actionDialog.caseId);
        toast.success("Marked as correct");
      }
      await loadCases();
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setActionLoading(false);
      setActionDialog(null);
    }
  }

  const openCases     = cases.filter((c) => c.status === "open");
  const resolvedCases = cases.filter((c) => c.status !== "open");

  return (
    <div className="max-w-2xl mx-auto">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-normal text-foreground leading-tight">
          My Claims
        </h1>
        {!loading && (
          <p className="font-mono text-xs text-muted-foreground mt-1.5">
            {openCases.length} need{openCases.length === 1 ? "s" : ""} review
            {resolvedCases.length > 0 && ` · ${resolvedCases.length} reviewed`}
          </p>
        )}
      </div>

      {/* Loading skeletons */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : cases.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center mb-4">
            <FileText className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No claims yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Submit your first receipt to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* Open / Needs Review */}
          {openCases.length > 0 && (
            <section>
              <h2 className="font-mono text-2xs uppercase tracking-[0.12em] text-muted-foreground mb-3">
                Needs Review ({openCases.length})
              </h2>
              <div className="space-y-px">
                {openCases.map((c, i) => (
                  <div
                    key={c.case_id}
                    className="animate-list-entry"
                    style={{ "--entry-delay": `${i * 50}ms` } as React.CSSProperties}
                  >
                    <ClaimCard
                      fraudCase={c}
                      onApprove={(e) => {
                        e.stopPropagation();
                        setActionDialog({ type: "approve", caseId: c.case_id });
                      }}
                      onDismiss={(e) => {
                        e.stopPropagation();
                        setActionDialog({ type: "dismiss", caseId: c.case_id });
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Resolved / Reviewed */}
          {resolvedCases.length > 0 && (
            <section>
              <h2 className="font-mono text-2xs uppercase tracking-[0.12em] text-muted-foreground mb-3">
                Reviewed ({resolvedCases.length})
              </h2>
              <div className="space-y-px">
                {resolvedCases.map((c, i) => (
                  <div
                    key={c.case_id}
                    className="animate-list-entry"
                    style={{ "--entry-delay": `${i * 50}ms` } as React.CSSProperties}
                  >
                    <ClaimCard fraudCase={c} />
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}

      {/* Confirmation dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === "approve" ? "Mark as resolved?" : "Mark as correct?"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.type === "approve"
                ? "This confirms the billing irregularities are valid. We'll keep this on record and you can follow up with your provider."
                : "This marks the irregularities as expected. The claim will be closed with no further action needed."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setActionDialog(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionLoading}
              variant={actionDialog?.type === "approve" ? "default" : "outline"}
            >
              {actionLoading
                ? "Processing…"
                : actionDialog?.type === "approve"
                ? "Yes, mark as resolved"
                : "Yes, looks correct"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Claim Card ───────────────────────────────────────────── */

function ClaimCard({
  fraudCase,
  onApprove,
  onDismiss,
}: {
  fraudCase: FraudCase;
  onApprove?: (e: React.MouseEvent) => void;
  onDismiss?: (e: React.MouseEvent) => void;
}) {
  const router  = useRouter();
  const key     = (fraudCase.status as StatusKey) in statusConfig
    ? (fraudCase.status as StatusKey)
    : "open";
  const cfg     = statusConfig[key];
  const StatusIcon = cfg.icon;
  const isOpen  = fraudCase.status === "open";

  const dateLabel = fraudCase.created_at
    ? new Date(fraudCase.created_at).toLocaleDateString("en-CA", {
        year: "numeric", month: "short", day: "numeric",
      })
    : "—";

  return (
    <div
      onClick={() => router.push(`/cases/${fraudCase.case_id}`)}
      className={cn(
        // Base card
        "relative bg-card border border-border rounded-lg cursor-pointer",
        "transition-colors duration-150 hover:bg-accent-muted",
        // Accent left border for open/needs-review cases only
        isOpen && "border-l-[3px] border-l-primary"
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3 flex-wrap">

        {/* Date — monospace, secondary */}
        <span className="font-mono text-sm text-muted-foreground shrink-0">
          {dateLabel}
        </span>

        {/* Status badge */}
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-px text-[11px] font-medium rounded-sm border shrink-0 animate-badge-in",
            cfg.badgeClass
          )}
        >
          <StatusIcon className="w-2.5 h-2.5" />
          {cfg.label}
        </span>

        {/* Flag tags */}
        {fraudCase.flags?.map((flag, idx) => (
          <span
            key={idx}
            className="inline-flex items-center px-2 py-px text-[11px] font-medium rounded-sm border border-[hsl(var(--status-review-border))] bg-[hsl(var(--status-review-bg))] text-[hsl(var(--status-review-fg))] shrink-0"
          >
            {irregularityLabels[flag.fraud_type] ?? (flag.fraud_type || "").replace(/_/g, " ")}
            {flag.code && (
              <span className="ml-1 opacity-60 font-mono">· {flag.code}</span>
            )}
          </span>
        ))}

        {/* Review arrow — right-aligned visual affordance */}
        <span className="ml-auto text-primary text-sm font-medium shrink-0 tabular">
          →
        </span>
      </div>

      {/* Quick actions — open cases only, below a 1px divider */}
      {isOpen && onApprove && onDismiss && (
        <div className="flex gap-2 px-4 pb-3 pt-2 border-t border-border">
          <button
            onClick={onApprove}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors duration-150"
          >
            <CheckCircle2 className="w-3 h-3 text-[hsl(var(--status-resolved-fg))]" />
            I&apos;ve resolved this
          </button>
          <button
            onClick={onDismiss}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors duration-150"
          >
            <XCircle className="w-3 h-3 text-muted-foreground" />
            Looks correct
          </button>
        </div>
      )}
    </div>
  );
}
