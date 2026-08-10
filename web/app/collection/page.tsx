import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TypeBadge from "@/app/components/type-badge";
import Pokeball from "@/app/components/pokeball";
import { releaseAction, updateNoteAction } from "./actions";

type CollectionRow = {
  id: string;
  pokemon_id: number;
  name: string;
  sprite_url: string | null;
  types: string[];
  notes: string | null;
  captured_at: string;
};

export default async function CollectionPage() {
  const supabase = await createClient();

  const { data: collection, error } = await supabase
    .from("collection")
    .select("id, pokemon_id, name, sprite_url, types, notes, captured_at")
    .order("captured_at", { ascending: false })
    .returns<CollectionRow[]>();

  if (error) throw new Error(error.message);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-1 flex items-center gap-2 text-3xl font-black">
        <Pokeball size={30} /> Mi colección
      </h1>
      <p className="mb-6 text-sm text-muted">
        {collection?.length ?? 0} Pokémon capturado{(collection?.length ?? 0) === 1 ? "" : "s"}
      </p>

      {!collection || collection.length === 0 ? (
        <div className="poke-card flex flex-col items-center gap-3 p-10 text-center">
          <Pokeball size={48} className="opacity-30" />
          <p className="text-muted">Aún no capturas ningún Pokémon.</p>
          <Link
            href="/pokedex"
            className="rounded-full bg-poke-red px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-poke-red-dark"
          >
            Ir a la Pokédex
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {collection.map((c) => (
            <li key={c.id} className="poke-card flex flex-col gap-3 p-4 sm:flex-row">
              {c.sprite_url && (
                <Image
                  src={c.sprite_url}
                  alt={c.name}
                  width={80}
                  height={80}
                  unoptimized
                  className="self-center drop-shadow-sm sm:self-start"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/pokedex/${c.name}`}
                    className="text-lg font-bold capitalize hover:text-poke-red"
                  >
                    {c.name}
                  </Link>
                  <form action={releaseAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <button
                      type="submit"
                      className="rounded-full border-2 border-gray-200 px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-poke-red hover:text-poke-red"
                    >
                      Soltar
                    </button>
                  </form>
                </div>

                <div className="mt-1.5 flex gap-1.5">
                  {c.types.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </div>

                <form action={updateNoteAction} className="mt-3 flex gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <input
                    type="text"
                    name="notes"
                    defaultValue={c.notes ?? ""}
                    placeholder="Agregar nota..."
                    className="flex-1 rounded-full border-2 border-gray-200 bg-surface px-4 py-1.5 text-xs outline-none transition-colors focus:border-poke-blue"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-poke-blue px-4 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
                  >
                    Guardar
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
