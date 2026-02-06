import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FamilyAdminActions } from "./family-actions";

export default async function AdminFamiliesPage() {
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

  const { data: families } = await supabase
    .from("families")
    .select("*")
    .order("name");

  // Get hours per family this year
  const startOfYear = new Date();
  startOfYear.setMonth(0, 1);

  const { data: hours } = await supabase
    .from("volunteer_hours")
    .select("family_id, hours")
    .gte("date_performed", startOfYear.toISOString().split("T")[0]);

  const hoursMap: Record<string, number> = {};
  hours?.forEach((h) => {
    hoursMap[h.family_id] = (hoursMap[h.family_id] || 0) + Number(h.hours);
  });

  // Get member count per family
  const { data: users } = await supabase
    .from("users")
    .select("family_id");

  const memberMap: Record<string, number> = {};
  users?.forEach((u) => {
    if (u.family_id) memberMap[u.family_id] = (memberMap[u.family_id] || 0) + 1;
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
          <h1 className="text-2xl font-heading font-extrabold">Familien</h1>
          <p className="text-muted-foreground">
            {families?.length} Familien registriert
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {families?.map((family) => (
          <Card key={family.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-heading font-bold">{family.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {memberMap[family.id] || 0} Mitglieder &middot; Code:{" "}
                    <code className="text-xs bg-muted px-1 rounded">
                      {family.invite_code}
                    </code>
                  </div>
                  <div className="text-sm mt-1">
                    <span className="font-medium">
                      {(hoursMap[family.id] || 0).toFixed(1)}h
                    </span>{" "}
                    <span className="text-muted-foreground">
                      / Ziel: {Number(family.monthly_hour_target)}h/Monat
                    </span>
                  </div>
                  {family.notes && (
                    <div className="text-xs text-muted-foreground mt-1 italic">
                      Notiz: {family.notes}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {!family.is_active && (
                    <Badge variant="destructive">Inaktiv</Badge>
                  )}
                  {family.monthly_hour_target !== 10 && (
                    <Badge variant="secondary" className="text-xs">
                      Angepasstes Ziel
                    </Badge>
                  )}
                </div>
              </div>
              <FamilyAdminActions
                familyId={family.id}
                currentTarget={Number(family.monthly_hour_target)}
                currentNotes={family.notes || ""}
                isActive={family.is_active}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
