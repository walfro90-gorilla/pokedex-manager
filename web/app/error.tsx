"use client";

import Pokeball from "@/app/components/pokeball";

// Error boundary global — si PokéAPI o Supabase fallan, el usuario ve esto
// en vez del overlay técnico de Next.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <Pokeball size={64} className="opacity-40" />
      <h1 className="text-2xl font-black">¡Ups! Algo salió mal</h1>
      <p className="text-sm text-muted">
        Un servicio externo no respondió (PokéAPI o la base de datos). Suele resolverse
        reintentando.
      </p>
      {error.digest && <p className="pixel text-[9px] text-muted">ref: {error.digest}</p>}
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-poke-red px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-poke-red-dark"
      >
        Reintentar
      </button>
    </main>
  );
}
