"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logHoursSchema } from "@/lib/validations";

export async function logHours(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Nicht angemeldet" };

  // Get user's family
  const { data: profile } = await supabase
    .from("users")
    .select("family_id")
    .eq("id", user.id)
    .single();

  if (!profile?.family_id) {
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

  const { error } = await supabase.from("volunteer_hours").insert({
    user_id: user.id,
    family_id: profile.family_id,
    kreis_id: parsed.data.kreis_id,
    hours: parsed.data.hours,
    description: parsed.data.description,
    date_performed: parsed.data.date_performed,
  });

  if (error) return { error: "Stunden konnten nicht erfasst werden" };

  revalidatePath("/dashboard");
  revalidatePath("/hours");
  revalidatePath("/leaderboard");
  return { success: true };
}

export async function updateHours(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Nicht angemeldet" };

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

  const { error } = await supabase
    .from("volunteer_hours")
    .update({
      hours: parsed.data.hours,
      description: parsed.data.description,
      date_performed: parsed.data.date_performed,
      kreis_id: parsed.data.kreis_id,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Eintrag konnte nicht aktualisiert werden" };

  revalidatePath("/hours");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteHours(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Nicht angemeldet" };

  const { error } = await supabase
    .from("volunteer_hours")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Eintrag konnte nicht geloescht werden" };

  revalidatePath("/hours");
  revalidatePath("/dashboard");
  return { success: true };
}
