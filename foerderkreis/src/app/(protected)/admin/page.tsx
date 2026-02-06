import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Clock,
  Briefcase,
  AlertTriangle,
  Download,
  Flag,
} from "lucide-react";
import { ExportCSVButton } from "./export-csv-button";

export default async function AdminDashboardPage() {
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

  // Stats
  const { count: totalFamilies } = await supabase
    .from("families")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: openJobs } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");

  const { count: flaggedEntries } = await supabase
    .from("volunteer_hours")
    .select("*", { count: "exact", head: true })
    .eq("flagged", true);

  // Hours this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const { data: monthHours } = await supabase
    .from("volunteer_hours")
    .select("hours")
    .gte("date_performed", startOfMonth.toISOString().split("T")[0]);

  const totalHoursThisMonth =
    monthHours?.reduce((sum, h) => sum + Number(h.hours), 0) ?? 0;

  // Inactive families (0 hours this month)
  const { data: allFamilies } = await supabase
    .from("families")
    .select("id, name")
    .eq("is_active", true);

  const { data: activeHours } = await supabase
    .from("volunteer_hours")
    .select("family_id")
    .gte("date_performed", startOfMonth.toISOString().split("T")[0]);

  const activeFamilyIds = new Set(activeHours?.map((h) => h.family_id));
  const inactiveFamilies =
    allFamilies?.filter((f) => !activeFamilyIds.has(f.id)) ?? [];

  // Recent flagged entries
  const { data: flagged } = await supabase
    .from("volunteer_hours")
    .select("*, users(first_name, last_name), families(name)")
    .eq("flagged", true)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-extrabold">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Ueberblick ueber die Schulgemeinschaft
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Familien</span>
            </div>
            <div className="text-2xl font-heading font-extrabold">
              {totalFamilies}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-sage-500" />
              <span className="text-xs text-muted-foreground">
                Stunden (Monat)
              </span>
            </div>
            <div className="text-2xl font-heading font-extrabold">
              {totalHoursThisMonth.toFixed(0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">
                Offene Aufgaben
              </span>
            </div>
            <div className="text-2xl font-heading font-extrabold">
              {openJobs}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-coral-500" />
              <span className="text-xs text-muted-foreground">
                Inaktive Familien
              </span>
            </div>
            <div className="text-2xl font-heading font-extrabold text-coral-500">
              {inactiveFamilies.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CSV Export */}
      <ExportCSVButton />

      {/* Inactive Families */}
      {inactiveFamilies.length > 0 && (
        <div>
          <h2 className="font-heading font-bold mb-3">
            Inaktive Familien (diesen Monat)
          </h2>
          <div className="space-y-2">
            {inactiveFamilies.map((f) => (
              <Card key={f.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="font-medium">{f.name}</div>
                  <Badge variant="secondary" className="text-xs">
                    0 Std.
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Flagged Entries */}
      {flagged && flagged.length > 0 && (
        <div>
          <h2 className="font-heading font-bold mb-3 flex items-center gap-2">
            <Flag className="h-4 w-4 text-coral-500" />
            Markierte Eintraege ({flaggedEntries})
          </h2>
          <div className="space-y-2">
            {flagged.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{entry.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {(entry.users as { first_name: string; last_name: string })?.first_name}{" "}
                        {(entry.users as { first_name: string; last_name: string })?.last_name} &middot;{" "}
                        {(entry.families as { name: string })?.name}
                      </div>
                    </div>
                    <Badge variant="destructive">
                      {Number(entry.hours).toFixed(1)}h
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Admin Links */}
      <div className="grid grid-cols-2 gap-3">
        <Button asChild variant="outline">
          <Link href="/admin/families">Familien verwalten</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/kreise">Kreise verwalten</Link>
        </Button>
      </div>
    </div>
  );
}
