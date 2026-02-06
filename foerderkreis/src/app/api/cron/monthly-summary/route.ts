import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Called on the 1st of each month to send monthly summaries to all families

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get last month's date range
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const lastMonthName = lastMonth.toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });

  // Get all active families
  const { data: families } = await supabase
    .from("families")
    .select("id, name, monthly_hour_target")
    .eq("is_active", true);

  // Get last month's hours
  const { data: hours } = await supabase
    .from("volunteer_hours")
    .select("family_id, hours")
    .gte("date_performed", lastMonth.toISOString().split("T")[0])
    .lte("date_performed", lastMonthEnd.toISOString().split("T")[0]);

  const hoursMap: Record<string, number> = {};
  hours?.forEach((h) => {
    hoursMap[h.family_id] = (hoursMap[h.family_id] || 0) + Number(h.hours);
  });

  // Get new available jobs
  const { count: newJobs } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");

  let summariesSent = 0;

  for (const family of families || []) {
    const familyHours = hoursMap[family.id] || 0;

    // Log the summary
    await supabase.from("email_outreach_log").insert({
      family_id: family.id,
      email_type: "monthly_summary",
      subject: `Dein Monatsrueckblick: ${lastMonthName}`,
      metadata: {
        month: lastMonthName,
        hours: familyHours,
        target: family.monthly_hour_target,
        open_jobs: newJobs,
      },
    });

    // TODO: Send actual email via Resend
    summariesSent++;
  }

  return NextResponse.json({
    month: lastMonthName,
    summaries_sent: summariesSent,
    open_jobs: newJobs,
  });
}
