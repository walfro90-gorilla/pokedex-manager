import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Pokeball from "@/app/components/pokeball";

type TrainerRow = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  pokemon_count: number;
  joined_at: string;
};

// Directorio público de entrenadores. Solo perfil + conteo — las colecciones
// individuales siguen privadas por RLS.
export default async function TrainersPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("trainer_directory");

  if (error) throw new Error(error.message);
  const trainers = (data ?? []) as TrainerRow[];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-1 flex items-center gap-2 text-3xl font-black">
        <Pokeball size={30} /> Entrenadores
      </h1>
      <p className="mb-6 text-sm text-muted">
        La comunidad PokéDex Manager. Completa tu perfil en Mi colección para aparecer aquí.
      </p>

      {!trainers || trainers.length === 0 ? (
        <div className="poke-card flex flex-col items-center gap-3 p-10 text-center">
          <Pokeball size={48} className="opacity-30" />
          <p className="text-muted">Aún no hay entrenadores con perfil público.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {trainers.map((t, i) => (
            <li key={t.user_id}>
              <Link
                href={`/trainers/${t.user_id}`}
                className="poke-card flex items-center gap-4 p-4"
              >
              {t.avatar_url ? (
                <Image
                  src={t.avatar_url}
                  alt={t.display_name}
                  width={64}
                  height={64}
                  unoptimized
                  className="h-16 w-16 rounded-full border-2 border-poke-red object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-poke-red bg-gray-50">
                  <Pokeball size={32} className="opacity-40" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {i === 0 && t.pokemon_count > 0 && <span aria-hidden="true">👑</span>}
                  <p className="font-bold">{t.display_name}</p>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  <strong className="text-poke-red">{t.pokemon_count}</strong> Pokémon ·
                  desde{" "}
                  {new Date(t.joined_at).toLocaleDateString("es-MX", {
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span className="pixel text-[9px] text-muted">#{i + 1}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
