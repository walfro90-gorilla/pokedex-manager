import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPokemonDetail } from "@/lib/pokeapi";
import { createClient } from "@/lib/supabase/server";
import { STAT_LABELS, STAT_MAX, typeColor } from "@/lib/pokemon-theme";
import TypeBadge from "@/app/components/type-badge";
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

  const mainColor = typeColor(pokemon.types[0] ?? "normal").bg;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link href="/pokedex" className="text-sm font-medium text-poke-blue hover:underline">
        ← Volver a la Pokédex
      </Link>

      <div className="poke-card mt-4 overflow-hidden">
        {/* Hero con el color del tipo principal */}
        <div
          className="flex flex-col items-center px-6 pb-4 pt-8"
          style={{ background: `linear-gradient(180deg, ${mainColor}33, transparent)` }}
        >
          <span className="pixel text-xs text-muted">#{String(pokemon.id).padStart(4, "0")}</span>
          <Image
            src={pokemon.spriteUrl}
            alt={pokemon.name}
            width={220}
            height={220}
            unoptimized
            priority
            className="drop-shadow-md"
          />
          <h1 className="mt-2 text-3xl font-black capitalize">{pokemon.name}</h1>
          <div className="mt-3 flex gap-2">
            {pokemon.types.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Altura {(pokemon.height / 10).toFixed(1)} m · Peso {(pokemon.weight / 10).toFixed(1)} kg
          </p>
        </div>

        {/* Stats con barras */}
        <div className="flex flex-col gap-2.5 px-6 pb-6 pt-2">
          {Object.entries(pokemon.stats).map(([statName, value]) => (
            <div key={statName} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-right text-xs font-semibold text-muted">
                {STAT_LABELS[statName] ?? statName}
              </span>
              <span className="pixel w-10 shrink-0 text-right text-[10px]">{value}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (value / STAT_MAX) * 100 * 1.6)}%`,
                    backgroundColor: mainColor,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center border-t-2 border-gray-100 px-6 py-5">
          {!user ? (
            <Link
              href={`/login?redirectTo=/pokedex/${pokemon.name}`}
              className="rounded-full bg-poke-red px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-poke-red-dark"
            >
              Inicia sesión para capturar
            </Link>
          ) : alreadyCaptured ? (
            <p className="flex items-center gap-2 text-sm font-medium text-muted">
              ✓ Ya está en tu colección ·{" "}
              <Link href="/collection" className="text-poke-blue hover:underline">
                verla
              </Link>
            </p>
          ) : (
            <form action={captureAction}>
              <input type="hidden" name="pokemon_id" value={pokemon.id} />
              <input type="hidden" name="name" value={pokemon.name} />
              <input type="hidden" name="sprite_url" value={pokemon.spriteUrl} />
              <input type="hidden" name="types" value={JSON.stringify(pokemon.types)} />
              <input type="hidden" name="stats" value={JSON.stringify(pokemon.stats)} />
              <button
                type="submit"
                className="rounded-full bg-poke-red px-8 py-2.5 text-sm font-bold text-white transition-colors hover:bg-poke-red-dark"
              >
                ¡Capturar!
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
