import Link from "next/link";
import GoogleButton from "@/app/components/google-button";
import Pokeball from "@/app/components/pokeball";
import { signup } from "./actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <div className="poke-card p-8">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Pokeball size={44} />
          <h1 className="text-2xl font-black">Crear cuenta</h1>
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
        )}

        <form action={signup} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Correo</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded-full border-2 border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-poke-blue"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Contraseña</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="rounded-full border-2 border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-poke-blue"
            />
          </label>

          <button
            type="submit"
            className="mt-2 rounded-full bg-poke-red px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-poke-red-dark"
          >
            Registrarme
          </button>
        </form>

        <GoogleButton />

        <p className="mt-6 text-center text-sm text-muted">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-poke-blue hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
