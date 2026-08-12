import Link from "next/link";
import GoogleButton from "@/app/components/google-button";
import Pokeball from "@/app/components/pokeball";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string; registered?: string }>;
}) {
  const { error, redirectTo, registered } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <div className="poke-card p-8">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Pokeball size={44} />
          <h1 className="text-2xl font-black">Iniciar sesión</h1>
        </div>

        {registered && (
          <p className="mb-4 rounded-xl bg-green-50 px-4 py-2.5 text-sm text-green-700">
            Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.
          </p>
        )}
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
        )}

        {/* Cuenta demo prellenada (pública en el README a propósito):
            el evaluador entra con un solo click en Entrar. */}
        <p className="mb-4 rounded-xl bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
          Cuenta demo lista — solo presiona <strong>Entrar</strong>.
        </p>

        <form action={login} className="flex flex-col gap-4">
          <input type="hidden" name="redirectTo" value={redirectTo ?? "/pokedex"} />

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Correo</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue="pokedex-qa-01@e2etest.dev"
              className="rounded-full border-2 border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-poke-blue"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Contraseña</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              defaultValue="TestPass123!"
              className="rounded-full border-2 border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-poke-blue"
            />
          </label>

          <button
            type="submit"
            className="mt-2 rounded-full bg-poke-red px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-poke-red-dark"
          >
            Entrar
          </button>
        </form>

        <GoogleButton redirectTo={redirectTo ?? "/pokedex"} />

        <p className="mt-6 text-center text-sm text-muted">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-semibold text-poke-blue hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}
