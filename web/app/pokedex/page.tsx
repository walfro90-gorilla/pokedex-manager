import Image from "next/image";
import Link from "next/link";
import { searchPokemon } from "@/lib/pokeapi";

export default async function PokedexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { items, totalPages } = await searchPokemon(q, page);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Pokédex</h1>

      <form className="mb-6 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Buscar
        </button>
      </form>

      {items.length === 0 ? (
        <p className="text-gray-600">Sin resultados para &quot;{q}&quot;.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((p) => (
            <li key={p.id}>
              <Link
                href={`/pokedex/${p.name}`}
                className="flex flex-col items-center rounded-lg border border-gray-200 p-3 text-center transition-colors hover:border-black"
              >
                <Image src={p.spriteUrl} alt={p.name} width={96} height={96} unoptimized />
                <span className="mt-1 text-xs text-gray-500">#{p.id}</span>
                <span className="text-sm font-medium capitalize">{p.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <nav className="mt-8 flex items-center justify-center gap-4 text-sm">
        {page > 1 && (
          <Link href={`/pokedex?q=${encodeURIComponent(q)}&page=${page - 1}`} className="underline">
            Anterior
          </Link>
        )}
        <span className="text-gray-600">
          Página {page} de {totalPages}
        </span>
        {page < totalPages && (
          <Link href={`/pokedex?q=${encodeURIComponent(q)}&page=${page + 1}`} className="underline">
            Siguiente
          </Link>
        )}
      </nav>
    </main>
  );
}
