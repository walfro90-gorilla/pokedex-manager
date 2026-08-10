import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Callback de OAuth (PKCE): intercambia el code por sesión y redirige.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next") ?? "/pokedex";
  // Solo rutas internas — evita open redirect
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/pokedex";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }

  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent("No se pudo iniciar sesión con Google")}`, url.origin),
  );
}
