// Skeleton del detalle mientras PokéAPI responde
export default function PokemonDetailLoading() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
      <div className="poke-card mt-4 flex flex-col items-center px-6 py-8">
        <div className="h-3 w-12 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 h-52 w-52 animate-pulse rounded-full bg-gray-100" />
        <div className="mt-4 h-8 w-40 animate-pulse rounded-lg bg-gray-200" />
        <div className="mt-3 flex gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-gray-100" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-gray-100" />
        </div>
        <div className="mt-8 flex w-full flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-2.5 flex-1 animate-pulse rounded-full bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
