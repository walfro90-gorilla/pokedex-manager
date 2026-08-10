import Pokeball from "@/app/components/pokeball";
import IdentifyForm from "./identify-form";

export default function IdentifyPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="mb-1 flex items-center gap-2 text-3xl font-black">
        <Pokeball size={30} /> Identificar Pokémon
      </h1>
      <p className="mb-6 text-sm text-muted">
        Sube una foto (carta, juguete, screenshot o dibujo) y la IA lo identifica. Inicia
        sesión para agregarlo a tu colección.
      </p>
      <IdentifyForm />
    </main>
  );
}
