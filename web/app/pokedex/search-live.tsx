"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Búsqueda en tiempo real: typeahead sobre el índice completo (nombre+id,
// ~30KB serializados, cacheado 24h en el server). El form sigue siendo GET —
// Enter/Buscar conservan la búsqueda paginada del server component.
export default function SearchLive({
  entries,
  initialQ,
  gen,
}: {
  entries: { name: string; id: number }[];
  initialQ: string;
  gen?: string;
}) {
  const [q, setQ] = useState(initialQ);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const needle = q.trim().toLowerCase();
  const matches =
    needle.length >= 2
      ? entries.filter((e) => e.name.includes(needle)).slice(0, 8)
      : [];

  return (
    <div ref={boxRef} className="relative mb-8">
      <form className="flex gap-2">
        <input
          type="search"
          name="q"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar por nombre..."
          autoComplete="off"
          className="flex-1 rounded-full border-2 border-gray-200 bg-surface px-5 py-2.5 text-sm outline-none transition-colors focus:border-poke-blue"
        />
        {gen && <input type="hidden" name="gen" value={gen} />}
        <button
          type="submit"
          className="rounded-full bg-poke-red px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-poke-red-dark"
        >
          Buscar
        </button>
      </form>

      {open && matches.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border-2 border-gray-200 bg-surface shadow-lg">
          {matches.map((m) => (
            <li key={m.id}>
              <Link
                href={`/pokedex/${m.name}`}
                className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                <Image
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${m.id}.png`}
                  alt=""
                  width={32}
                  height={32}
                  unoptimized
                  className="[image-rendering:pixelated]"
                />
                <span className="text-sm font-semibold capitalize">{m.name}</span>
                <span className="pixel ml-auto text-[9px] text-muted">
                  #{String(m.id).padStart(4, "0")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
