"use client";

import { useEffect, useState } from "react";
import { getCases, approveCase, dismissCase } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldAlert, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

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

const levelVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  low: "secondary",
  elevated: "outline",
  high: "destructive",
  critical: "destructive",
};

const statusConfig: Record<string, { icon: typeof Clock; label: string; className: string }> = {
  open: { icon: Clock, label: "Open", className: "text-amber-700 bg-amber-50 border-amber-200" },
  approved: { icon: CheckCircle2, label: "Approved", className: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  dismissed: { icon: XCircle, label: "Dismissed", className: "text-gray-500 bg-gray-50 border-gray-200" },
};

export default function CasesPage() {
  const [cases, setCases] = useState<FraudCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState<{
    type: "approve" | "dismiss";
    caseId: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

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
        toast.success("Case approved successfully");
      } else {
        await dismissCase(actionDialog.caseId);
        toast.success("Case dismissed");
      }
      await loadCases();
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setActionLoading(false);
      setActionDialog(null);
    }
  }

  const openCases = cases.filter((c) => c.status === "open");
  const resolvedCases = cases.filter((c) => c.status !== "open");

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fraud Cases</h1>
          <p className="text-sm text-muted-foreground">
            {openCases.length} open, {resolvedCases.length} resolved
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : cases.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShieldAlert className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-muted-foreground">No fraud cases yet. Upload a receipt to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Open cases */}
          {openCases.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Pending Review ({openCases.length})
              </h2>
              <div className="space-y-3">
                {openCases.map((c) => (
                  <CaseCard
                    key={c.case_id}
                    fraudCase={c}
                    onApprove={() => setActionDialog({ type: "approve", caseId: c.case_id })}
                    onDismiss={() => setActionDialog({ type: "dismiss", caseId: c.case_id })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Resolved cases */}
          {resolvedCases.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Resolved ({resolvedCases.length})
              </h2>
              <div className="space-y-3">
                {resolvedCases.map((c) => (
                  <CaseCard key={c.case_id} fraudCase={c} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === "approve" ? "Approve this case?" : "Dismiss this case?"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.type === "approve"
                ? "This confirms the fraud flags are valid and the case should be escalated for further investigation."
                : "This marks the fraud flags as false positives. The case will be closed with no further action."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setActionDialog(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionLoading}
              variant={actionDialog?.type === "approve" ? "default" : "destructive"}
              className={actionDialog?.type === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              {actionLoading
                ? "Processing..."
                : actionDialog?.type === "approve"
                ? "Approve Case"
                : "Dismiss Case"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CaseCard({
  fraudCase,
  onApprove,
  onDismiss,
}: {
  fraudCase: FraudCase;
  onApprove?: () => void;
  onDismiss?: () => void;
}) {
  const status = statusConfig[fraudCase.status] || statusConfig.open;
  const StatusIcon = status.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-gray-900 font-mono">
                {fraudCase.case_id.slice(0, 8).toUpperCase()}
              </h3>
              <Badge variant="outline" className={status.className}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Student: {fraudCase.student_id}
              {fraudCase.claim_id && (
                <> | Claim: <span className="font-mono">{fraudCase.claim_id.slice(0, 8)}</span></>
              )}
              {fraudCase.created_at && (
                <> | {new Date(fraudCase.created_at).toLocaleDateString()}</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={levelVariant[fraudCase.risk_level] || "secondary"}>
              {fraudCase.fraud_score}/100 {(fraudCase.risk_level || "").toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Flags */}
        {fraudCase.flags && fraudCase.flags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {fraudCase.flags.map((flag, idx) => (
              <Badge key={idx} variant="outline" className="text-red-700 border-red-200 bg-red-50">
                {(flag.fraud_type || "").replace(/_/g, " ")} {flag.code && `(${flag.code})`}
              </Badge>
            ))}
          </div>
        )}

        {/* Action buttons for open cases */}
        {fraudCase.status === "open" && onApprove && onDismiss && (
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <Button
              size="sm"
              onClick={onApprove}
              className="bg-emerald-600 hover:bg-emerald-700 gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={onDismiss} className="gap-1">
              <XCircle className="w-3.5 h-3.5" />
              Dismiss
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
