// Pokébola en SVG puro — logo e ícono de la app, sin assets externos.
export default function Pokeball({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="46" fill="#fff" stroke="#1f2937" strokeWidth="8" />
      <path d="M4 50a46 46 0 0 1 92 0" fill="#DC0A2D" />
      <rect x="4" y="46" width="92" height="8" fill="#1f2937" />
      <circle cx="50" cy="50" r="16" fill="#fff" stroke="#1f2937" strokeWidth="8" />
      <circle cx="50" cy="50" r="6" fill="#e5e7eb" />
    </svg>
  );
}
