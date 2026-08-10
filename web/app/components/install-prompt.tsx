"use client";

import { useEffect, useState } from "react";
import Pokeball from "@/app/components/pokeball";

// Evento de Chrome/Edge previo al prompt de instalación (no está tipado en el DOM lib)
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa-install-dismissed";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    // Ya instalada (corre standalone) o el usuario la descartó antes: no molestar
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS Safari no dispara beforeinstallprompt — hint manual (diferido para
    // no hacer setState síncrono dentro del effect)
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandaloneIos = "standalone" in navigator && (navigator as { standalone?: boolean }).standalone;
    const iosTimer = setTimeout(() => {
      if (isIos && !isStandaloneIos) setShowIosHint(true);
    }, 0);

    return () => {
      clearTimeout(iosTimer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDeferred(null);
    setShowIosHint(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      setDeferred(null);
    }
  }

  if (!deferred && !showIosHint) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:bottom-4">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border-2 border-gray-200 bg-surface p-3 shadow-xl">
        <Pokeball size={32} className="shrink-0" />
        <div className="flex-1 text-xs">
          <p className="font-bold">Instala PokéDex Manager</p>
          <p className="text-muted">
            {deferred
              ? "Acceso directo, pantalla completa y más rápido."
              : "En Safari: Compartir → Agregar a pantalla de inicio."}
          </p>
        </div>
        {deferred && (
          <button
            type="button"
            onClick={install}
            className="shrink-0 rounded-full bg-poke-red px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-poke-red-dark"
          >
            Instalar
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar"
          className="shrink-0 rounded-full p-1.5 text-muted transition-colors hover:bg-gray-100"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
