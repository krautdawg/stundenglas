import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This route is called by a cron job (e.g., Vercel Cron or Supabase pg_cron)
// It sends reminder emails to inactive families

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Get all active families
  const { data: families } = await supabase
    .from("families")
    .select("id, name")
    .eq("is_active", true);

  // Get hours this year per family
  const { data: hours } = await supabase
    .from("volunteer_hours")
    .select("family_id, hours")
    .gte("date_performed", startOfYear.toISOString().split("T")[0]);

  const hoursMap: Record<string, number> = {};
  hours?.forEach((h) => {
    hoursMap[h.family_id] = (hoursMap[h.family_id] || 0) + Number(h.hours);
  });

  const monthsElapsed = now.getMonth() + 1;
  const reminders: { family_id: string; type: string; family_name: string }[] =
    [];

  families?.forEach((family) => {
    const totalHours = hoursMap[family.id] || 0;

    if (monthsElapsed >= 6 && totalHours < 10) {
      reminders.push({
        family_id: family.id,
        type: "admin_flag",
        family_name: family.name,
      });
    } else if (monthsElapsed >= 4 && totalHours < 5) {
      reminders.push({
        family_id: family.id,
        type: "strong_nudge",
        family_name: family.name,
      });
    } else if (monthsElapsed >= 2 && totalHours === 0) {
      reminders.push({
        family_id: family.id,
        type: "gentle_reminder",
        family_name: family.name,
      });
    }
  });

  // Log reminders (actual email sending would use Resend here)
  for (const reminder of reminders) {
    // Check if we already sent this type of email this month
    const { data: existing } = await supabase
      .from("email_outreach_log")
      .select("id")
      .eq("family_id", reminder.family_id)
      .eq("email_type", reminder.type)
      .gte("sent_at", new Date(now.getFullYear(), now.getMonth(), 1).toISOString())
      .limit(1);

    if (existing && existing.length > 0) continue;

    // Log the outreach
    await supabase.from("email_outreach_log").insert({
      family_id: reminder.family_id,
      email_type: reminder.type,
      subject: getSubject(reminder.type),
      metadata: { total_hours: hoursMap[reminder.family_id] || 0 },
    });

    // TODO: Send actual email via Resend when API key is configured
    // await sendEmail(reminder.family_id, reminder.type);
  }

  return NextResponse.json({
    processed: families?.length || 0,
    reminders_sent: reminders.length,
  });
}

function getSubject(type: string): string {
  switch (type) {
    case "gentle_reminder":
      return "Wir vermissen dich! Hier sind tolle Moeglichkeiten mitzuhelfen";
    case "strong_nudge":
      return "Die Gemeinschaft braucht dich - hier ist was verfuegbar";
    case "admin_flag":
      return "[Admin] Familie benoetigt persoenliche Kontaktaufnahme";
    default:
      return "Foerderkreis Update";
  }
}
