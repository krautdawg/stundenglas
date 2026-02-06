import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This route is called by a cron job
// It sends reminder emails to inactive families

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Get all active families
  const families = await prisma.family.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  // Get hours this year per family
  const hours = await prisma.volunteerHour.groupBy({
    by: ["familyId"],
    where: {
      datePerformed: { gte: startOfYear },
    },
    _sum: { hours: true },
  });

  const hoursMap: Record<string, number> = {};
  hours.forEach((h) => {
    hoursMap[h.familyId] = Number(h._sum.hours) || 0;
  });

  const monthsElapsed = now.getMonth() + 1;
  const reminders: { familyId: string; type: string; familyName: string }[] = [];

  families.forEach((family) => {
    const totalHours = hoursMap[family.id] || 0;

    if (monthsElapsed >= 6 && totalHours < 10) {
      reminders.push({
        familyId: family.id,
        type: "admin_flag",
        familyName: family.name,
      });
    } else if (monthsElapsed >= 4 && totalHours < 5) {
      reminders.push({
        familyId: family.id,
        type: "strong_nudge",
        familyName: family.name,
      });
    } else if (monthsElapsed >= 2 && totalHours === 0) {
      reminders.push({
        familyId: family.id,
        type: "gentle_reminder",
        familyName: family.name,
      });
    }
  });

  // Log reminders (actual email sending would use Resend here)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  for (const reminder of reminders) {
    // Check if we already sent this type of email this month
    const existing = await prisma.emailOutreachLog.findFirst({
      where: {
        familyId: reminder.familyId,
        emailType: reminder.type,
        sentAt: { gte: startOfMonth },
      },
    });

    if (existing) continue;

    // Log the outreach
    await prisma.emailOutreachLog.create({
      data: {
        familyId: reminder.familyId,
        emailType: reminder.type,
        subject: getSubject(reminder.type),
        metadata: { total_hours: hoursMap[reminder.familyId] || 0 },
      },
    });

    // TODO: Send actual email via Resend when API key is configured
  }

  return NextResponse.json({
    processed: families.length,
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
