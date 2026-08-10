import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/logout/actions";
import Pokeball from "@/app/components/pokeball";

const linkCls =
  "rounded-full px-3 py-1.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/15 hover:text-white";

// Nav superior: en mobile solo el logo (la navegación vive en la tab bar
// inferior — bottom-nav.tsx); en desktop los links de siempre.
export default async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 bg-poke-red shadow-md">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/pokedex" className="flex items-center gap-2 text-lg font-black text-white">
          <Pokeball size={28} />
          PokéDex Manager
        </Link>

        {/* Sin sesión solo se ofrecen login/registro; las funciones aparecen
            al autenticarse (las rutas igual están protegidas en proxy.ts) */}
        <div className="hidden items-center gap-x-1 sm:flex">
          {user ? (
            <>
              <Link href="/pokedex" className={linkCls}>
                Pokédex
              </Link>
              <Link href="/identify" className={linkCls}>
                Identificar
              </Link>
              <Link href="/trainers" className={linkCls}>
                Entrenadores
              </Link>
              <Link href="/quien-es" className={linkCls}>
                ¿Quién es?
              </Link>
              <Link href="/collection" className={linkCls}>
                Mi colección
              </Link>
              <Link href="/chat" className={linkCls}>
                Chat
              </Link>
              <form action={logout}>
                <button type="submit" className={linkCls}>
                  Salir
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={linkCls}>
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-poke-yellow px-3 py-1.5 text-sm font-bold text-poke-navy transition-opacity hover:opacity-90"
              >
                Registrarme
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
