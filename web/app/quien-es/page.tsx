import { getKantoNames } from "@/lib/pokeapi";
import Pokeball from "@/app/components/pokeball";
import WhoIsThatPokemon from "./game";

export default async function QuienEsPage() {
  const names = await getKantoNames();

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="mb-1 flex items-center gap-2 text-3xl font-black">
        <Pokeball size={30} /> ¿Quién es ese Pokémon?
      </h1>
      <p className="mb-8 text-sm text-muted">
        Como en la serie: adivina por la silueta. Los 151 de Kanto.
      </p>
      <WhoIsThatPokemon names={names} />
    </main>
  );
}
