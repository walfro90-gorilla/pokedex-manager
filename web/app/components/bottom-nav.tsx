"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Tab bar inferior tipo app — solo mobile (sm:hidden). El botón central
// abre /identify (Modo Pokédex con cámara). Cerrar sesión vive en el
// perfil del entrenador (Mi colección), no aquí.

function Icon({ d, active }: { d: string; active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#dc0a2d" : "#6b7280"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  pokedex: "M4 6h16M4 10h16M4 14h10M4 18h7",
  collection: "M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9zM3 12a9 9 0 0 0 18 0M9.5 12a2.5 2.5 0 0 0 5 0",
  chat: "M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z",
  login: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3",
  trainers:
    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
};

function Tab({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: keyof typeof ICONS;
  label: string;
  active: boolean;
}) {
  return (
    <Link href={href} className="flex flex-1 flex-col items-center gap-0.5 py-2">
      <Icon d={ICONS[icon]} active={active} />
      <span className={`text-[10px] font-semibold ${active ? "text-poke-red" : "text-muted"}`}>
        {label}
      </span>
    </Link>
  );
}

export default function BottomNav({ authed }: { authed: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-gray-100 bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden"
      aria-label="Navegación principal"
    >
      <div className="mx-auto flex max-w-md items-end">
        <Tab href="/pokedex" icon="pokedex" label="Pokédex" active={pathname.startsWith("/pokedex")} />
        {authed ? (
          <Tab
            href="/collection"
            icon="collection"
            label="Colección"
            active={pathname.startsWith("/collection")}
          />
        ) : (
          <Tab href="/login" icon="login" label="Entrar" active={pathname.startsWith("/login")} />
        )}

        {/* Botón central: cámara para capturar (Modo Pokédex) */}
        <div className="relative flex-1">
          <Link
            href="/identify"
            aria-label="Identificar con cámara"
            className="absolute -top-7 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border-4 border-surface bg-poke-red shadow-lg transition-transform active:scale-95"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </Link>
          <div className="flex flex-col items-center gap-0.5 py-2 pt-8">
            <span
              className={`text-[10px] font-semibold ${
                pathname.startsWith("/identify") ? "text-poke-red" : "text-muted"
              }`}
            >
              Identificar
            </span>
          </div>
        </div>

        {authed ? (
          <>
            <Tab href="/chat" icon="chat" label="Chat" active={pathname.startsWith("/chat")} />
            <Tab
              href="/trainers"
              icon="trainers"
              label="Entrenadores"
              active={pathname.startsWith("/trainers")}
            />
          </>
        ) : (
          <>
            <Tab
              href="/trainers"
              icon="trainers"
              label="Entrenadores"
              active={pathname.startsWith("/trainers")}
            />
            <Tab
              href="/register"
              icon="collection"
              label="Registro"
              active={pathname.startsWith("/register")}
            />
          </>
        )}
      </div>
    </nav>
  );
}
