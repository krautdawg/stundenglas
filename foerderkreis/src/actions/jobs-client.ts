"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JobUrgency } from "@prisma/client";

export async function getKreise() {
  const kreise = await prisma.kreis.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return kreise;
}

export async function createJob(data: {
  title: string;
  description: string | null;
  kreisId: string | null;
  estimatedHours: number;
  urgency: string;
  dueDate: string | null;
  maxClaimants: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nicht angemeldet" };

  try {
    await prisma.job.create({
      data: {
        title: data.title,
        description: data.description,
        kreisId: data.kreisId,
        postedBy: session.user.id,
        estimatedHours: data.estimatedHours,
        urgency: data.urgency as JobUrgency,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        maxClaimants: data.maxClaimants,
      },
    });
  } catch {
    return { error: "Aufgabe konnte nicht erstellt werden" };
  }

  revalidatePath("/jobs");
  return { success: true };
}
