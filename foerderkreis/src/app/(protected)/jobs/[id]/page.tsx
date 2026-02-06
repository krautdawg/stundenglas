import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, MapPin, Calendar, Users, User } from "lucide-react";
import { JobActionButtons } from "./action-buttons";

const urgencyLabels: Record<string, { label: string; class: string }> = {
  low: { label: "Niedrig", class: "bg-sage-100 text-sage-700" },
  normal: { label: "Normal", class: "bg-amber-100 text-amber-700" },
  high: { label: "Dringend", class: "bg-coral-100 text-coral-700" },
  critical: { label: "Kritisch", class: "bg-coral-500 text-white" },
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: job } = await supabase
    .from("jobs")
    .select(
      `
      *,
      kreise(name, slug, color),
      users!posted_by(first_name, last_name, avatar_url),
      job_claims(id, user_id, status, users(first_name, last_name))
    `
    )
    .eq("id", id)
    .single();

  if (!job) notFound();

  const urgency = urgencyLabels[job.urgency] ?? urgencyLabels.normal;
  const activeClaims =
    (job.job_claims as { id: string; status: string; user_id: string }[])?.filter(
      (c) => c.status === "claimed" || c.status === "completed"
    ) ?? [];
  const spotsLeft = job.max_claimants - activeClaims.length;
  const userClaim = (
    job.job_claims as { id: string; status: string; user_id: string }[]
  )?.find((c) => c.user_id === user!.id && c.status === "claimed");
  const poster = job.users as { first_name: string; last_name: string };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex gap-2 mb-2">
          <Badge className={urgency.class}>{urgency.label}</Badge>
          {job.kreise && (
            <Badge variant="secondary">
              {(job.kreise as { name: string }).name}
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-heading font-extrabold">{job.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Erstellt von {poster.first_name} {poster.last_name}
        </p>
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex items-center gap-2 p-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              ~{Number(job.estimated_hours).toString().replace(".", ",")} Std.
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {spotsLeft}/{job.max_claimants} frei
            </span>
          </CardContent>
        </Card>
        {job.due_date && (
          <Card>
            <CardContent className="flex items-center gap-2 p-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Bis{" "}
                {new Date(job.due_date).toLocaleDateString("de-DE", {
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
      {job.skills_needed && job.skills_needed.length > 0 && (
        <div>
          <h2 className="font-heading font-bold mb-2">
            Gesucht werden
          </h2>
          <div className="flex gap-2 flex-wrap">
            {job.skills_needed.map((skill: string) => (
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
          <h2 className="font-heading font-bold mb-2">
            Uebernommen von
          </h2>
          <div className="space-y-2">
            {activeClaims.map((claim) => {
              const claimUser = (
                claim as unknown as {
                  users: { first_name: string; last_name: string };
                }
              ).users;
              return (
                <div
                  key={(claim as { id: string }).id}
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-amber-600" />
                  </div>
                  <span className="text-sm">
                    {claimUser?.first_name} {claimUser?.last_name}
                  </span>
                  {(claim as { status: string }).status === "completed" && (
                    <Badge variant="secondary" className="text-xs">
                      Erledigt
                    </Badge>
                  )}
                </div>
              );
            })}
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
