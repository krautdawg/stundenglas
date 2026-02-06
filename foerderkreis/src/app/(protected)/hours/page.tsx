"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { logHoursClient, getKreise } from "@/actions/hours-client";

export default function LogHoursPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hours, setHours] = useState(1);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [kreisId, setKreisId] = useState<string>("");
  const [kreise, setKreise] = useState<{ id: string; name: string }[]>([]);
  const [kreiseLoaded, setKreiseLoaded] = useState(false);

  // Load Kreise on mount
  useEffect(() => {
    if (!kreiseLoaded) {
      getKreise().then((data) => {
        if (data) setKreise(data);
        setKreiseLoaded(true);
      });
    }
  }, [kreiseLoaded]);

  function adjustHours(delta: number) {
    setHours((prev) => {
      const next = Math.round((prev + delta) * 4) / 4;
      return Math.max(0.25, Math.min(24, next));
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await logHoursClient({
      hours,
      description,
      datePerformed: date,
      kreisId: kreisId || null,
    });

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success(
      `${hours.toFixed(2).replace(".", ",")} Stunden erfolgreich erfasst!`
    );
    setDescription("");
    setHours(1);
    setKreisId("");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-extrabold">
          Stunden erfassen
        </h1>
        <p className="text-muted-foreground">
          Erfasse deine ehrenamtlichen Stunden.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Date */}
            <div>
              <Label htmlFor="date">Datum</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="mt-1.5"
              />
            </div>

            {/* Hours stepper */}
            <div>
              <Label>Stunden</Label>
              <div className="flex items-center gap-4 mt-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => adjustHours(-0.25)}
                  disabled={hours <= 0.25}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center">
                  <span className="text-3xl font-heading font-extrabold">
                    {hours.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-muted-foreground ml-1">Std.</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => adjustHours(0.25)}
                  disabled={hours >= 24}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-center gap-2 mt-2">
                {[0.5, 1, 2, 3, 4].map((h) => (
                  <Button
                    key={h}
                    type="button"
                    variant={hours === h ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setHours(h)}
                    className="text-xs"
                  >
                    {h.toString().replace(".", ",")}h
                  </Button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Was hast du gemacht?</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="z.B. Schulhof winterfest gemacht"
                required
                minLength={3}
                className="mt-1.5"
                rows={3}
              />
            </div>

            {/* Kreis selector */}
            <div>
              <Label htmlFor="kreis">Kreis (optional)</Label>
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

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || !description.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wird gespeichert...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Stunden erfassen
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Button asChild variant="ghost" className="w-full">
        <a href="/hours/history">Meine Stunden-Historie anzeigen</a>
      </Button>
    </div>
  );
}
