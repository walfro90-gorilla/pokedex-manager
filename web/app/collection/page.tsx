import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TypeBadge from "@/app/components/type-badge";
import Pokeball from "@/app/components/pokeball";
import BadgeCase from "@/app/components/badge-case";
import { computeBadges } from "@/lib/badges";
import AvatarUpload from "./avatar-upload";
import { releaseAction, updateNoteAction } from "./actions";
import { updateTrainerNameAction } from "./trainer-actions";
import { logout } from "@/app/logout/actions";

type CollectionRow = {
  id: string;
  pokemon_id: number;
  name: string;
  sprite_url: string | null;
  types: string[];
  stats: Record<string, number>;
  notes: string | null;
  captured_at: string;
};

// Sprite pixelado clásico (96px) — el look Game Boy del listado
function pixelSprite(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export default async function CollectionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: collection, error } = await supabase
    .from("collection")
    .select("id, pokemon_id, name, sprite_url, types, stats, notes, captured_at")
    .order("captured_at", { ascending: false })
    .returns<CollectionRow[]>();

  if (error) throw new Error(error.message);

  const displayName = (user?.user_metadata?.display_name as string) || "Entrenador/a";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("es-MX", { month: "long", year: "numeric" })
    : null;
  const count = collection?.length ?? 0;
  const badges = computeBadges(collection ?? []);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      {/* Perfil del entrenador */}
      <section className="poke-card mb-8 flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-1.5">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={96}
              height={96}
              unoptimized
              className="h-24 w-24 rounded-full border-4 border-poke-red object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-poke-red bg-gray-50">
              <Pokeball size={48} className="opacity-40" />
            </div>
          )}
          <AvatarUpload />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <p className="pixel text-[9px] text-muted">ENTRENADOR/A</p>
          <h1 className="mt-1 text-2xl font-black">{displayName}</h1>
          <form
            action={updateTrainerNameAction}
            className="mt-2 flex justify-center gap-2 sm:justify-start"
          >
            <input
              type="text"
              name="display_name"
              defaultValue={displayName === "Entrenador/a" ? "" : displayName}
              placeholder="Tu nombre de entrenador..."
              maxLength={40}
              className="rounded-full border-2 border-gray-200 px-4 py-1.5 text-xs outline-none transition-colors focus:border-poke-blue"
            />
            <button
              type="submit"
              className="rounded-full bg-poke-blue px-4 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
            >
              Guardar
            </button>
          </form>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-muted sm:justify-start">
            <span>
              <strong className="text-poke-red">{count}</strong> Pokémon a su cargo
            </span>
            {memberSince && <span>Entrenador/a desde {memberSince}</span>}
            <form action={logout} className="sm:hidden">
              <button type="submit" className="text-poke-red underline">
                Cerrar sesión
              </button>
            </form>
          </div>
          <div className="mt-4">
            <BadgeCase badges={badges} />
          </div>
        </div>
      </section>

      <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
        <Pokeball size={24} /> Pokémon a su cargo
      </h2>

      {!collection || collection.length === 0 ? (
        <div className="poke-card flex flex-col items-center gap-3 p-10 text-center">
          <Pokeball size={48} className="opacity-30" />
          <p className="text-muted">Aún no capturas ningún Pokémon.</p>
          <Link
            href="/pokedex"
            className="rounded-full bg-poke-red px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-poke-red-dark"
          >
            Ir a la Pokédex
          </Link>
        </div>
      ) : (
        /* Listado estilo Game Boy: panel oscuro con doble borde, sprites
           pixelados, nombres en fuente pixel y barra de PS */
        <section className="rounded-xl border-4 border-poke-navy bg-poke-navy p-1.5">
          <ul className="flex flex-col gap-1.5 rounded-lg border-2 border-white/40 bg-[#10161f] p-2">
            {collection.map((c) => {
              const hp = c.stats?.hp ?? 0;
              return (
                <li key={c.id} className="rounded-md bg-white/5 p-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/pokedex/${c.name}`} className="shrink-0">
                      <Image
                        src={pixelSprite(c.pokemon_id)}
                        alt={c.name}
                        width={56}
                        height={56}
                        unoptimized
                        className="[image-rendering:pixelated]"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <Link
                          href={`/pokedex/${c.name}`}
                          className="pixel truncate text-[11px] uppercase text-white hover:text-poke-yellow"
                        >
                          {c.name}
                        </Link>
                        <span className="pixel shrink-0 text-[8px] text-white/50">
                          No.{String(c.pokemon_id).padStart(4, "0")}
                        </span>
                      </div>
                      {hp > 0 && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="pixel text-[8px] text-poke-yellow">PS</span>
                          <div className="h-2 max-w-40 flex-1 border border-white/40 bg-black/40">
                            <div
                              className="h-full bg-[#70c860]"
                              style={{ width: `${Math.min(100, (hp / 255) * 100 * 1.8)}%` }}
                            />
                          </div>
                          <span className="pixel text-[8px] text-white/80">{hp}</span>
                        </div>
                      )}
                      <div className="mt-1.5 flex gap-1">
                        {c.types.map((t) => (
                          <TypeBadge key={t} type={t} size="sm" />
                        ))}
                      </div>
                    </div>
                    <form action={releaseAction} className="shrink-0">
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="pixel rounded border border-white/30 px-2 py-1 text-[8px] text-white/70 transition-colors hover:border-poke-red hover:text-poke-red"
                      >
                        SOLTAR
                      </button>
                    </form>
                  </div>
                  <form action={updateNoteAction} className="mt-2 flex gap-2 pl-[68px]">
                    <input type="hidden" name="id" value={c.id} />
                    <input
                      type="text"
                      name="notes"
                      defaultValue={c.notes ?? ""}
                      placeholder="Nota..."
                      className="flex-1 rounded border border-white/20 bg-black/30 px-2 py-1 text-xs text-white placeholder:text-white/30 focus:border-poke-yellow focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="pixel rounded border border-white/30 px-2 py-1 text-[8px] text-white/70 transition-colors hover:border-poke-yellow hover:text-poke-yellow"
                    >
                      OK
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
