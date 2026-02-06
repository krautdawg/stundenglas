import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function KreisePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: kreise } = await supabase
    .from("kreise")
    .select("*")
    .eq("is_active", true)
    .order("name");

  // Get membership info for current user
  const { data: memberships } = await supabase
    .from("kreis_memberships")
    .select("kreis_id")
    .eq("user_id", user!.id);

  const memberKreisIds = new Set(memberships?.map((m) => m.kreis_id));

  // Get member counts
  const { data: memberCounts } = await supabase
    .from("kreis_memberships")
    .select("kreis_id")
    .then(({ data }) => {
      const counts: Record<string, number> = {};
      data?.forEach((m) => {
        counts[m.kreis_id] = (counts[m.kreis_id] || 0) + 1;
      });
      return { data: counts };
    });

  // Get open job counts per Kreis
  const { data: jobCounts } = await supabase
    .from("jobs")
    .select("kreis_id")
    .eq("status", "open")
    .then(({ data }) => {
      const counts: Record<string, number> = {};
      data?.forEach((j) => {
        if (j.kreis_id) counts[j.kreis_id] = (counts[j.kreis_id] || 0) + 1;
      });
      return { data: counts };
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
        {kreise?.map((kreis) => {
          const isMember = memberKreisIds.has(kreis.id);
          const members = memberCounts?.[kreis.id] ?? 0;
          const openJobs = jobCounts?.[kreis.id] ?? 0;

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
