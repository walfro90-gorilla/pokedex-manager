import Image from "next/image";
import Link from "next/link";
import {
  searchPokemon,
  getPokemonDetail,
  getSearchIndex,
  generationLabel,
  GENERATIONS,
} from "@/lib/pokeapi";
import TypeBadge from "@/app/components/type-badge";
import TrainerBanner from "@/app/components/trainer-banner";
import Pokeball from "@/app/components/pokeball";
import { createClient } from "@/lib/supabase/server";
import SearchLive from "./search-live";

export default async function PokedexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; gen?: string; capturados?: string }>;
}) {
  const { q = "", page: pageParam, gen: genParam, capturados } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const gen = Number(genParam) || undefined;
  const onlyCaptured = capturados === "1";

  // Ids capturados del usuario (RLS: solo los propios) — marca cards,
  // alimenta el contador y el filtro "mis capturados"
  const supabase = await createClient();
  const { data: ownedRows } = await supabase.from("collection").select("pokemon_id");
  const ownedIds = new Set((ownedRows ?? []).map((r) => r.pokemon_id as number));

  const [{ items, totalPages }, searchIndex] = await Promise.all([
    searchPokemon(q, page, gen, onlyCaptured ? ownedIds : undefined),
    getSearchIndex(),
  ]);

  const qs = (extra: string) =>
    `/pokedex?${[
      q && `q=${encodeURIComponent(q)}`,
      gen && `gen=${gen}`,
      extra,
    ]
      .filter(Boolean)
      .join("&")}`.replace(/\?$/, "");

  // Detalle (tipos) por card — cada fetch queda cacheado 24h, tras la primera
  // carga de página es instantáneo.
  const details = await Promise.all(items.map((p) => getPokemonDetail(p.name).catch(() => null)));

  return (
    <>
      <TrainerBanner />
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black">Pokédex</h1>
        {/* Contador de captura: los tuyos vs todos los que existen */}
        <span className="pixel flex items-center gap-2 rounded-full border-2 border-gray-200 bg-surface px-4 py-2 text-[10px]">
          <Pokeball size={16} />
          {ownedIds.size} / {searchIndex.length} capturados
        </span>
      </div>

      <SearchLive entries={searchIndex} initialQ={q} gen={genParam} />

      {/* Filtros: generación + mis capturados */}
      <div className="mb-8 flex flex-wrap gap-1.5">
        <Link
          href={`/pokedex${q ? `?q=${encodeURIComponent(q)}` : ""}${onlyCaptured ? `${q ? "&" : "?"}capturados=1` : ""}`}
          className={`pixel rounded-full border-2 px-3 py-1.5 text-[9px] transition-colors ${
            !gen
              ? "border-poke-red bg-poke-red text-white"
              : "border-gray-200 bg-surface hover:border-poke-red"
          }`}
        >
          TODAS
        </Link>
        {GENERATIONS.map((g) => (
          <Link
            key={g.gen}
            href={`/pokedex?gen=${g.gen}${q ? `&q=${encodeURIComponent(q)}` : ""}${onlyCaptured ? "&capturados=1" : ""}`}
            className={`pixel rounded-full border-2 px-3 py-1.5 text-[9px] transition-colors ${
              gen === g.gen
                ? "border-poke-red bg-poke-red text-white"
                : "border-gray-200 bg-surface hover:border-poke-red"
            }`}
          >
            GEN {g.label}
          </Link>
        ))}
        {/* Toggle: solo mi colección */}
        <Link
          href={onlyCaptured ? qs("") : qs("capturados=1")}
          className={`pixel ml-auto flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-[9px] transition-colors ${
            onlyCaptured
              ? "border-poke-navy bg-poke-navy text-white"
              : "border-gray-200 bg-surface hover:border-poke-navy"
          }`}
        >
          <Pokeball size={12} /> MIS CAPTURADOS ({ownedIds.size})
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-muted">Sin resultados para &quot;{q}&quot;.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((p, i) => {
            const d = details[i];
            return (
              <li key={p.id}>
                <Link
                  href={`/pokedex/${p.name}`}
                  className="poke-card flex flex-col items-center p-4 text-center"
                >
                  <span className="flex w-full items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      {ownedIds.has(p.id) && <Pokeball size={13} />}
                      <span className="pixel text-[8px] text-muted">
                        {generationLabel(p.id) ? `GEN ${generationLabel(p.id)}` : ""}
                      </span>
                    </span>
                    <span className="pixel text-[10px] text-muted">
                      #{String(p.id).padStart(4, "0")}
                    </span>
                  </span>
                  <Image
                    src={p.spriteUrl}
                    alt={p.name}
                    width={96}
                    height={96}
                    unoptimized
                    className="drop-shadow-sm"
                  />
                  <span className="mt-2 text-sm font-bold capitalize">{p.name}</span>
                  {d && (
                    <span className="mt-2 flex flex-wrap justify-center gap-1">
                      {d.types.map((t) => (
                        <TypeBadge key={t} type={t} size="sm" />
                      ))}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <nav className="mt-10 flex items-center justify-center gap-6 text-sm font-medium">
        {page > 1 && (
          <Link
            href={`/pokedex?q=${encodeURIComponent(q)}&page=${page - 1}${gen ? `&gen=${gen}` : ""}${onlyCaptured ? "&capturados=1" : ""}`}
            className="rounded-full border-2 border-gray-200 bg-surface px-4 py-1.5 transition-colors hover:border-poke-red"
          >
            ← Anterior
          </Link>
        )}
        <span className="pixel text-[10px] text-muted">
          {page} / {totalPages}
        </span>
        {page < totalPages && (
          <Link
            href={`/pokedex?q=${encodeURIComponent(q)}&page=${page + 1}${gen ? `&gen=${gen}` : ""}${onlyCaptured ? "&capturados=1" : ""}`}
            className="rounded-full border-2 border-gray-200 bg-surface px-4 py-1.5 transition-colors hover:border-poke-red"
          >
            Siguiente →
          </Link>
        )}
      </nav>
      </main>
    </>
  );
}
