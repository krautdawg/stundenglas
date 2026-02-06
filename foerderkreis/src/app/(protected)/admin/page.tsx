import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Clock,
  Briefcase,
  AlertTriangle,
  Flag,
} from "lucide-react";
import { ExportCSVButton } from "./export-csv-button";

export default async function AdminDashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (profile?.role !== "ADMIN") redirect("/dashboard");

  // Stats
  const totalFamilies = await prisma.family.count({
    where: { isActive: true },
  });

  const openJobs = await prisma.job.count({
    where: { status: "OPEN" },
  });

  const flaggedEntries = await prisma.volunteerHour.count({
    where: { flagged: true },
  });

  // Hours this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthHoursResult = await prisma.volunteerHour.aggregate({
    where: {
      datePerformed: { gte: startOfMonth },
    },
    _sum: { hours: true },
  });

  const totalHoursThisMonth = Number(monthHoursResult._sum.hours ?? 0);

  // Inactive families (0 hours this month)
  const allFamilies = await prisma.family.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  const activeHours = await prisma.volunteerHour.findMany({
    where: {
      datePerformed: { gte: startOfMonth },
    },
    select: { familyId: true },
  });

  const activeFamilyIds = new Set(activeHours.map((h) => h.familyId));
  const inactiveFamilies = allFamilies.filter((f) => !activeFamilyIds.has(f.id));

  // Recent flagged entries
  const flagged = await prisma.volunteerHour.findMany({
    where: { flagged: true },
    include: {
      user: { select: { firstName: true, lastName: true } },
      family: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

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
                        {entry.user.firstName} {entry.user.lastName} &middot;{" "}
                        {entry.family.name}
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
