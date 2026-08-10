import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Pokeball from "@/app/components/pokeball";
import TypeBadge from "@/app/components/type-badge";
import BadgeCase from "@/app/components/badge-case";
import { computeBadges } from "@/lib/badges";

type PublicPokemon = {
  pokemon_id: number;
  name: string;
  sprite_url: string | null;
  types: string[];
  captured_at: string;
};

type Profile = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
};

// Perfil público de un entrenador: nombre, foto, medallero y su equipo.
// Las notas personales y el resto de sus datos siguen privados (RLS).
export default async function TrainerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, display_name, avatar_url")
    .eq("user_id", id)
    .maybeSingle<Profile>();

  if (!profile) notFound();

  const { data } = await supabase.rpc("trainer_pokemons", { target: id });
  const team = (data ?? []) as PublicPokemon[];
  const badges = computeBadges(team);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link href="/trainers" className="text-sm font-medium text-poke-blue hover:underline">
        ← Todos los entrenadores
      </Link>

      <section className="poke-card mt-4 mb-8 flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-start">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.display_name}
            width={96}
            height={96}
            unoptimized
            className="h-24 w-24 rounded-full border-4 border-poke-red object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-poke-red bg-gray-50">
            <Pokeball size={48} className="opacity-40" />
          </div>
        )}
        <div className="flex-1 text-center sm:text-left">
          <p className="pixel text-[9px] text-muted">ENTRENADOR/A</p>
          <h1 className="mt-1 text-2xl font-black">{profile.display_name}</h1>
          <p className="mt-1 text-xs text-muted">
            <strong className="text-poke-red">{team.length}</strong> Pokémon a su cargo
          </p>
          <div className="mt-4">
            <BadgeCase badges={badges} />
          </div>
        </div>
      </section>

      <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
        <Pokeball size={24} /> Su equipo
      </h2>

      {team.length === 0 ? (
        <p className="text-sm text-muted">Aún no captura ningún Pokémon.</p>
      ) : (
        /* Denso en mobile: 3 por fila con cards compactas */
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5">
          {team.map((p) => (
            <li key={p.pokemon_id}>
              <Link
                href={`/pokedex/${p.name}`}
                className="poke-card flex flex-col items-center p-2 text-center sm:p-3"
              >
                {p.sprite_url ? (
                  <Image src={p.sprite_url} alt={p.name} width={64} height={64} unoptimized />
                ) : (
                  <Pokeball size={40} className="opacity-30" />
                )}
                <span className="pixel mt-1 text-[7px] text-muted">
                  #{String(p.pokemon_id).padStart(4, "0")}
                </span>
                <span className="w-full truncate text-xs font-bold capitalize">{p.name}</span>
                <span className="mt-1 flex flex-wrap justify-center gap-0.5">
                  {p.types.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
