"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validations";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nicht angemeldet" };

  const raw = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    bio: (formData.get("bio") as string) || undefined,
    skill_tags: JSON.parse((formData.get("skill_tags") as string) || "[]"),
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: parsed.data.first_name,
        lastName: parsed.data.last_name,
        bio: parsed.data.bio || null,
        skillTags: parsed.data.skill_tags,
      },
    });
  } catch {
    return { error: "Profil konnte nicht aktualisiert werden" };
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function updatePrivacyMode(enabled: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nicht angemeldet" };

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { privacyMode: enabled },
    });
  } catch {
    return { error: "Einstellung konnte nicht gespeichert werden" };
  }

  revalidatePath("/profile");
  revalidatePath("/leaderboard");
  return { success: true };
}

export async function uploadAvatar(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nicht angemeldet" };

  const file = formData.get("avatar") as File;
  if (!file) return { error: "Keine Datei ausgewaehlt" };

  if (file.size > 1024 * 1024) {
    return { error: "Datei zu gross (max. 1 MB)" };
  }

  // For now, we'll use a base64 data URL (simple solution)
  // In production, you'd use S3, Cloudflare R2, or similar
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const mimeType = file.type || "image/png";
  const dataUrl = `data:${mimeType};base64,${base64}`;

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: dataUrl },
    });
  } catch {
    return { error: "Upload fehlgeschlagen" };
  }

  revalidatePath("/profile");
  return { success: true, url: dataUrl };
}
