const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const PAGE_SIZE = 24;
const DAY = 60 * 60 * 24;

export type PokemonSummary = { id: number; name: string; spriteUrl: string };

export type PokemonMove = { name: string; level: number };

export type PokemonDetail = {
  id: number;
  name: string;
  spriteUrl: string;
  animatedSpriteUrl: string | null;
  cryUrl: string | null;
  types: string[];
  stats: Record<string, number>;
  height: number;
  weight: number;
  moves: PokemonMove[];
};

function officialArtwork(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

function idFromUrl(url: string) {
  const parts = url.split("/").filter(Boolean);
  return Number(parts[parts.length - 1]);
}

async function getAllNames(): Promise<{ name: string; url: string }[]> {
  const res = await fetch(`${POKEAPI_BASE}/pokemon?limit=100000&offset=0`, {
    next: { revalidate: DAY },
  });
  if (!res.ok) throw new Error(`PokéAPI list falló: ${res.status}`);
  const data = await res.json();
  return data.results;
}

// Generación por rango de id — determinista, cero fetches extra.
// Las formas alternas (id > 10000) heredan "—" (sin generación propia).
export const GENERATIONS = [
  { gen: 1, label: "I", from: 1, to: 151 },
  { gen: 2, label: "II", from: 152, to: 251 },
  { gen: 3, label: "III", from: 252, to: 386 },
  { gen: 4, label: "IV", from: 387, to: 493 },
  { gen: 5, label: "V", from: 494, to: 649 },
  { gen: 6, label: "VI", from: 650, to: 721 },
  { gen: 7, label: "VII", from: 722, to: 809 },
  { gen: 8, label: "VIII", from: 810, to: 905 },
  { gen: 9, label: "IX", from: 906, to: 1025 },
] as const;

export function generationLabel(id: number): string | null {
  const g = GENERATIONS.find((g) => id >= g.from && id <= g.to);
  return g ? g.label : null;
}

// Nombres+ids para la búsqueda instantánea del cliente (cache 24h vía getAllNames)
export async function getSearchIndex(): Promise<{ name: string; id: number }[]> {
  const all = await getAllNames();
  return all.map((p) => ({ name: p.name, id: idFromUrl(p.url) }));
}

export async function searchPokemon(
  query: string,
  page: number,
  gen?: number,
  onlyIds?: Set<number>,
) {
  const all = await getAllNames();
  const normalized = query.trim().toLowerCase();
  let filtered = normalized ? all.filter((p) => p.name.includes(normalized)) : all;

  const range = GENERATIONS.find((g) => g.gen === gen);
  if (range) {
    filtered = filtered.filter((p) => {
      const id = idFromUrl(p.url);
      return id >= range.from && id <= range.to;
    });
  }

  // Filtro "mis capturados": solo los ids de la colección del usuario
  if (onlyIds) {
    filtered = filtered.filter((p) => onlyIds.has(idFromUrl(p.url)));
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;

  const items: PokemonSummary[] = filtered.slice(start, start + PAGE_SIZE).map((p) => {
    const id = idFromUrl(p.url);
    return { id, name: p.name, spriteUrl: officialArtwork(id) };
  });

  return { items, total: filtered.length, totalPages, page: safePage };
}

// Los 151 de Kanto para el juego "¿Quién es ese Pokémon?" (cache 24h)
export async function getKantoNames(): Promise<string[]> {
  const res = await fetch(`${POKEAPI_BASE}/pokemon?limit=151&offset=0`, {
    next: { revalidate: DAY },
  });
  if (!res.ok) throw new Error(`PokéAPI kanto falló: ${res.status}`);
  const data = await res.json();
  return data.results.map((p: { name: string }) => p.name);
}

export function officialArtworkUrl(id: number) {
  return officialArtwork(id);
}

export function cryUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;
}

export async function getPokemonDetail(nameOrId: string): Promise<PokemonDetail | null> {
  const res = await fetch(`${POKEAPI_BASE}/pokemon/${nameOrId.toLowerCase()}`, {
    next: { revalidate: DAY },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`PokéAPI detail falló: ${res.status}`);

  const p = await res.json();

  // Movimientos aprendidos por nivel (los "de verdad"), ordenados y sin duplicados
  type RawMove = {
    move: { name: string };
    version_group_details: {
      move_learn_method: { name: string };
      level_learned_at: number;
    }[];
  };
  const levelMoves = new Map<string, number>();
  for (const m of (p.moves ?? []) as RawMove[]) {
    const byLevel = m.version_group_details.find(
      (d) => d.move_learn_method.name === "level-up" && d.level_learned_at > 0,
    );
    if (byLevel && !levelMoves.has(m.move.name)) {
      levelMoves.set(m.move.name, byLevel.level_learned_at);
    }
  }
  const moves = [...levelMoves.entries()]
    .map(([name, level]) => ({ name, level }))
    .sort((a, b) => a.level - b.level)
    .slice(0, 8);

  return {
    id: p.id,
    name: p.name,
    spriteUrl: p.sprites?.other?.["official-artwork"]?.front_default ?? officialArtwork(p.id),
    animatedSpriteUrl: p.sprites?.other?.showdown?.front_default ?? null,
    cryUrl: p.cries?.latest ?? p.cries?.legacy ?? null,
    types: p.types.map((t: { type: { name: string } }) => t.type.name),
    stats: Object.fromEntries(
      p.stats.map((s: { stat: { name: string }; base_stat: number }) => [
        s.stat.name,
        s.base_stat,
      ]),
    ),
    height: p.height,
    weight: p.weight,
    moves,
  };
}
