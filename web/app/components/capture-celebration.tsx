"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import confetti from "canvas-confetti";

// Celebración al capturar (se monta cuando el detalle recibe ?captured=1):
// confetti + scroll al inicio de la ficha + toast con la info de captura.
// El brinco de felicidad del sprite lo pone la ficha (clase poke-happy) y el
// grito lo reproduce PokemonCry (autoPlay) — una sola fuente de audio.
const COLORS = ["#dc0a2d", "#ffffff", "#1f2937", "#ffcb05"];

export default function CaptureCelebration({
  name,
  spriteUrl,
}: {
  name: string;
  spriteUrl: string;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    const shoot = (particleRatio: number, opts: confetti.Options) =>
      confetti({
        origin: { y: 0.6 },
        colors: COLORS,
        particleCount: Math.floor(200 * particleRatio),
        ...opts,
      });

    // Ráfaga estilo "captura lograda"
    shoot(0.25, { spread: 26, startVelocity: 55 });
    shoot(0.2, { spread: 60 });
    shoot(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    shoot(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    shoot(0.1, { spread: 120, startVelocity: 45 });

    const t = setTimeout(() => setVisible(false), 7000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="poke-card flex w-full max-w-sm items-center gap-3 border-2 border-poke-yellow p-3 shadow-xl">
        <Image
          src={spriteUrl}
          alt={name}
          width={48}
          height={48}
          unoptimized
          className="[image-rendering:pixelated]"
        />
        <div className="min-w-0 flex-1">
          <p className="pixel text-[9px] text-poke-red">¡GOTCHA!</p>
          <p className="truncate text-sm font-bold">
            <span className="capitalize">{name}</span> fue capturado
          </p>
          <Link
            href="/collection"
            className="text-xs font-semibold text-poke-blue hover:underline"
          >
            Ver en mi colección →
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Cerrar"
          className="shrink-0 rounded-full px-2 py-1 text-muted transition-colors hover:text-poke-red"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
