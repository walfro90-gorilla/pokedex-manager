import Image from "next/image";
import Link from "next/link";
import { searchPokemon, getPokemonDetail } from "@/lib/pokeapi";
import TypeBadge from "@/app/components/type-badge";

export default async function PokedexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { items, totalPages } = await searchPokemon(q, page);

  // Detalle (tipos) por card — cada fetch queda cacheado 24h, tras la primera
  // carga de página es instantáneo.
  const details = await Promise.all(items.map((p) => getPokemonDetail(p.name).catch(() => null)));

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-black">Pokédex</h1>

      <form className="mb-8 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre..."
          className="flex-1 rounded-full border-2 border-gray-200 bg-surface px-5 py-2.5 text-sm outline-none transition-colors focus:border-poke-blue"
        />
        <button
          type="submit"
          className="rounded-full bg-poke-red px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-poke-red-dark"
        >
          Buscar
        </button>
      </form>

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
                  <span className="pixel self-end text-[10px] text-muted">
                    #{String(p.id).padStart(4, "0")}
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
            href={`/pokedex?q=${encodeURIComponent(q)}&page=${page - 1}`}
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
            href={`/pokedex?q=${encodeURIComponent(q)}&page=${page + 1}`}
            className="rounded-full border-2 border-gray-200 bg-surface px-4 py-1.5 transition-colors hover:border-poke-red"
          >
            Siguiente →
          </Link>
        )}
      </nav>
    </main>
  );
}
