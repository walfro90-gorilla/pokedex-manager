import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { trainerIdentity } from "@/lib/trainer";
import Pokeball from "@/app/components/pokeball";

// Banner compacto bajo el header: entrenador + pokébolas utilizadas (equipo
// estilo juego: 6 slots) + acceso al juego. Solo si hay sesión.
export default async function TrainerBanner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { count } = await supabase
    .from("collection")
    .select("id", { count: "exact", head: true });

  const captured = count ?? 0;
  const { displayName, avatarUrl } = await trainerIdentity(supabase, user);
  const slots = 6;

  return (
    <div className="border-b-2 border-gray-100 bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2">
        <Link href="/collection" className="flex min-w-0 items-center gap-2.5">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={32}
              height={32}
              unoptimized
              className="h-8 w-8 rounded-full border-2 border-poke-red object-cover"
            />
          ) : (
            <Pokeball size={26} />
          )}
          <span className="truncate text-sm font-bold">{displayName}</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Pokébolas utilizadas: 6 slots como el equipo del juego */}
          <div className="flex items-center gap-1" title={`${captured} Pokémon capturados`}>
            {Array.from({ length: slots }).map((_, i) => (
              <Pokeball
                key={i}
                size={16}
                className={i < Math.min(captured, slots) ? "" : "opacity-20 grayscale"}
              />
            ))}
            {captured > slots && (
              <span className="pixel ml-1 text-[9px] text-muted">+{captured - slots}</span>
            )}
          </div>
          <Link
            href="/quien-es"
            className="pixel hidden rounded-full border-2 border-gray-200 px-3 py-1 text-[9px] transition-colors hover:border-poke-red hover:text-poke-red xs:block sm:block"
          >
            ¿QUIÉN ES?
          </Link>
        </div>
      </div>
    </div>
  );
}
