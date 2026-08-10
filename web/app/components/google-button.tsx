import { loginWithGoogle } from "@/app/login/actions";

// Botón "Continuar con Google" — form + Server Action (sin JS de cliente).
export default function GoogleButton({ redirectTo = "/pokedex" }: { redirectTo?: string }) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-gray-200" />
        o
        <span className="h-px flex-1 bg-gray-200" />
      </div>
      <form action={loginWithGoogle} className="mt-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2.5 rounded-full border-2 border-gray-200 px-4 py-2.5 text-sm font-semibold transition-colors hover:border-poke-blue"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.2 3.7-8.9z" />
            <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.1 0-5.8-2.1-6.7-5l-3.9 3C3.4 21.3 7.4 24 12 24z" />
            <path fill="#FBBC05" d="M5.3 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-3.9-3C.5 8.2 0 10 0 12s.5 3.8 1.4 5.4l3.9-3z" />
            <path fill="#EA4335" d="M12 4.6c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.6l3.9 3c.9-2.9 3.6-5 6.7-5z" />
          </svg>
          Continuar con Google
        </button>
      </form>
    </div>
  );
}
