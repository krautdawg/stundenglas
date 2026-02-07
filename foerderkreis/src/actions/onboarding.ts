"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

// Generate a short, readable invite code (8 chars, lowercase alphanumeric)
function generateInviteCode(): string {
  return nanoid(8).toLowerCase();
}

export async function createFamily(name: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nicht angemeldet" };

  try {
    const inviteCode = generateInviteCode();
    const family = await prisma.family.create({
      data: { name, inviteCode },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { familyId: family.id },
    });
  } catch {
    return { error: "Familie konnte nicht erstellt werden" };
  }

  return { success: true };
}

export async function joinFamily(inviteCode: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nicht angemeldet" };

  const family = await prisma.family.findUnique({
    where: { inviteCode: inviteCode.toLowerCase().trim() },
  });

  if (!family) {
    return { error: "Familie nicht gefunden" };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { familyId: family.id },
    });
  } catch {
    return { error: "Beitritt fehlgeschlagen" };
  }

  return { success: true };
}

export async function updateOnboardingProfile(data: {
  firstName: string;
  lastName: string;
  skillTags: string[];
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nicht angemeldet" };

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        skillTags: data.skillTags,
      },
    });
  } catch {
    return { error: "Profil konnte nicht aktualisiert werden" };
  }

  return { success: true };
}

export async function getKreise() {
  const kreise = await prisma.kreis.findMany({
    where: { isActive: true },
    select: { id: true, name: true, icon: true },
    orderBy: { name: "asc" },
  });
  return kreise;
}

export async function joinKreise(kreisIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nicht angemeldet" };

  try {
    await prisma.kreisMembership.createMany({
      data: kreisIds.map((kreisId) => ({
        userId: session.user.id,
        kreisId,
      })),
      skipDuplicates: true,
    });
  } catch {
    return { error: "Kreise-Beitritt fehlgeschlagen" };
  }

  return { success: true };
}

export async function completeOnboarding() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nicht angemeldet" };

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingCompleted: true },
    });
  } catch {
    return { error: "Onboarding konnte nicht abgeschlossen werden" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
