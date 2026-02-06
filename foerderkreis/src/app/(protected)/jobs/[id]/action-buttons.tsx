"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, HandHelping } from "lucide-react";
import { claimJob, completeJobClaim, withdrawClaim } from "@/actions/jobs";
import { toast } from "sonner";

interface Props {
  jobId: string;
  hasClaimed: boolean;
  spotsLeft: number;
  jobStatus: string;
}

export function JobActionButtons({
  jobId,
  hasClaimed,
  spotsLeft,
  jobStatus,
}: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  async function handleClaim() {
    setLoading("claim");
    const result = await claimJob(jobId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Aufgabe uebernommen! Viel Erfolg!");
      router.refresh();
    }
    setLoading(null);
  }

  async function handleComplete() {
    setLoading("complete");
    const result = await completeJobClaim(jobId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Super! Stunden wurden automatisch erfasst.");
      router.refresh();
    }
    setLoading(null);
  }

  async function handleWithdraw() {
    if (!confirm("Aufgabe wirklich zurueckgeben?")) return;
    setLoading("withdraw");
    const result = await withdrawClaim(jobId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Aufgabe zurueckgegeben");
      router.refresh();
    }
    setLoading(null);
  }

  if (jobStatus === "completed" || jobStatus === "cancelled") {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Diese Aufgabe ist {jobStatus === "completed" ? "erledigt" : "abgesagt"}.
      </div>
    );
  }

  if (hasClaimed) {
    return (
      <div className="space-y-3">
        <Button
          onClick={handleComplete}
          className="w-full bg-sage-500 hover:bg-sage-600"
          size="lg"
          disabled={loading !== null}
        >
          {loading === "complete" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          Erledigt - Stunden erfassen
        </Button>
        <Button
          onClick={handleWithdraw}
          variant="outline"
          className="w-full"
          disabled={loading !== null}
        >
          {loading === "withdraw" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          Aufgabe zurueckgeben
        </Button>
      </div>
    );
  }

  if (spotsLeft <= 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Alle Plaetze sind vergeben.
      </div>
    );
  }

  return (
    <Button
      onClick={handleClaim}
      className="w-full"
      size="lg"
      disabled={loading !== null}
    >
      {loading === "claim" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <HandHelping className="h-4 w-4" />
      )}
      Ich mache das!
    </Button>
  );
}
