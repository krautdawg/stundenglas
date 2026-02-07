"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validations";
import sharp from "sharp";

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

  if (file.size > 5 * 1024 * 1024) {
    return { error: "Datei zu gross (max. 5 MB)" };
  }

  try {
    // Convert to webp, resize to max 256x256, and compress
    const buffer = Buffer.from(await file.arrayBuffer());
    const webpBuffer = await sharp(buffer)
      .resize(256, 256, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();

    const base64 = webpBuffer.toString("base64");
    const dataUrl = `data:image/webp;base64,${base64}`;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: dataUrl },
    });

    revalidatePath("/profile");
    return { success: true, url: dataUrl };
  } catch (error) {
    console.error("Avatar upload error:", error);
    return { error: "Upload fehlgeschlagen" };
  }
}
