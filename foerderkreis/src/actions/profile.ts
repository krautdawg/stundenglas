"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validations";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Nicht angemeldet" };

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

  const { error } = await supabase
    .from("users")
    .update({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      bio: parsed.data.bio || null,
      skill_tags: parsed.data.skill_tags,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: "Profil konnte nicht aktualisiert werden" };

  revalidatePath("/profile");
  return { success: true };
}

export async function updatePrivacyMode(enabled: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Nicht angemeldet" };

  const { error } = await supabase
    .from("users")
    .update({ privacy_mode: enabled })
    .eq("id", user.id);

  if (error) return { error: "Einstellung konnte nicht gespeichert werden" };

  revalidatePath("/profile");
  revalidatePath("/leaderboard");
  return { success: true };
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Nicht angemeldet" };

  const file = formData.get("avatar") as File;
  if (!file) return { error: "Keine Datei ausgewaehlt" };

  if (file.size > 1024 * 1024) {
    return { error: "Datei zu gross (max. 1 MB)" };
  }

  const ext = file.name.split(".").pop();
  const path = `avatars/${user.id}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true });

  if (uploadError) return { error: "Upload fehlgeschlagen" };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  await supabase
    .from("users")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  revalidatePath("/profile");
  return { success: true, url: publicUrl };
}
