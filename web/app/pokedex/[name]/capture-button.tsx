"use client";

// Botón de captura: reproduce el grito EN el click (gesto de usuario presente,
// el autoplay de la página post-redirect lo bloquea el navegador) y deja que
// la Server Action del form siga su curso normal.
export default function CaptureButton({ cryUrl }: { cryUrl: string | null }) {
  return (
    <button
      type="submit"
      onClick={() => {
        if (cryUrl) {
          const audio = new Audio(cryUrl);
          audio.volume = 0.4;
          audio.play().catch(() => {});
        }
      }}
      className="rounded-full bg-poke-red px-8 py-2.5 text-sm font-bold text-white transition-colors hover:bg-poke-red-dark"
    >
      ¡Capturar!
    </button>
  );
}
