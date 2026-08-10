import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPokemonDetail } from "@/lib/pokeapi";
import { createClient } from "@/lib/supabase/server";
import { captureAction } from "./actions";

export default async function PokemonDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const pokemon = await getPokemonDetail(name);
  if (!pokemon) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let alreadyCaptured = false;
  if (user) {
    const { data } = await supabase
      .from("collection")
      .select("id")
      .eq("pokemon_id", pokemon.id)
      .maybeSingle();
    alreadyCaptured = Boolean(data);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/pokedex" className="text-sm underline">
        ← Volver
      </Link>

      <div className="mt-4 flex flex-col items-center text-center">
        <Image src={pokemon.spriteUrl} alt={pokemon.name} width={200} height={200} unoptimized />
        <p className="text-sm text-gray-500">#{pokemon.id}</p>
        <h1 className="text-2xl font-bold capitalize">{pokemon.name}</h1>

        <div className="mt-2 flex gap-2">
          {pokemon.types.map((t) => (
            <span
              key={t}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs capitalize text-gray-800"
            >
              {t}
            </span>
          ))}
        </div>

        <dl className="mt-6 grid w-full grid-cols-2 gap-2 text-left text-sm sm:grid-cols-3">
          {Object.entries(pokemon.stats).map(([statName, value]) => (
            <div key={statName} className="rounded-md border border-gray-200 p-2">
              <dt className="capitalize text-gray-500">{statName}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8">
          {!user ? (
            <Link
              href={`/login?redirectTo=/pokedex/${pokemon.name}`}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Inicia sesión para capturar
            </Link>
          ) : alreadyCaptured ? (
            <p className="text-sm text-gray-500">Ya está en tu colección.</p>
          ) : (
            <form action={captureAction}>
              <input type="hidden" name="pokemon_id" value={pokemon.id} />
              <input type="hidden" name="name" value={pokemon.name} />
              <input type="hidden" name="sprite_url" value={pokemon.spriteUrl} />
              <input type="hidden" name="types" value={JSON.stringify(pokemon.types)} />
              <input type="hidden" name="stats" value={JSON.stringify(pokemon.stats)} />
              <button
                type="submit"
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
              >
                Capturar
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
