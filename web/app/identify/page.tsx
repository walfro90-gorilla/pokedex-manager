import IdentifyForm from "./identify-form";

export default function IdentifyPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Identificar Pokémon</h1>
      <p className="mb-6 text-sm text-gray-600">
        Sube una foto (carta, juguete, screenshot o dibujo) y la IA intenta identificar el
        Pokémon. Necesitas iniciar sesión para agregarlo a tu colección.
      </p>
      <IdentifyForm />
    </main>
  );
}
