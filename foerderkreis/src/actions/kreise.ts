"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function joinKreis(kreisId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nicht angemeldet" };

  try {
    await prisma.kreisMembership.create({
      data: {
        userId: session.user.id,
        kreisId,
      },
    });
  } catch (error: unknown) {
    // Check for unique constraint violation
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { error: "Du bist bereits Mitglied dieses Kreises" };
    }
    return { error: "Beitritt fehlgeschlagen" };
  }

  revalidatePath("/kreise");
  return { success: true };
}

export async function leaveKreis(kreisId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nicht angemeldet" };

  try {
    await prisma.kreisMembership.delete({
      where: {
        userId_kreisId: {
          userId: session.user.id,
          kreisId,
        },
      },
    });
  } catch {
    return { error: "Austritt fehlgeschlagen" };
  }

  revalidatePath("/kreise");
  return { success: true };
}
