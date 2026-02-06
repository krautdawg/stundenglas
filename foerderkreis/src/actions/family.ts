"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { familyCreateSchema, familyJoinSchema } from "@/lib/validations";

export async function createFamily(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Nicht angemeldet" };

  const parsed = familyCreateSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Create family
  const { data: family, error: familyError } = await supabase
    .from("families")
    .insert({ name: parsed.data.name })
    .select()
    .single();

  if (familyError || !family) {
    return { error: "Familie konnte nicht erstellt werden" };
  }

  // Link user to family
  const { error: linkError } = await supabase
    .from("users")
    .update({ family_id: family.id })
    .eq("id", user.id);

  if (linkError) {
    return { error: "Verknuepfung mit Familie fehlgeschlagen" };
  }

  revalidatePath("/dashboard");
  return { success: true, family };
}

export async function joinFamily(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Nicht angemeldet" };

  const parsed = familyJoinSchema.safeParse({
    invite_code: formData.get("invite_code"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Find family by invite code
  const { data: family, error: findError } = await supabase
    .from("families")
    .select("id, name")
    .eq("invite_code", parsed.data.invite_code.toLowerCase().trim())
    .single();

  if (findError || !family) {
    return { error: "Familie nicht gefunden. Pruefe den Einladungscode." };
  }

  // Link user to family
  const { error: linkError } = await supabase
    .from("users")
    .update({ family_id: family.id })
    .eq("id", user.id);

  if (linkError) {
    return { error: "Beitritt fehlgeschlagen" };
  }

  revalidatePath("/dashboard");
  return { success: true, family };
}
