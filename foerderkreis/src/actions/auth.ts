"use server";

import { redirect } from "next/navigation";

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  
  // For server-side sign in with next-auth v4, we redirect to the sign-in API
  // The actual sign-in is handled by the client-side form
  // This action just validates and redirects
  if (!email) {
    return { error: "Email is required" };
  }

  // Redirect will happen from the client after calling signIn from next-auth/react
  return { success: true, email };
}

export async function signOut() {
  // For server-side sign out, redirect to the NextAuth sign out endpoint
  redirect("/api/auth/signout");
}
