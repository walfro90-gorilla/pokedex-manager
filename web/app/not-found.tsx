import Link from "next/link";
import Pokeball from "@/app/components/pokeball";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <Pokeball size={64} className="opacity-40" />
      <p className="pixel text-xs text-muted">404</p>
      <h1 className="text-2xl font-black">¡Este Pokémon huyó!</h1>
      <p className="text-sm text-muted">
        La página que buscas no existe — revisa el nombre o vuelve a la Pokédex.
      </p>
      <Link
        href="/pokedex"
        className="rounded-full bg-poke-red px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-poke-red-dark"
      >
        Ir a la Pokédex
      </Link>
    </main>
  );
}
