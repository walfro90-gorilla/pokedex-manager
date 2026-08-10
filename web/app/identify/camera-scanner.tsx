"use client";

import { useEffect, useRef, useState } from "react";

// Modo Pokédex: cámara trasera + obturador. Cada captura manda el frame
// al mismo /identify que el upload de archivo — cero cambios de backend.
export default function CameraScanner({
  onCapture,
  disabled,
}: {
  onCapture: (file: File) => void;
  disabled: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setActive(true);
    } catch {
      setError("No se pudo acceder a la cámara. Revisa los permisos del navegador.");
    }
  }

  function stop() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }

  // Conectar el stream al <video> cuando ambos existen
  useEffect(() => {
    if (active && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [active]);

  // Apagar la cámara al desmontar
  useEffect(() => stop, []);

  function shoot() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(new File([blob], "scan.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.85,
    );
  }

  if (!active) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={start}
          className="rounded-full border-2 border-poke-red px-6 py-2.5 text-sm font-bold text-poke-red transition-colors hover:bg-poke-red hover:text-white"
        >
          📸 Modo Pokédex (cámara)
        </button>
        {error && <p className="text-center text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Visor estilo Pokédex */}
      <div className="relative w-full overflow-hidden rounded-2xl border-4 border-poke-red bg-black shadow-lg">
        <video ref={videoRef} autoPlay playsInline muted className="w-full" />
        {/* Esquinas del visor */}
        <div className="pointer-events-none absolute inset-4">
          <div className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-poke-yellow" />
          <div className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-poke-yellow" />
          <div className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-poke-yellow" />
          <div className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-poke-yellow" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={stop}
          className="rounded-full border-2 border-gray-300 px-4 py-2 text-xs font-medium text-muted transition-colors hover:border-poke-navy hover:text-poke-navy"
        >
          Cerrar cámara
        </button>
        {/* Obturador */}
        <button
          type="button"
          onClick={shoot}
          disabled={disabled}
          aria-label="Escanear"
          className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-poke-red shadow-lg ring-2 ring-poke-red transition-transform hover:scale-105 disabled:opacity-50"
        >
          <span className="block h-10 w-10 rounded-full border-2 border-white/60" />
        </button>
      </div>
    </div>
  );
}
