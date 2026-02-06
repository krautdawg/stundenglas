"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function joinKreis(kreisId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Nicht angemeldet" };

  const { error } = await supabase.from("kreis_memberships").insert({
    user_id: user.id,
    kreis_id: kreisId,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Du bist bereits Mitglied dieses Kreises" };
    }
    return { error: "Beitritt fehlgeschlagen" };
  }

  revalidatePath("/kreise");
  return { success: true };
}

export async function leaveKreis(kreisId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Nicht angemeldet" };

  const { error } = await supabase
    .from("kreis_memberships")
    .delete()
    .eq("user_id", user.id)
    .eq("kreis_id", kreisId);

  if (error) return { error: "Austritt fehlgeschlagen" };

  revalidatePath("/kreise");
  return { success: true };
}
