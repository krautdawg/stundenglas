import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, MapPin, Calendar, Users, User } from "lucide-react";
import { JobActionButtons } from "./action-buttons";

const urgencyLabels: Record<string, { label: string; class: string }> = {
  LOW: { label: "Niedrig", class: "bg-sage-100 text-sage-700" },
  NORMAL: { label: "Normal", class: "bg-amber-100 text-amber-700" },
  HIGH: { label: "Dringend", class: "bg-coral-100 text-coral-700" },
  CRITICAL: { label: "Kritisch", class: "bg-coral-500 text-white" },
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      kreis: { select: { name: true, slug: true, color: true } },
      poster: { select: { firstName: true, lastName: true, avatarUrl: true } },
      claims: {
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!job) notFound();

  const urgency = urgencyLabels[job.urgency] ?? urgencyLabels.NORMAL;
  const activeClaims = job.claims.filter(
    (c) => c.status === "CLAIMED" || c.status === "COMPLETED"
  );
  const spotsLeft = job.maxClaimants - activeClaims.length;
  const userClaim = job.claims.find(
    (c) => c.userId === userId && c.status === "CLAIMED"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex gap-2 mb-2">
          <Badge className={urgency.class}>{urgency.label}</Badge>
          {job.kreis && <Badge variant="secondary">{job.kreis.name}</Badge>}
        </div>
        <h1 className="text-2xl font-heading font-extrabold">{job.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Erstellt von {job.poster.firstName} {job.poster.lastName}
        </p>
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex items-center gap-2 p-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              ~{Number(job.estimatedHours).toString().replace(".", ",")} Std.
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {spotsLeft}/{job.maxClaimants} frei
            </span>
          </CardContent>
        </Card>
        {job.dueDate && (
          <Card>
            <CardContent className="flex items-center gap-2 p-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Bis{" "}
                {new Date(job.dueDate).toLocaleDateString("de-DE", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </CardContent>
          </Card>
        )}
        {job.location && (
          <Card>
            <CardContent className="flex items-center gap-2 p-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm truncate">{job.location}</span>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Description */}
      {job.description && (
        <div>
          <h2 className="font-heading font-bold mb-2">Beschreibung</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {job.description}
          </p>
        </div>
      )}

      {/* Skills needed */}
      {job.skillsNeeded && job.skillsNeeded.length > 0 && (
        <div>
          <h2 className="font-heading font-bold mb-2">Gesucht werden</h2>
          <div className="flex gap-2 flex-wrap">
            {job.skillsNeeded.map((skill: string) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Claimants */}
      {activeClaims.length > 0 && (
        <div>
          <h2 className="font-heading font-bold mb-2">Uebernommen von</h2>
          <div className="space-y-2">
            {activeClaims.map((claim) => (
              <div key={claim.id} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-sm">
                  {claim.user.firstName} {claim.user.lastName}
                </span>
                {claim.status === "COMPLETED" && (
                  <Badge variant="secondary" className="text-xs">
                    Erledigt
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <JobActionButtons
        jobId={job.id}
        hasClaimed={!!userClaim}
        spotsLeft={spotsLeft}
        jobStatus={job.status}
      />
    </div>
  );
}
