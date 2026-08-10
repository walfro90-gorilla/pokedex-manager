// Skeleton del grid mientras PokéAPI responde (primera carga sin cache es lenta)
export default function PokedexLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 h-9 w-40 animate-pulse rounded-lg bg-gray-200" />
      <div className="mb-8 flex gap-2">
        <div className="h-10 flex-1 animate-pulse rounded-full bg-gray-200" />
        <div className="h-10 w-24 animate-pulse rounded-full bg-gray-200" />
      </div>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <li key={i} className="poke-card flex flex-col items-center p-4">
            <div className="h-3 w-10 animate-pulse self-end rounded bg-gray-200" />
            <div className="mt-2 h-24 w-24 animate-pulse rounded-full bg-gray-100" />
            <div className="mt-3 h-4 w-20 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-4 w-14 animate-pulse rounded-full bg-gray-100" />
          </li>
        ))}
      </ul>
    </main>
  );
}
