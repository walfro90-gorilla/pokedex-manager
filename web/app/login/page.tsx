import Link from "next/link";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string; registered?: string }>;
}) {
  const { error, redirectTo, registered } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold">Iniciar sesión</h1>

      {registered && (
        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Cuenta creada. Ya puedes iniciar sesión.
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <form action={login} className="flex flex-col gap-4">
        <input type="hidden" name="redirectTo" value={redirectTo ?? "/pokedex"} />

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Correo</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Contraseña</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <button
          type="submit"
          className="mt-2 rounded-md bg-black px-3 py-2 text-sm font-medium text-white"
        >
          Entrar
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-medium underline">
          Regístrate
        </Link>
      </p>
    </main>
  );
}
