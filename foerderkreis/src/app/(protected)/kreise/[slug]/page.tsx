import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: kreis } = await supabase
    .from("kreise")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!kreis) notFound();

  // Members
  const { data: members } = await supabase
    .from("kreis_memberships")
    .select("role, users(id, first_name, last_name, avatar_url)")
    .eq("kreis_id", kreis.id);

  // Check if current user is member
  const isMember = members?.some(
    (m) => (m.users as unknown as { id: string })?.id === user!.id
  );

  // Jobs for this Kreis
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*, job_claims(id, status)")
    .eq("kreis_id", kreis.id)
    .in("status", ["open", "claimed", "in_progress"])
    .order("urgency", { ascending: false })
    .limit(10);

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
          Mitglieder ({members?.length ?? 0})
        </h2>
        <div className="flex flex-wrap gap-3">
          {members?.map((m) => {
            const memberUser = m.users as unknown as {
              id: string;
              first_name: string;
              last_name: string;
              avatar_url: string | null;
            };
            return (
              <div
                key={memberUser.id}
                className="flex items-center gap-2 bg-muted rounded-full pl-1 pr-3 py-1"
              >
                <div className="w-7 h-7 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-800">
                  {memberUser.first_name[0]}
                  {memberUser.last_name[0]}
                </div>
                <span className="text-sm">
                  {memberUser.first_name} {memberUser.last_name[0]}.
                </span>
                {m.role === "lead" && (
                  <Badge variant="secondary" className="text-[10px]">
                    Leitung
                  </Badge>
                )}
              </div>
            );
          })}
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
              const activeClaims =
                (
                  job.job_claims as { id: string; status: string }[]
                )?.filter(
                  (c) =>
                    c.status === "claimed" || c.status === "completed"
                ).length ?? 0;

              return (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <Card className="hover:shadow-md transition-shadow mb-2">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{job.title}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {Number(job.estimated_hours)
                            .toString()
                            .replace(".", ",")}
                          h
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Users className="h-3 w-3" />
                        {job.max_claimants - activeClaims}/
                        {job.max_claimants} frei
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
