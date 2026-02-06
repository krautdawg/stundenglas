import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

export default async function AdminKreisePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: kreise } = await supabase
    .from("kreise")
    .select("*")
    .order("name");

  // Get member counts
  const { data: memberships } = await supabase
    .from("kreis_memberships")
    .select("kreis_id");

  const memberMap: Record<string, number> = {};
  memberships?.forEach((m) => {
    memberMap[m.kreis_id] = (memberMap[m.kreis_id] || 0) + 1;
  });

  // Get job counts
  const { data: jobs } = await supabase
    .from("jobs")
    .select("kreis_id, status");

  const jobMap: Record<string, { open: number; total: number }> = {};
  jobs?.forEach((j) => {
    if (j.kreis_id) {
      if (!jobMap[j.kreis_id]) jobMap[j.kreis_id] = { open: 0, total: 0 };
      jobMap[j.kreis_id].total++;
      if (j.status === "open") jobMap[j.kreis_id].open++;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-extrabold">
            Kreise verwalten
          </h1>
          <p className="text-muted-foreground">{kreise?.length} Kreise</p>
        </div>
      </div>

      <div className="space-y-2">
        {kreise?.map((kreis) => (
          <Card key={kreis.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{kreis.icon || "🔵"}</div>
                <div className="flex-1">
                  <div className="font-heading font-bold">{kreis.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {kreis.description}
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {memberMap[kreis.id] || 0} Mitglieder
                    </span>
                    <span>
                      {jobMap[kreis.id]?.open || 0} offene Aufgaben
                    </span>
                  </div>
                </div>
                <div>
                  {!kreis.is_active && (
                    <Badge variant="destructive">Inaktiv</Badge>
                  )}
                  {kreis.color && (
                    <div
                      className="w-4 h-4 rounded-full mt-1"
                      style={{ backgroundColor: kreis.color }}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
