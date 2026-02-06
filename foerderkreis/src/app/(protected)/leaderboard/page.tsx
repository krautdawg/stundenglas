import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Eye, EyeOff } from "lucide-react";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("family_id")
    .eq("id", user!.id)
    .single();

  // Get all families with their hours this year
  const startOfYear = new Date();
  startOfYear.setMonth(0, 1);
  startOfYear.setHours(0, 0, 0, 0);

  const { data: families } = await supabase
    .from("families")
    .select("id, name, monthly_hour_target")
    .eq("is_active", true);

  const { data: allHours } = await supabase
    .from("volunteer_hours")
    .select("family_id, hours")
    .gte("date_performed", startOfYear.toISOString().split("T")[0]);

  // Get privacy modes
  const { data: allUsers } = await supabase
    .from("users")
    .select("family_id, privacy_mode");

  // Build family privacy map (if any member has privacy_mode, family is private)
  const privacyMap: Record<string, boolean> = {};
  allUsers?.forEach((u) => {
    if (u.family_id && u.privacy_mode) {
      privacyMap[u.family_id] = true;
    }
  });

  // Build hours per family
  const hoursMap: Record<string, number> = {};
  allHours?.forEach((h) => {
    hoursMap[h.family_id] = (hoursMap[h.family_id] || 0) + Number(h.hours);
  });

  // Create leaderboard
  const leaderboard =
    families
      ?.map((f) => ({
        family_id: f.id,
        family_name: f.name,
        total_hours: hoursMap[f.id] || 0,
        privacy_mode: privacyMap[f.id] || false,
        monthly_target: f.monthly_hour_target,
        is_own: f.id === profile?.family_id,
      }))
      .sort((a, b) => b.total_hours - a.total_hours) ?? [];

  const maxHours = leaderboard[0]?.total_hours || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-extrabold">Rangliste</h1>
        <p className="text-muted-foreground">
          Beitraege unserer Familien in diesem Jahr
        </p>
      </div>

      {/* Top 3 podium */}
      {leaderboard.length >= 3 && (
        <div className="flex justify-center items-end gap-2 pt-4">
          {/* 2nd place */}
          <div className="flex flex-col items-center w-1/3">
            <div className="text-2xl mb-1">🥈</div>
            <div className="text-xs font-medium text-center truncate w-full">
              {leaderboard[1].privacy_mode
                ? "Anonym"
                : leaderboard[1].family_name}
            </div>
            <div className="text-sm font-heading font-bold text-muted-foreground">
              {leaderboard[1].total_hours.toFixed(1).replace(".", ",")}h
            </div>
          </div>
          {/* 1st place */}
          <div className="flex flex-col items-center w-1/3">
            <div className="text-3xl mb-1">🥇</div>
            <div className="text-sm font-semibold text-center truncate w-full">
              {leaderboard[0].privacy_mode
                ? "Anonym"
                : leaderboard[0].family_name}
            </div>
            <div className="text-lg font-heading font-extrabold text-primary">
              {leaderboard[0].total_hours.toFixed(1).replace(".", ",")}h
            </div>
          </div>
          {/* 3rd place */}
          <div className="flex flex-col items-center w-1/3">
            <div className="text-2xl mb-1">🥉</div>
            <div className="text-xs font-medium text-center truncate w-full">
              {leaderboard[2].privacy_mode
                ? "Anonym"
                : leaderboard[2].family_name}
            </div>
            <div className="text-sm font-heading font-bold text-muted-foreground">
              {leaderboard[2].total_hours.toFixed(1).replace(".", ",")}h
            </div>
          </div>
        </div>
      )}

      {/* Full list */}
      <div className="space-y-2">
        {leaderboard.map((entry, index) => (
          <Card
            key={entry.family_id}
            className={
              entry.is_own
                ? "border-primary bg-amber-50"
                : index < 3
                ? "bg-amber-50/50"
                : ""
            }
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="text-xl font-heading font-extrabold text-muted-foreground min-w-[32px] text-center">
                {index < 3 ? (
                  <span className="text-primary">{index + 1}</span>
                ) : (
                  index + 1
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium truncate ${
                      entry.privacy_mode
                        ? "text-muted-foreground italic"
                        : ""
                    }`}
                  >
                    {entry.privacy_mode ? "Anonyme Familie" : entry.family_name}
                  </span>
                  {entry.is_own && (
                    <Badge variant="secondary" className="text-[10px]">
                      Du
                    </Badge>
                  )}
                  {entry.privacy_mode && (
                    <EyeOff className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <div className="h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      index < 3 ? "bg-primary" : "bg-sage-500"
                    }`}
                    style={{
                      width: `${(entry.total_hours / maxHours) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="font-heading font-bold text-lg">
                {entry.total_hours.toFixed(1).replace(".", ",")}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {leaderboard.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="text-center py-12">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading font-bold text-lg mb-2">
              Noch keine Daten
            </h3>
            <p className="text-sm text-muted-foreground">
              Die Rangliste wird gefuellt sobald Familien Stunden erfassen.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
