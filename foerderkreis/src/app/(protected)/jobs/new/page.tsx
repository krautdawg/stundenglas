"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { createJob, getKreise } from "@/actions/jobs-client";

const urgencyOptions = [
  { value: "LOW", label: "Niedrig", desc: "Kein Zeitdruck" },
  { value: "NORMAL", label: "Normal", desc: "In den naechsten Wochen" },
  { value: "HIGH", label: "Dringend", desc: "Diese Woche" },
  { value: "CRITICAL", label: "Kritisch", desc: "Sofort" },
];

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [kreise, setKreise] = useState<{ id: string; name: string }[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("1");
  const [kreisId, setKreisId] = useState("");
  const [urgency, setUrgency] = useState("NORMAL");
  const [dueDate, setDueDate] = useState("");
  const [maxClaimants, setMaxClaimants] = useState("1");

  useEffect(() => {
    getKreise().then((data) => {
      if (data) setKreise(data);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await createJob({
      title,
      description: description || null,
      kreisId: kreisId || null,
      estimatedHours: parseFloat(estimatedHours),
      urgency,
      dueDate: dueDate || null,
      maxClaimants: parseInt(maxClaimants),
    });

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success("Aufgabe erfolgreich erstellt!");
    router.push("/jobs");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-extrabold">
          Aufgabe erstellen
        </h1>
        <p className="text-muted-foreground">
          Poste eine Aufgabe fuer die Schulgemeinschaft.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Schulhof winterfest machen"
                required
                minLength={3}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Was genau soll gemacht werden?"
                className="mt-1.5"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hours">Geschaetzte Stunden</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="100"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="claimants">Anzahl Helfer</Label>
                <Input
                  id="claimants"
                  type="number"
                  min="1"
                  max="50"
                  value={maxClaimants}
                  onChange={(e) => setMaxClaimants(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="kreis">Kreis</Label>
              <select
                id="kreis"
                value={kreisId}
                onChange={(e) => setKreisId(e.target.value)}
                className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Kein Kreis</option>
                {kreise.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Urgency */}
            <div>
              <Label>Dringlichkeit</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {urgencyOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setUrgency(opt.value)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      urgency === opt.value
                        ? "border-primary bg-amber-50"
                        : "border-input hover:bg-muted"
                    }`}
                  >
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="due_date">Faellig bis (optional)</Label>
              <Input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="mt-1.5"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || !title.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wird erstellt...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Aufgabe posten
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
