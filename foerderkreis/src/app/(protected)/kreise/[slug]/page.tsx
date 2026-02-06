import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, Users } from "lucide-react";
import { KreisJoinButton } from "./join-button";

export default async function KreisDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const kreis = await prisma.kreis.findUnique({
    where: { slug },
  });

  if (!kreis) notFound();

  // Members
  const members = await prisma.kreisMembership.findMany({
    where: { kreisId: kreis.id },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
    },
  });

  // Check if current user is member
  const isMember = members.some((m) => m.user.id === userId);

  // Jobs for this Kreis
  const jobs = await prisma.job.findMany({
    where: {
      kreisId: kreis.id,
      status: { in: ["OPEN", "CLAIMED", "IN_PROGRESS"] },
    },
    include: {
      claims: {
        select: { id: true, status: true },
      },
    },
    orderBy: { urgency: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="text-5xl mb-3">{kreis.icon || "🔵"}</div>
        <h1 className="text-2xl font-heading font-extrabold">{kreis.name}</h1>
        {kreis.description && (
          <p className="text-muted-foreground mt-1">{kreis.description}</p>
        )}
        <div className="mt-4">
          <KreisJoinButton kreisId={kreis.id} isMember={!!isMember} />
        </div>
      </div>

      <Separator />

      {/* Members */}
      <div>
        <h2 className="font-heading font-bold mb-3">
          Mitglieder ({members.length})
        </h2>
        <div className="flex flex-wrap gap-3">
          {members.map((m) => (
            <div
              key={m.user.id}
              className="flex items-center gap-2 bg-muted rounded-full pl-1 pr-3 py-1"
            >
              <div className="w-7 h-7 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-800">
                {m.user.firstName[0]}
                {m.user.lastName[0]}
              </div>
              <span className="text-sm">
                {m.user.firstName} {m.user.lastName[0]}.
              </span>
              {m.role === "LEAD" && (
                <Badge variant="secondary" className="text-[10px]">
                  Leitung
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Jobs */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-heading font-bold">Aktuelle Aufgaben</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/jobs">Alle anzeigen</Link>
          </Button>
        </div>

        {jobs && jobs.length > 0 ? (
          <div className="space-y-2">
            {jobs.map((job) => {
              const activeClaims = job.claims.filter(
                (c) => c.status === "CLAIMED" || c.status === "COMPLETED"
              ).length;

              return (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <Card className="hover:shadow-md transition-shadow mb-2">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{job.title}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {Number(job.estimatedHours)
                            .toString()
                            .replace(".", ",")}
                          h
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Users className="h-3 w-3" />
                        {job.maxClaimants - activeClaims}/{job.maxClaimants}{" "}
                        frei
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Keine offenen Aufgaben in diesem Kreis.
          </p>
        )}
      </div>
    </div>
  );
}
