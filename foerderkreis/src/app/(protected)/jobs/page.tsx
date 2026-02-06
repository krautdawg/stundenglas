import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Plus } from "lucide-react";

const urgencyLabels: Record<string, { label: string; class: string }> = {
  low: { label: "Niedrig", class: "bg-sage-100 text-sage-700" },
  normal: { label: "Normal", class: "bg-amber-100 text-amber-700" },
  high: { label: "Dringend", class: "bg-coral-100 text-coral-700" },
  critical: { label: "Kritisch", class: "bg-coral-500 text-white" },
};

export default async function JobsPage() {
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      `
      *,
      kreise(name, slug, color),
      users!posted_by(first_name, last_name),
      job_claims(id, status)
    `
    )
    .in("status", ["open", "claimed", "in_progress"])
    .order("urgency", { ascending: false })
    .order("created_at", { ascending: false });

  // Get available Kreise for filtering
  const { data: kreise } = await supabase
    .from("kreise")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-extrabold">Marktplatz</h1>
          <p className="text-muted-foreground">
            Finde eine Aufgabe, die zu dir passt.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/jobs/new">
            <Plus className="h-4 w-4 mr-1" />
            Neu
          </Link>
        </Button>
      </div>

      {/* Filter badges */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Badge variant="default" className="cursor-pointer whitespace-nowrap">
          Alle
        </Badge>
        {kreise?.map((k) => (
          <Badge
            key={k.id}
            variant="secondary"
            className="cursor-pointer whitespace-nowrap"
          >
            {k.name}
          </Badge>
        ))}
      </div>

      {/* Job Cards */}
      {jobs && jobs.length > 0 ? (
        <div className="space-y-3">
          {jobs.map((job) => {
            const activeClaims =
              (job.job_claims as { id: string; status: string }[])?.filter(
                (c) => c.status === "claimed" || c.status === "completed"
              ).length ?? 0;
            const urgency = urgencyLabels[job.urgency] ?? urgencyLabels.normal;
            const spotsLeft = job.max_claimants - activeClaims;

            return (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="hover:shadow-md transition-shadow mb-3">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-heading font-bold text-lg leading-tight pr-2">
                        {job.title}
                      </h3>
                      <Badge className={urgency.class}>
                        {urgency.label}
                      </Badge>
                    </div>

                    <div className="flex gap-4 mb-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />~
                        {Number(job.estimated_hours)
                          .toString()
                          .replace(".", ",")}{" "}
                        Std.
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {spotsLeft > 0
                          ? `${spotsLeft}/${job.max_claimants} frei`
                          : "Voll"}
                      </span>
                    </div>

                    {job.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {job.description}
                      </p>
                    )}

                    <div className="flex justify-between items-center">
                      {job.kreise && (
                        <Badge variant="secondary">
                          {(job.kreise as { name: string }).name}
                        </Badge>
                      )}
                      {spotsLeft > 0 && (
                        <span className="text-sm font-medium text-primary">
                          Ich mache das! &rarr;
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="font-heading font-bold text-lg mb-2">
              Keine offenen Aufgaben
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Aktuell gibt es keine Aufgaben. Erstelle die erste!
            </p>
            <Button asChild>
              <Link href="/jobs/new">Aufgabe erstellen</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
