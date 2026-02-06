"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  familyId: string;
  currentTarget: number;
  currentNotes: string;
  isActive: boolean;
}

export function FamilyAdminActions({
  familyId,
  currentTarget,
  currentNotes,
  isActive,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [target, setTarget] = useState(currentTarget.toString());
  const [notes, setNotes] = useState(currentNotes);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("families")
      .update({
        monthly_hour_target: parseFloat(target),
        notes: notes || null,
      })
      .eq("id", familyId);

    if (error) {
      toast.error("Speichern fehlgeschlagen");
    } else {
      toast.success("Familie aktualisiert");
      router.refresh();
    }
    setLoading(false);
    setExpanded(false);
  }

  if (!expanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="mt-2"
        onClick={() => setExpanded(true)}
      >
        <Settings className="h-3 w-3" />
        Bearbeiten
      </Button>
    );
  }

  return (
    <div className="mt-3 space-y-3 pt-3 border-t">
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Monatliches Stundenziel
        </label>
        <Input
          type="number"
          step="0.5"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Admin-Notiz (privat, z.B. Haertefall)
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Nur fuer Admins sichtbar..."
          className="mt-1"
          rows={2}
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="h-3 w-3 animate-spin" />}
          Speichern
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setExpanded(false)}
        >
          Abbrechen
        </Button>
      </div>
    </div>
  );
}
