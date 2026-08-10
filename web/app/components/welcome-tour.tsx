"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Pokeball from "./pokeball";

// Tour de bienvenida para usuarios nuevos: un paso por funcionalidad, con
// acceso directo a cada una. Se muestra una sola vez (localStorage); sin
// librerías de tours — un carousel de ~100 líneas cubre el caso.
const STEPS = [
  {
    emoji: "📕",
    title: "La Pokédex",
    body: "Explora y busca entre más de 1,000 Pokémon con sus tipos y stats, directo de PokéAPI.",
    href: "/pokedex",
    cta: "Abrir la Pokédex",
  },
  {
    emoji: "⚡",
    title: "Ficha viva",
    body: "Cada Pokémon tiene sprite animado, su grito, movimientos con detalle al tocarlos y flechas para pasar al siguiente.",
    href: "/pokedex/pikachu",
    cta: "Ver a Pikachu",
  },
  {
    emoji: "🎉",
    title: "Captura",
    body: "El botón Capturar lo agrega a tu equipo — con confetti y directo a su ficha.",
    href: "/pokedex",
    cta: "Ir a capturar",
  },
  {
    emoji: "🎒",
    title: "Tu colección",
    body: "Tu perfil de entrenador: nombre, foto (galería o cámara), medallero de logros y tu equipo estilo Game Boy.",
    href: "/collection",
    cta: "Mi colección",
  },
  {
    emoji: "📸",
    title: "Modo Pokédex",
    body: "Apunta con la cámara (o sube una foto) y la IA identifica al Pokémon, verificado contra PokéAPI.",
    href: "/identify",
    cta: "Identificar",
  },
  {
    emoji: "💬",
    title: "Asistente IA",
    body: "Chatea sobre TU colección: comparativas, recomendaciones y curiosidades con datos reales, nunca inventados.",
    href: "/chat",
    cta: "Abrir el chat",
  },
  {
    emoji: "🌎",
    title: "Comunidad",
    body: "Directorio de entrenadores con perfiles públicos: su equipo y medallero (las notas siguen privadas).",
    href: "/trainers",
    cta: "Ver entrenadores",
  },
  {
    emoji: "❓",
    title: "¿Quién es ese Pokémon?",
    body: "El juego de la serie: adivina la silueta y haz racha.",
    href: "/quien-es",
    cta: "Jugar",
  },
  {
    emoji: "📱",
    title: "Llévala contigo",
    body: "Instálala como app: en móvil usa “Agregar a pantalla de inicio”; en desktop, el ícono de instalar del navegador.",
    href: null,
    cta: null,
  },
] as const;

const DONE_KEY = "welcome-tour-done";

export default function WelcomeTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(DONE_KEY)) return;
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, []);

  if (!open) return null;

  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  function close() {
    localStorage.setItem(DONE_KEY, "1");
    setOpen(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="poke-card w-full max-w-sm p-6 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <Pokeball size={20} />
          <span className="pixel text-[9px] text-muted">
            TOUR {step + 1}/{STEPS.length}
          </span>
        </div>

        <div className="text-4xl">{s.emoji}</div>
        <h2 className="mt-2 text-xl font-black">{s.title}</h2>
        <p className="mt-2 text-sm text-muted">{s.body}</p>

        {s.href && (
          <Link
            href={s.href}
            onClick={close}
            className="mt-3 inline-block text-sm font-semibold text-poke-blue hover:underline"
          >
            {s.cta} →
          </Link>
        )}

        {/* Progreso */}
        <div className="mt-4 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i === step ? "bg-poke-red" : "bg-gray-200"}`}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={close}
            className="px-2 py-2 text-xs text-muted transition-colors hover:text-poke-red"
          >
            Saltar
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="rounded-full border-2 border-gray-200 px-4 py-2 text-sm font-semibold transition-colors hover:border-poke-blue"
              >
                Atrás
              </button>
            )}
            <button
              type="button"
              onClick={() => (last ? close() : setStep(step + 1))}
              className="rounded-full bg-poke-red px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-poke-red-dark"
            >
              {last ? "¡A capturar!" : "Siguiente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
