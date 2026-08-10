import type { SupabaseClient, User } from "@supabase/supabase-js";

// Identidad visible del entrenador. `profiles` manda (app-owned y estable);
// user_metadata es solo fallback: el login con Google sobreescribe
// user_metadata.avatar_url con la foto de Google en cada inicio de sesión,
// así que no puede ser la fuente canónica.
export async function trainerIdentity(supabase: SupabaseClient, user: User) {
  const { data } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("user_id", user.id)
    .maybeSingle<{ display_name: string; avatar_url: string | null }>();

  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  return {
    displayName: data?.display_name ?? meta.display_name ?? meta.full_name ?? "Entrenador/a",
    avatarUrl: data?.avatar_url ?? meta.avatar_url ?? null,
  };
}
