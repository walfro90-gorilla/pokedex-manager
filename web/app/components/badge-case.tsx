import type { Badge } from "@/lib/badges";

// Vitrina de medallas: octágonos SVG, gris si no ganada, color si sí.
function BadgeIcon({ badge }: { badge: Badge }) {
  const fill = badge.earned ? badge.color : "#e5e7eb";
  const stroke = badge.earned ? "#1f2937" : "#d1d5db";
  return (
    <div
      className="group relative flex flex-col items-center"
      title={`${badge.name} — ${badge.requirement}${badge.earned ? " ✓" : ""}`}
    >
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
        <polygon
          points="10,2 24,2 32,10 32,24 24,32 10,32 2,24 2,10"
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
        />
        {badge.earned && (
          <circle cx="17" cy="17" r="5" fill="#ffffff" opacity="0.65" />
        )}
      </svg>
      <span
        className={`mt-1 max-w-16 text-center text-[8px] font-semibold leading-tight ${
          badge.earned ? "text-gray-700" : "text-gray-400"
        }`}
      >
        {badge.name.replace("Medalla ", "")}
      </span>
    </div>
  );
}

export default function BadgeCase({ badges }: { badges: Badge[] }) {
  const earned = badges.filter((b) => b.earned).length;
  return (
    <div>
      <p className="pixel mb-2 text-[9px] text-muted">
        MEDALLERO {earned}/{badges.length}
      </p>
      <div className="flex flex-wrap gap-3">
        {badges.map((b) => (
          <BadgeIcon key={b.id} badge={b} />
        ))}
      </div>
    </div>
  );
}
