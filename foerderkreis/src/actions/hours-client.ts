"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getKreise() {
  const kreise = await prisma.kreis.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return kreise;
}

export async function logHoursClient(data: {
  hours: number;
  description: string;
  datePerformed: string;
  kreisId: string | null;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nicht angemeldet" };

  // Get user's family
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { familyId: true },
  });

  if (!user?.familyId) {
    return { error: "Du gehoerst noch keiner Familie an" };
  }

  try {
    await prisma.volunteerHour.create({
      data: {
        userId: session.user.id,
        familyId: user.familyId,
        kreisId: data.kreisId || null,
        hours: data.hours,
        description: data.description,
        datePerformed: new Date(data.datePerformed),
      },
    });
  } catch {
    return { error: "Stunden konnten nicht erfasst werden" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/hours");
  revalidatePath("/hours/history");
  revalidatePath("/leaderboard");
  return { success: true };
}
