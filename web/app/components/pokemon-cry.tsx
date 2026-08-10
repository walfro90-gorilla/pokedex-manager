"use client";

import { useEffect, useRef } from "react";

// Grito del Pokémon. Intenta autoplay al montar (al abrir el detalle o al
// descubrirlo con la cámara); si el browser lo bloquea por política de
// autoplay, queda el botón 🔊.
export default function PokemonCry({ url, autoPlay = false }: { url: string; autoPlay?: boolean }) {
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!autoPlay || !ref.current) return;
    ref.current.volume = 0.35; // los gritos vienen fuertes
    ref.current.play().catch(() => {
      /* autoplay bloqueado: el botón sigue disponible */
    });
  }, [autoPlay]);

  function play() {
    if (!ref.current) return;
    ref.current.volume = 0.35;
    ref.current.currentTime = 0;
    ref.current.play().catch(() => {});
  }

  return (
    <button
      type="button"
      onClick={play}
      aria-label="Reproducir grito"
      className="flex items-center gap-1.5 rounded-full border-2 border-gray-200 px-3 py-1 text-xs font-semibold text-muted transition-colors hover:border-poke-red hover:text-poke-red"
    >
      🔊 Grito
      <audio ref={ref} src={url} preload="auto" />
    </button>
  );
}
