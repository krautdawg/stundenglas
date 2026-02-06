"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { familyCreateSchema, familyJoinSchema } from "@/lib/validations";

type TransactionClient = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export async function createFamily(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nicht angemeldet" };

  const parsed = familyCreateSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    // Create family and link user in a transaction
    const family = await prisma.$transaction(async (tx: TransactionClient) => {
      const newFamily = await tx.family.create({
        data: { name: parsed.data.name },
      });

      await tx.user.update({
        where: { id: session.user.id },
        data: { familyId: newFamily.id },
      });

      return newFamily;
    });

    revalidatePath("/dashboard");
    return { success: true, family };
  } catch {
    return { error: "Familie konnte nicht erstellt werden" };
  }
}

export async function joinFamily(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nicht angemeldet" };

  const parsed = familyJoinSchema.safeParse({
    invite_code: formData.get("invite_code"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Find family by invite code
  const family = await prisma.family.findUnique({
    where: { inviteCode: parsed.data.invite_code.toLowerCase().trim() },
    select: { id: true, name: true },
  });

  if (!family) {
    return { error: "Familie nicht gefunden. Pruefe den Einladungscode." };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { familyId: family.id },
    });
  } catch {
    return { error: "Beitritt fehlgeschlagen" };
  }

  revalidatePath("/dashboard");
  return { success: true, family };
}
