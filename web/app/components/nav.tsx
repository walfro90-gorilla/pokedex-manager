import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/logout/actions";

export default async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-gray-200">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/pokedex" className="font-bold">
          PokéDex Manager
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <Link href="/pokedex" className="underline">
            Pokédex
          </Link>
          <Link href="/identify" className="underline">
            Identificar
          </Link>
          {user ? (
            <>
              <Link href="/collection" className="underline">
                Mi colección
              </Link>
              <Link href="/chat" className="underline">
                Chat
              </Link>
              <form action={logout}>
                <button type="submit" className="underline">
                  Cerrar sesión
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="underline">
                Iniciar sesión
              </Link>
              <Link href="/register" className="underline">
                Registrarme
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
