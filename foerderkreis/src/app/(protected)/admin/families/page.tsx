import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FamilyAdminActions } from "./family-actions";

export default async function AdminFamiliesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (profile?.role !== "ADMIN") redirect("/dashboard");

  const families = await prisma.family.findMany({
    orderBy: { name: "asc" },
  });

  // Get hours per family this year
  const startOfYear = new Date();
  startOfYear.setMonth(0, 1);
  startOfYear.setHours(0, 0, 0, 0);

  const hours = await prisma.volunteerHour.findMany({
    where: {
      datePerformed: { gte: startOfYear },
    },
    select: { familyId: true, hours: true },
  });

  const hoursMap: Record<string, number> = {};
  hours.forEach((h) => {
    hoursMap[h.familyId] = (hoursMap[h.familyId] || 0) + Number(h.hours);
  });

  // Get member count per family
  const users = await prisma.user.findMany({
    select: { familyId: true },
  });

  const memberMap: Record<string, number> = {};
  users.forEach((u) => {
    if (u.familyId) memberMap[u.familyId] = (memberMap[u.familyId] || 0) + 1;
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
            {families.length} Familien registriert
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {families.map((family) => (
          <Card key={family.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-heading font-bold">{family.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {memberMap[family.id] || 0} Mitglieder &middot; Code:{" "}
                    <code className="text-xs bg-muted px-1 rounded">
                      {family.inviteCode}
                    </code>
                  </div>
                  <div className="text-sm mt-1">
                    <span className="font-medium">
                      {(hoursMap[family.id] || 0).toFixed(1)}h
                    </span>{" "}
                    <span className="text-muted-foreground">
                      / Ziel: {Number(family.monthlyHourTarget)}h/Monat
                    </span>
                  </div>
                  {family.notes && (
                    <div className="text-xs text-muted-foreground mt-1 italic">
                      Notiz: {family.notes}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {!family.isActive && (
                    <Badge variant="destructive">Inaktiv</Badge>
                  )}
                  {Number(family.monthlyHourTarget) !== 10 && (
                    <Badge variant="secondary" className="text-xs">
                      Angepasstes Ziel
                    </Badge>
                  )}
                </div>
              </div>
              <FamilyAdminActions
                familyId={family.id}
                currentTarget={Number(family.monthlyHourTarget)}
                currentNotes={family.notes || ""}
                isActive={family.isActive}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
