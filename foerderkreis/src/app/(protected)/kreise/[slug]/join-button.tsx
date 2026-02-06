"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, UserMinus } from "lucide-react";
import { joinKreis, leaveKreis } from "@/actions/kreise";
import { toast } from "sonner";

export function KreisJoinButton({
  kreisId,
  isMember,
}: {
  kreisId: string;
  isMember: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    setLoading(true);
    if (isMember) {
      if (!confirm("Kreis wirklich verlassen?")) {
        setLoading(false);
        return;
      }
      const result = await leaveKreis(kreisId);
      if (result.error) toast.error(result.error);
      else toast.success("Kreis verlassen");
    } else {
      const result = await joinKreis(kreisId);
      if (result.error) toast.error(result.error);
      else toast.success("Willkommen im Kreis!");
    }
    router.refresh();
    setLoading(false);
  }

  return (
    <Button
      onClick={handleToggle}
      variant={isMember ? "outline" : "default"}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isMember ? (
        <>
          <UserMinus className="h-4 w-4" />
          Verlassen
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          Beitreten
        </>
      )}
    </Button>
  );
}
