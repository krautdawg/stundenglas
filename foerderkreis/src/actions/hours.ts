"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logHoursSchema } from "@/lib/validations";

export async function logHours(formData: FormData) {
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

  const raw = {
    date_performed: formData.get("date_performed") as string,
    hours: parseFloat(formData.get("hours") as string),
    description: formData.get("description") as string,
    kreis_id: (formData.get("kreis_id") as string) || null,
  };

  const parsed = logHoursSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await prisma.volunteerHour.create({
      data: {
        userId: session.user.id,
        familyId: user.familyId,
        kreisId: parsed.data.kreis_id || null,
        hours: parsed.data.hours,
        description: parsed.data.description,
        datePerformed: new Date(parsed.data.date_performed),
      },
    });
  } catch {
    return { error: "Stunden konnten nicht erfasst werden" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/hours");
  revalidatePath("/leaderboard");
  return { success: true };
}

export async function updateHours(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nicht angemeldet" };

  const raw = {
    date_performed: formData.get("date_performed") as string,
    hours: parseFloat(formData.get("hours") as string),
    description: formData.get("description") as string,
    kreis_id: (formData.get("kreis_id") as string) || null,
  };

  const parsed = logHoursSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await prisma.volunteerHour.updateMany({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        hours: parsed.data.hours,
        description: parsed.data.description,
        datePerformed: new Date(parsed.data.date_performed),
        kreisId: parsed.data.kreis_id || null,
      },
    });
  } catch {
    return { error: "Eintrag konnte nicht aktualisiert werden" };
  }

  revalidatePath("/hours");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteHours(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nicht angemeldet" };

  try {
    await prisma.volunteerHour.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    });
  } catch {
    return { error: "Eintrag konnte nicht geloescht werden" };
  }

  revalidatePath("/hours");
  revalidatePath("/dashboard");
  return { success: true };
}
