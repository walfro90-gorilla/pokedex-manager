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

export async function searchPokemon(query: string, page: number) {
  const all = await getAllNames();
  const normalized = query.trim().toLowerCase();
  const filtered = normalized ? all.filter((p) => p.name.includes(normalized)) : all;

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
