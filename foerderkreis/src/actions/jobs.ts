"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jobSchema } from "@/lib/validations";
import { JobStatus, JobUrgency } from "@prisma/client";

export async function createJob(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nicht angemeldet" };

  const raw = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    kreis_id: (formData.get("kreis_id") as string) || null,
    estimated_hours: parseFloat(formData.get("estimated_hours") as string),
    urgency: formData.get("urgency") as string,
    location: (formData.get("location") as string) || undefined,
    skills_needed: JSON.parse(
      (formData.get("skills_needed") as string) || "[]"
    ),
    due_date: (formData.get("due_date") as string) || null,
    max_claimants: parseInt(formData.get("max_claimants") as string) || 1,
  };

  const parsed = jobSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await prisma.job.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        kreisId: parsed.data.kreis_id,
        estimatedHours: parsed.data.estimated_hours,
        urgency: parsed.data.urgency.toUpperCase() as JobUrgency,
        location: parsed.data.location,
        skillsNeeded: parsed.data.skills_needed,
        dueDate: parsed.data.due_date ? new Date(parsed.data.due_date) : null,
        maxClaimants: parsed.data.max_claimants,
        postedBy: session.user.id,
      },
    });
  } catch {
    return { error: "Aufgabe konnte nicht erstellt werden" };
  }

  revalidatePath("/jobs");
  return { success: true };
}

export async function claimJob(jobId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nicht angemeldet" };

  // Check if already claimed
  const existing = await prisma.jobClaim.findUnique({
    where: {
      jobId_userId: { jobId, userId: session.user.id },
    },
  });

  if (existing) return { error: "Du hast diese Aufgabe bereits uebernommen" };

  // Check if max claimants reached
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { maxClaimants: true },
  });

  const claimCount = await prisma.jobClaim.count({
    where: {
      jobId,
      status: { in: ["CLAIMED", "COMPLETED"] },
    },
  });

  if (job && claimCount >= job.maxClaimants) {
    return { error: "Alle Plaetze sind bereits vergeben" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.jobClaim.create({
        data: {
          jobId,
          userId: session.user.id,
        },
      });

      // Update job status if first claim
      await tx.job.updateMany({
        where: { id: jobId, status: "OPEN" },
        data: { status: "CLAIMED" },
      });
    });
  } catch {
    return { error: "Aufgabe konnte nicht uebernommen werden" };
  }

  revalidatePath("/jobs");
  return { success: true };
}

export async function completeJobClaim(jobId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nicht angemeldet" };

  // Get user's family and job details
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { familyId: true },
  });

  if (!user?.familyId) {
    return { error: "Du gehoerst noch keiner Familie an" };
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { estimatedHours: true, kreisId: true, title: true },
  });

  if (!job) return { error: "Aufgabe nicht gefunden" };

  try {
    await prisma.$transaction(async (tx) => {
      // Update claim status
      await tx.jobClaim.updateMany({
        where: { jobId, userId: session.user.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });

      // Auto-log hours
      await tx.volunteerHour.create({
        data: {
          userId: session.user.id,
          familyId: user.familyId!,
          kreisId: job.kreisId,
          jobId,
          hours: job.estimatedHours,
          description: `Aufgabe erledigt: ${job.title}`,
          datePerformed: new Date(),
        },
      });

      // Check if all claims are completed
      const activeClaims = await tx.jobClaim.count({
        where: { jobId, status: "CLAIMED" },
      });

      if (activeClaims === 0) {
        await tx.job.update({
          where: { id: jobId },
          data: { status: "COMPLETED" },
        });
      }
    });
  } catch {
    return { error: "Status konnte nicht aktualisiert werden" };
  }

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  revalidatePath("/hours");
  return { success: true };
}

export async function withdrawClaim(jobId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nicht angemeldet" };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.jobClaim.updateMany({
        where: { jobId, userId: session.user.id, status: "CLAIMED" },
        data: { status: "WITHDRAWN" },
      });

      // Check if any claims remain, reopen if not
      const remainingClaims = await tx.jobClaim.count({
        where: {
          jobId,
          status: { in: ["CLAIMED", "COMPLETED"] },
        },
      });

      if (remainingClaims === 0) {
        await tx.job.update({
          where: { id: jobId },
          data: { status: "OPEN" },
        });
      }
    });
  } catch {
    return { error: "Konnte nicht zurueckgezogen werden" };
  }

  revalidatePath("/jobs");
  return { success: true };
}
