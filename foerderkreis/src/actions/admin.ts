"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function updateFamilyAdmin(
  familyId: string,
  data: {
    monthlyHourTarget: number;
    notes: string | null;
  }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nicht angemeldet" };

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return { error: "Keine Berechtigung" };
  }

  try {
    await prisma.family.update({
      where: { id: familyId },
      data: {
        monthlyHourTarget: data.monthlyHourTarget,
        notes: data.notes,
      },
    });
  } catch {
    return { error: "Familie konnte nicht aktualisiert werden" };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/families");
  return { success: true };
}

export async function getExportData() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nicht angemeldet" };

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return { error: "Keine Berechtigung" };
  }

  const families = await prisma.family.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  const startOfYear = new Date();
  startOfYear.setMonth(0, 1);
  startOfYear.setHours(0, 0, 0, 0);

  const hours = await prisma.volunteerHour.findMany({
    where: {
      datePerformed: { gte: startOfYear },
    },
    select: { familyId: true, hours: true },
  });

  // Build family hours map
  const familyHours: Record<string, number> = {};
  hours.forEach((h: { familyId: string; hours: unknown }) => {
    familyHours[h.familyId] = (familyHours[h.familyId] || 0) + Number(h.hours);
  });

  return { families, familyHours };
}
