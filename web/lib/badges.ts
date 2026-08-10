// Medallero: las 8 medallas de Kanto como logros derivados de la colección.
// Se computan de las filas ya cargadas — sin tablas ni contadores que mantener.

export type Badge = {
  id: string;
  name: string;
  requirement: string;
  color: string;
  earned: boolean;
};

// Legendarios (rangos por generación, ids de PokéAPI)
const LEGENDARY_RANGES: [number, number][] = [
  [144, 146], [150, 151], [243, 245], [249, 251], [377, 386], [480, 493],
  [638, 649], [716, 721], [785, 809], [888, 905], [1001, 1025],
];

function isLegendary(id: number) {
  return LEGENDARY_RANGES.some(([a, b]) => id >= a && id <= b);
}

export function computeBadges(
  rows: { pokemon_id: number; types: string[] }[],
): Badge[] {
  const count = rows.length;
  const distinctTypes = new Set(rows.flatMap((r) => r.types)).size;
  const hasFire = rows.some((r) => r.types.includes("fire"));
  const hasLegendary = rows.some((r) => isLegendary(r.pokemon_id));

  return [
    { id: "roca", name: "Medalla Roca", requirement: "Captura tu primer Pokémon", color: "#8a8a8a", earned: count >= 1 },
    { id: "cascada", name: "Medalla Cascada", requirement: "Captura 3 Pokémon", color: "#4aa8e0", earned: count >= 3 },
    { id: "trueno", name: "Medalla Trueno", requirement: "Captura 5 Pokémon", color: "#f7d02c", earned: count >= 5 },
    { id: "arcoiris", name: "Medalla Arcoíris", requirement: "Reúne 3 tipos distintos", color: "#7ac74c", earned: distinctTypes >= 3 },
    { id: "alma", name: "Medalla Alma", requirement: "Reúne 6 tipos distintos", color: "#f95587", earned: distinctTypes >= 6 },
    { id: "pantano", name: "Medalla Pantano", requirement: "Captura 10 Pokémon", color: "#a33ea1", earned: count >= 10 },
    { id: "volcan", name: "Medalla Volcán", requirement: "Captura un tipo fuego", color: "#ee8130", earned: hasFire },
    { id: "tierra", name: "Medalla Tierra", requirement: "Captura un legendario", color: "#6f35fc", earned: hasLegendary },
  ];
}
