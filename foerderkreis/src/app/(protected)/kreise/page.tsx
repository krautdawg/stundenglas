import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function KreisePage() {
  const session = await auth();
  const userId = session!.user.id;

  const kreise = await prisma.kreis.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  // Get membership info for current user
  const memberships = await prisma.kreisMembership.findMany({
    where: { userId },
    select: { kreisId: true },
  });

  const memberKreisIds = new Set(memberships.map((m) => m.kreisId));

  // Get member counts
  const allMemberships = await prisma.kreisMembership.findMany({
    select: { kreisId: true },
  });

  const memberCounts: Record<string, number> = {};
  allMemberships.forEach((m) => {
    memberCounts[m.kreisId] = (memberCounts[m.kreisId] || 0) + 1;
  });

  // Get open job counts per Kreis
  const jobs = await prisma.job.findMany({
    where: { status: "OPEN" },
    select: { kreisId: true },
  });

  const jobCounts: Record<string, number> = {};
  jobs.forEach((j) => {
    if (j.kreisId) jobCounts[j.kreisId] = (jobCounts[j.kreisId] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-extrabold">Kreise</h1>
        <p className="text-muted-foreground">
          Finde einen Kreis und engagiere dich.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {kreise.map((kreis) => {
          const isMember = memberKreisIds.has(kreis.id);
          const members = memberCounts[kreis.id] ?? 0;
          const openJobs = jobCounts[kreis.id] ?? 0;

          return (
            <Link key={kreis.id} href={`/kreise/${kreis.slug}`}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div
                    className="text-3xl mb-2"
                    role="img"
                    aria-label={kreis.name}
                  >
                    {kreis.icon || "🔵"}
                  </div>
                  <h3 className="font-heading font-bold text-sm leading-tight mb-1">
                    {kreis.name}
                  </h3>
                  <div className="text-xs text-muted-foreground mb-2">
                    {members} Mitglieder
                  </div>
                  {openJobs > 0 && (
                    <Badge variant="secondary" className="text-xs mb-2">
                      {openJobs} Aufgaben
                    </Badge>
                  )}
                  {isMember ? (
                    <Badge className="bg-sage-100 text-sage-700 text-xs">
                      Mitglied
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Beitreten
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
