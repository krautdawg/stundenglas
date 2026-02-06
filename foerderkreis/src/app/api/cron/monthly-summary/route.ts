import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Called on the 1st of each month to send monthly summaries to all families

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get last month's date range
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const lastMonthName = lastMonth.toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });

  // Get all active families
  const families = await prisma.family.findMany({
    where: { isActive: true },
    select: { id: true, name: true, monthlyHourTarget: true },
  });

  // Get last month's hours grouped by family
  const hours = await prisma.volunteerHour.groupBy({
    by: ["familyId"],
    where: {
      datePerformed: {
        gte: lastMonth,
        lte: lastMonthEnd,
      },
    },
    _sum: { hours: true },
  });

  const hoursMap: Record<string, number> = {};
  hours.forEach((h) => {
    hoursMap[h.familyId] = Number(h._sum.hours) || 0;
  });

  // Get count of open jobs
  const newJobs = await prisma.job.count({
    where: { status: "OPEN" },
  });

  let summariesSent = 0;

  for (const family of families) {
    const familyHours = hoursMap[family.id] || 0;

    // Log the summary
    await prisma.emailOutreachLog.create({
      data: {
        familyId: family.id,
        emailType: "monthly_summary",
        subject: `Dein Monatsrueckblick: ${lastMonthName}`,
        metadata: {
          month: lastMonthName,
          hours: familyHours,
          target: Number(family.monthlyHourTarget),
          open_jobs: newJobs,
        },
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
