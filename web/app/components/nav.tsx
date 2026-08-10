import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/logout/actions";
import Pokeball from "@/app/components/pokeball";

const linkCls =
  "rounded-full px-3 py-1.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/15 hover:text-white";
const mobileLinkCls =
  "block rounded-xl px-4 py-2.5 text-sm font-semibold text-poke-navy transition-colors hover:bg-gray-100";

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

        {/* Desktop */}
        <div className="hidden items-center gap-x-1 sm:flex">
          <Link href="/pokedex" className={linkCls}>
            Pokédex
          </Link>
          <Link href="/identify" className={linkCls}>
            Identificar
          </Link>
          {user ? (
            <>
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

        {/* Mobile: hamburger sin JS (details/summary) — la navegación recarga
            la página y el menú se cierra solo */}
        <details className="relative sm:hidden">
          <summary
            className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full transition-colors hover:bg-white/15 [&::-webkit-details-marker]:hidden"
            aria-label="Abrir menú"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </summary>
          <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border-2 border-gray-100 bg-surface p-2 shadow-xl">
            <Link href="/pokedex" className={mobileLinkCls}>
              Pokédex
            </Link>
            <Link href="/identify" className={mobileLinkCls}>
              Identificar
            </Link>
            {user ? (
              <>
                <Link href="/collection" className={mobileLinkCls}>
                  Mi colección
                </Link>
                <Link href="/chat" className={mobileLinkCls}>
                  Chat
                </Link>
                <form action={logout} className="border-t border-gray-100 pt-1">
                  <button type="submit" className={`${mobileLinkCls} w-full text-left`}>
                    Salir
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className={mobileLinkCls}>
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="mt-1 block rounded-xl bg-poke-yellow px-4 py-2.5 text-center text-sm font-bold text-poke-navy"
                >
                  Registrarme
                </Link>
              </>
            )}
          </div>
        </details>
      </nav>
    </header>
  );
}
