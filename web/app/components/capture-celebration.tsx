"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

// Confetti al capturar un Pokémon nuevo (se monta cuando el detalle recibe
// ?captured=1 tras la Server Action de captura). Colores de pokébola.
const COLORS = ["#dc0a2d", "#ffffff", "#1f2937", "#ffcb05"];

export default function CaptureCelebration() {
  useEffect(() => {
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
  }, []);

  return null;
}
