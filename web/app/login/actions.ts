"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// OAuth con Google: Supabase genera la URL de consentimiento; el callback
// (/auth/callback) intercambia el code por sesión. Server Action, cero JS cliente.
export async function loginWithGoogle(formData: FormData) {
  const supabase = await createClient();
  const redirectTo = String(formData.get("redirectTo") || "/pokedex");
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  });

  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "No se pudo iniciar con Google")}`);
  }
  redirect(data.url);
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const redirectTo = String(formData.get("redirectTo") || "/pokedex");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(redirectTo);
}
