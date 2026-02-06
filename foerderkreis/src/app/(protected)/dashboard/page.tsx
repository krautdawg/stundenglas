import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProgressRing } from "@/components/custom/progress-ring";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Briefcase, TrendingUp, Calendar } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("*, families(*)")
    .eq("id", user!.id)
    .single();

  // Get hours this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const startOfYear = new Date();
  startOfYear.setMonth(0, 1);
  startOfYear.setHours(0, 0, 0, 0);

  const familyId = profile?.family_id;

  let hoursThisMonth = 0;
  let hoursThisYear = 0;
  const monthlyTarget = profile?.families?.monthly_hour_target ?? 10;

  if (familyId) {
    const { data: monthHours } = await supabase
      .from("volunteer_hours")
      .select("hours")
      .eq("family_id", familyId)
      .gte("date_performed", startOfMonth.toISOString().split("T")[0]);

    hoursThisMonth =
      monthHours?.reduce((sum, h) => sum + Number(h.hours), 0) ?? 0;

    const { data: yearHours } = await supabase
      .from("volunteer_hours")
      .select("hours")
      .eq("family_id", familyId)
      .gte("date_performed", startOfYear.toISOString().split("T")[0]);

    hoursThisYear =
      yearHours?.reduce((sum, h) => sum + Number(h.hours), 0) ?? 0;
  }

  // Recent activity
  const { data: recentHours } = await supabase
    .from("volunteer_hours")
    .select("*, kreise(name, color)")
    .eq("family_id", familyId ?? "")
    .order("created_at", { ascending: false })
    .limit(3);

  // Available jobs count
  const { count: openJobs } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");

  const firstName = profile?.first_name || "dort";
  const currentMonth = new Date().toLocaleDateString("de-DE", {
    month: "long",
  });

  // Calculate balance
  const monthNumber = new Date().getMonth() + 1;
  const expectedHours = monthNumber * monthlyTarget;
  const balance = hoursThisYear - expectedHours;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-heading font-extrabold">
          Hallo, {firstName}!
        </h1>
        <p className="text-muted-foreground">
          Dein Ueberblick fuer {currentMonth}
        </p>
      </div>

      {/* Progress Ring */}
      <Card>
        <CardContent className="flex flex-col items-center pt-6">
          <ProgressRing current={hoursThisMonth} target={monthlyTarget} />
          <div className="mt-4 flex gap-6 text-center">
            <div>
              <div className="text-lg font-heading font-bold">
                {hoursThisYear.toFixed(1).replace(".", ",")}
              </div>
              <div className="text-xs text-muted-foreground">Dieses Jahr</div>
            </div>
            <div>
              <div className="text-lg font-heading font-bold">
                <span
                  className={
                    balance >= 0 ? "text-sage-600" : "text-coral-500"
                  }
                >
                  {balance >= 0 ? "+" : ""}
                  {balance.toFixed(1).replace(".", ",")}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">Saldo</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button asChild size="lg" className="h-auto py-4 flex-col gap-2">
          <Link href="/hours">
            <Clock className="h-5 w-5" />
            <span className="text-sm">Stunden erfassen</span>
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-auto py-4 flex-col gap-2"
        >
          <Link href="/jobs">
            <Briefcase className="h-5 w-5" />
            <span className="text-sm">
              Aufgaben{" "}
              {openJobs ? (
                <Badge variant="secondary" className="ml-1">
                  {openJobs}
                </Badge>
              ) : null}
            </span>
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-amber-50 p-2">
              <Calendar className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Diesen Monat</div>
              <div className="font-heading font-bold">
                {hoursThisMonth.toFixed(1).replace(".", ",")} Std.
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-sage-50 p-2">
              <TrendingUp className="h-5 w-5 text-sage-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Dieses Jahr</div>
              <div className="font-heading font-bold">
                {hoursThisYear.toFixed(1).replace(".", ",")} Std.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {recentHours && recentHours.length > 0 && (
        <div>
          <h2 className="text-lg font-heading font-bold mb-3">
            Letzte Eintraege
          </h2>
          <div className="space-y-2">
            {recentHours.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex flex-col items-center justify-center min-w-[48px] rounded-lg bg-amber-50 p-2">
                    <span className="text-lg font-heading font-extrabold text-amber-600">
                      {Number(entry.hours).toFixed(1).replace(".", ",")}
                    </span>
                    <span className="text-[10px] text-amber-500 font-medium">
                      Std.
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {entry.description}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(entry.date_performed).toLocaleDateString(
                        "de-DE",
                        { day: "numeric", month: "short" }
                      )}
                    </div>
                    {entry.kreise && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {(entry.kreise as { name: string }).name}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button asChild variant="ghost" className="w-full mt-2">
            <Link href="/hours/history">Alle Eintraege anzeigen</Link>
          </Button>
        </div>
      )}

      {/* Empty state if no family */}
      {!familyId && (
        <Card className="border-dashed">
          <CardContent className="text-center py-8">
            <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
            <h3 className="font-heading font-bold text-lg mb-2">
              Noch keine Familie
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Erstelle oder tritt einer Familie bei, um Stunden zu erfassen.
            </p>
            <Button asChild>
              <Link href="/onboarding">Familie einrichten</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
