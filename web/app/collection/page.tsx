import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Mi colección</h1>

      {!collection || collection.length === 0 ? (
        <p className="text-gray-600">
          Aún no capturas ningún Pokémon.{" "}
          <Link href="/pokedex" className="underline">
            Ir a la Pokédex
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {collection.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row"
            >
              {c.sprite_url && (
                <Image
                  src={c.sprite_url}
                  alt={c.name}
                  width={64}
                  height={64}
                  unoptimized
                  className="self-center sm:self-start"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <Link href={`/pokedex/${c.name}`} className="font-medium capitalize underline">
                    {c.name}
                  </Link>
                  <form action={releaseAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <button type="submit" className="text-xs text-red-600 underline">
                      Soltar
                    </button>
                  </form>
                </div>

                <div className="mt-1 flex gap-1">
                  {c.types.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-800"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <form action={updateNoteAction} className="mt-2 flex gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <input
                    type="text"
                    name="notes"
                    defaultValue={c.notes ?? ""}
                    placeholder="Nota..."
                    className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-xs"
                  />
                  <button type="submit" className="text-xs underline">
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
