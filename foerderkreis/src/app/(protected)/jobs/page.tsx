import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Plus } from "lucide-react";

const urgencyLabels: Record<string, { label: string; class: string }> = {
  LOW: { label: "Niedrig", class: "bg-sage-100 text-sage-700" },
  NORMAL: { label: "Normal", class: "bg-amber-100 text-amber-700" },
  HIGH: { label: "Dringend", class: "bg-coral-100 text-coral-700" },
  CRITICAL: { label: "Kritisch", class: "bg-coral-500 text-white" },
};

export default async function JobsPage() {
  const jobs = await prisma.job.findMany({
    where: {
      status: { in: ["OPEN", "CLAIMED", "IN_PROGRESS"] },
    },
    include: {
      kreis: { select: { name: true, slug: true, color: true } },
      poster: { select: { firstName: true, lastName: true } },
      claims: { select: { id: true, status: true } },
    },
    orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
  });

  // Get available Kreise for filtering
  const kreise = await prisma.kreis.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

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
        {kreise.map((k) => (
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
            const activeClaims = job.claims.filter(
              (c) => c.status === "CLAIMED" || c.status === "COMPLETED"
            ).length;
            const urgency = urgencyLabels[job.urgency] ?? urgencyLabels.NORMAL;
            const spotsLeft = job.maxClaimants - activeClaims;

            return (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="hover:shadow-md transition-shadow mb-3">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-heading font-bold text-lg leading-tight pr-2">
                        {job.title}
                      </h3>
                      <Badge className={urgency.class}>{urgency.label}</Badge>
                    </div>

                    <div className="flex gap-4 mb-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />~
                        {Number(job.estimatedHours)
                          .toString()
                          .replace(".", ",")}{" "}
                        Std.
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {spotsLeft > 0
                          ? `${spotsLeft}/${job.maxClaimants} frei`
                          : "Voll"}
                      </span>
                    </div>

                    {job.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {job.description}
                      </p>
                    )}

                    <div className="flex justify-between items-center">
                      {job.kreis && (
                        <Badge variant="secondary">{job.kreis.name}</Badge>
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
