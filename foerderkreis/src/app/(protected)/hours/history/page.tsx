import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { HoursDeleteButton } from "./delete-button";

export default async function HoursHistoryPage() {
  const session = await auth();
  const userId = session!.user.id;

  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: { familyId: true },
  });

  const hours = await prisma.volunteerHour.findMany({
    where: { familyId: profile?.familyId ?? "" },
    include: { kreis: { select: { name: true, color: true } } },
    orderBy: { datePerformed: "desc" },
    take: 100,
  });

  // Group by month
  const grouped: Record<string, typeof hours> = {};
  hours.forEach((entry) => {
    const monthKey = new Date(entry.datePerformed).toLocaleDateString("de-DE", {
      month: "long",
      year: "numeric",
    });
    if (!grouped[monthKey]) grouped[monthKey] = [];
    grouped[monthKey]!.push(entry);
  });

  // Monthly totals
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const thisMonthHours = hours
    .filter((h) => new Date(h.datePerformed) >= startOfMonth)
    .reduce((sum, h) => sum + Number(h.hours), 0);

  const monthlyTarget = 10;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-extrabold">
            Meine Stunden
          </h1>
          <p className="text-muted-foreground">
            Diesen Monat: {thisMonthHours.toFixed(1).replace(".", ",")} /{" "}
            {monthlyTarget} Std.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/hours">
            <Plus className="h-4 w-4 mr-1" />
            Neu
          </Link>
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{
            width: `${Math.min((thisMonthHours / monthlyTarget) * 100, 100)}%`,
          }}
        />
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">🌱</div>
            <h3 className="font-heading font-bold text-lg mb-2">
              Noch keine Stunden erfasst
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Jeder Beitrag zaehlt! Erfasse deine ersten freiwilligen Stunden.
            </p>
            <Button asChild>
              <Link href="/hours">Erste Stunden erfassen</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([month, entries]) => {
          const monthTotal =
            entries?.reduce((sum, h) => sum + Number(h.hours), 0) ?? 0;
          return (
            <div key={month}>
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-heading font-bold">{month}</h2>
                <span className="text-sm text-muted-foreground">
                  {monthTotal.toFixed(1).replace(".", ",")} Std.
                </span>
              </div>
              <div className="space-y-2">
                {entries?.map((entry) => {
                  const isEditable =
                    new Date(entry.createdAt) >
                    new Date(Date.now() - 48 * 60 * 60 * 1000);
                  return (
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
                            {new Date(entry.datePerformed).toLocaleDateString(
                              "de-DE",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </div>
                          {entry.kreis && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {entry.kreis.name}
                            </Badge>
                          )}
                          {entry.flagged && (
                            <Badge
                              variant="destructive"
                              className="mt-1 text-xs ml-1"
                            >
                              Markiert
                            </Badge>
                          )}
                        </div>
                        {isEditable && <HoursDeleteButton hourId={entry.id} />}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
