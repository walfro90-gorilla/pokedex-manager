import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Callback de OAuth (PKCE): intercambia el code por sesión y redirige.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next") ?? "/pokedex";
  // Solo rutas internas — evita open redirect
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/pokedex";

  // Detrás del reverse proxy (Caddy) request.url trae el host interno del
  // contenedor; el origen público viene en los headers x-forwarded-*.
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const origin = `${proto}://${host}`;

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Primer login con Google: crear el perfil público con nombre/foto de
      // Google para que aparezca en /trainers. ignoreDuplicates: un perfil
      // existente (nombre o avatar elegidos por el usuario) nunca se pisa.
      const user = data.session?.user;
      if (user) {
        const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
        await supabase.from("profiles").upsert(
          {
            user_id: user.id,
            display_name: meta.display_name ?? meta.full_name ?? "Entrenador/a",
            avatar_url: meta.avatar_url ?? null,
          },
          { onConflict: "user_id", ignoreDuplicates: true },
        );
      }
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent("No se pudo iniciar sesión con Google")}`, origin),
  );
}
