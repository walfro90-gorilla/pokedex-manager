// Paleta clásica de los 18 tipos (la que usan los juegos y la comunidad).
// Cada entrada: fondo del badge + color de texto legible encima.
export const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  normal: { bg: "#A8A77A", text: "#1f2937" },
  fire: { bg: "#EE8130", text: "#ffffff" },
  water: { bg: "#6390F0", text: "#ffffff" },
  electric: { bg: "#F7D02C", text: "#1f2937" },
  grass: { bg: "#7AC74C", text: "#1f2937" },
  ice: { bg: "#96D9D6", text: "#1f2937" },
  fighting: { bg: "#C22E28", text: "#ffffff" },
  poison: { bg: "#A33EA1", text: "#ffffff" },
  ground: { bg: "#E2BF65", text: "#1f2937" },
  flying: { bg: "#A98FF3", text: "#1f2937" },
  psychic: { bg: "#F95587", text: "#ffffff" },
  bug: { bg: "#A6B91A", text: "#1f2937" },
  rock: { bg: "#B6A136", text: "#ffffff" },
  ghost: { bg: "#735797", text: "#ffffff" },
  dragon: { bg: "#6F35FC", text: "#ffffff" },
  dark: { bg: "#705746", text: "#ffffff" },
  steel: { bg: "#B7B7CE", text: "#1f2937" },
  fairy: { bg: "#D685AD", text: "#1f2937" },
};

export function typeColor(type: string) {
  return TYPE_COLORS[type.toLowerCase()] ?? { bg: "#9ca3af", text: "#1f2937" };
}

// Nombres de stats en español para la UI
export const STAT_LABELS: Record<string, string> = {
  hp: "PS",
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "At. Esp.",
  "special-defense": "Def. Esp.",
  speed: "Velocidad",
};

export const STAT_MAX = 255; // máximo teórico de base stat para las barras
