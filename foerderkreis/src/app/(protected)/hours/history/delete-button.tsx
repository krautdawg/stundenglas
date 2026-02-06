"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteHours } from "@/actions/hours";
import { toast } from "sonner";

export function HoursDeleteButton({ hourId }: { hourId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Eintrag wirklich loeschen?")) return;
    setLoading(true);
    const result = await deleteHours(hourId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Eintrag geloescht");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={loading}
      className="text-muted-foreground hover:text-destructive"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}
