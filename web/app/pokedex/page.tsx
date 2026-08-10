import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/logout/actions";

export default async function PokedexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/pokedex");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pokédex</h1>
        <form action={logout}>
          <button type="submit" className="text-sm underline">
            Cerrar sesión
          </button>
        </form>
      </div>
      <p className="text-gray-600">
        Sesión iniciada como <span className="font-medium">{user.email}</span>. Lista con
        búsqueda y detalle van en el siguiente paso de F1.
      </p>
    </main>
  );
}
