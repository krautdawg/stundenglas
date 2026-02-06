"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { jobSchema } from "@/lib/validations";

export async function createJob(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Nicht angemeldet" };

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

  const { error } = await supabase.from("jobs").insert({
    ...parsed.data,
    posted_by: user.id,
  });

  if (error) return { error: "Aufgabe konnte nicht erstellt werden" };

  revalidatePath("/jobs");
  return { success: true };
}

export async function claimJob(jobId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Nicht angemeldet" };

  // Check if already claimed
  const { data: existing } = await supabase
    .from("job_claims")
    .select("id")
    .eq("job_id", jobId)
    .eq("user_id", user.id)
    .single();

  if (existing) return { error: "Du hast diese Aufgabe bereits uebernommen" };

  // Check if max claimants reached
  const { data: job } = await supabase
    .from("jobs")
    .select("max_claimants")
    .eq("id", jobId)
    .single();

  const { count } = await supabase
    .from("job_claims")
    .select("*", { count: "exact", head: true })
    .eq("job_id", jobId)
    .in("status", ["claimed", "completed"]);

  if (job && count !== null && count >= job.max_claimants) {
    return { error: "Alle Plaetze sind bereits vergeben" };
  }

  const { error } = await supabase.from("job_claims").insert({
    job_id: jobId,
    user_id: user.id,
  });

  if (error) return { error: "Aufgabe konnte nicht uebernommen werden" };

  // Update job status if first claim
  await supabase
    .from("jobs")
    .update({ status: "claimed" })
    .eq("id", jobId)
    .eq("status", "open");

  revalidatePath("/jobs");
  return { success: true };
}

export async function completeJobClaim(jobId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Nicht angemeldet" };

  // Get user's family and job details
  const { data: profile } = await supabase
    .from("users")
    .select("family_id")
    .eq("id", user.id)
    .single();

  if (!profile?.family_id) {
    return { error: "Du gehoerst noch keiner Familie an" };
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("estimated_hours, kreis_id, title")
    .eq("id", jobId)
    .single();

  if (!job) return { error: "Aufgabe nicht gefunden" };

  // Update claim status
  const { error: claimError } = await supabase
    .from("job_claims")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("job_id", jobId)
    .eq("user_id", user.id);

  if (claimError) return { error: "Status konnte nicht aktualisiert werden" };

  // Auto-log hours
  await supabase.from("volunteer_hours").insert({
    user_id: user.id,
    family_id: profile.family_id,
    kreis_id: job.kreis_id,
    job_id: jobId,
    hours: job.estimated_hours,
    description: `Aufgabe erledigt: ${job.title}`,
    date_performed: new Date().toISOString().split("T")[0],
  });

  // Check if all claims are completed
  const { count: activeClaims } = await supabase
    .from("job_claims")
    .select("*", { count: "exact", head: true })
    .eq("job_id", jobId)
    .eq("status", "claimed");

  if (activeClaims === 0) {
    await supabase
      .from("jobs")
      .update({ status: "completed" })
      .eq("id", jobId);
  }

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  revalidatePath("/hours");
  return { success: true };
}

export async function withdrawClaim(jobId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Nicht angemeldet" };

  const { error } = await supabase
    .from("job_claims")
    .update({ status: "withdrawn" })
    .eq("job_id", jobId)
    .eq("user_id", user.id)
    .eq("status", "claimed");

  if (error) return { error: "Konnte nicht zurueckgezogen werden" };

  // Check if any claims remain, reopen if not
  const { count } = await supabase
    .from("job_claims")
    .select("*", { count: "exact", head: true })
    .eq("job_id", jobId)
    .in("status", ["claimed", "completed"]);

  if (count === 0) {
    await supabase.from("jobs").update({ status: "open" }).eq("id", jobId);
  }

  revalidatePath("/jobs");
  return { success: true };
}
