import { typeColor } from "@/lib/pokemon-theme";

export default function TypeBadge({ type, size = "md" }: { type: string; size?: "sm" | "md" }) {
  const { bg, text } = typeColor(type);
  return (
    <span
      className={`inline-block rounded-full font-semibold uppercase tracking-wide ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      }`}
      style={{ backgroundColor: bg, color: text }}
    >
      {type}
    </span>
  );
}
