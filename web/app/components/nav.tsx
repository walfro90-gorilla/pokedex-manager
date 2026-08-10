import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/logout/actions";
import Pokeball from "@/app/components/pokeball";

const linkCls =
  "rounded-full px-3 py-1.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/15 hover:text-white";

export default async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="bg-poke-red shadow-md">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/pokedex" className="flex items-center gap-2 text-lg font-black text-white">
          <Pokeball size={28} />
          PokéDex Manager
        </Link>
        <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
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
      </nav>
    </header>
  );
}
