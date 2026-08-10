"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

// "¿Quién es ese Pokémon?" — silueta (brightness 0) + 4 opciones.
// names[i] = pokémon #i+1 de Kanto; artwork y grito son URLs deterministas.

function artwork(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}
function cry(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;
}

type Round = { answerId: number; options: number[] };

function makeRound(total: number): Round {
  const answerId = 1 + Math.floor(Math.random() * total);
  const options = new Set<number>([answerId]);
  while (options.size < 4) {
    options.add(1 + Math.floor(Math.random() * total));
  }
  return { answerId, options: [...options].sort(() => Math.random() - 0.5) };
}

export default function WhoIsThatPokemon({ names }: { names: string[] }) {
  const [round, setRound] = useState<Round | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const newRound = useCallback(() => {
    setPicked(null);
    setRound(makeRound(names.length));
  }, [names.length]);

  // Primera ronda en el cliente (Math.random no es SSR-safe); diferida para
  // no hacer setState síncrono dentro del effect
  useEffect(() => {
    const t = setTimeout(newRound, 0);
    return () => clearTimeout(t);
  }, [newRound]);

  function answer(id: number) {
    if (!round || picked !== null) return;
    setPicked(id);
    const ok = id === round.answerId;
    setStreak(ok ? streak + 1 : 0);
    if (ok) setBest((b) => Math.max(b, streak + 1));
    // Grito al revelar (hay gesto del usuario: el click)
    if (audioRef.current) {
      audioRef.current.src = cry(round.answerId);
      audioRef.current.volume = 0.35;
      audioRef.current.play().catch(() => {});
    }
  }

  if (!round) {
    return <div className="mx-auto h-72 w-72 animate-pulse rounded-full bg-gray-100" />;
  }

  const revealed = picked !== null;
  const correct = picked === round.answerId;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="pixel flex gap-6 text-[10px] text-muted">
        <span>
          Racha: <span className="text-poke-red">{streak}</span>
        </span>
        <span>
          Mejor: <span className="text-poke-blue">{best}</span>
        </span>
      </div>

      {/* Silueta / reveal */}
      <div className="relative flex h-72 w-72 items-center justify-center rounded-2xl bg-gradient-to-b from-blue-100 to-yellow-50">
        <Image
          src={artwork(round.answerId)}
          alt="¿Quién es ese Pokémon?"
          width={240}
          height={240}
          unoptimized
          priority
          className={`transition-all duration-500 ${revealed ? "" : "brightness-0"}`}
        />
      </div>

      {revealed && (
        <p className="text-center text-xl font-black">
          {correct ? "¡Correcto! " : "¡Casi! "}Es{" "}
          <span className="capitalize text-poke-red">{names[round.answerId - 1]}</span>
        </p>
      )}

      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        {round.options.map((id) => {
          const base =
            "rounded-full border-2 px-4 py-2.5 text-sm font-bold capitalize transition-colors";
          const style = !revealed
            ? "border-gray-200 bg-surface hover:border-poke-red hover:text-poke-red"
            : id === round.answerId
              ? "border-green-600 bg-green-50 text-green-700"
              : id === picked
                ? "border-poke-red bg-red-50 text-poke-red"
                : "border-gray-200 bg-surface text-muted opacity-60";
          return (
            <button
              key={id}
              type="button"
              onClick={() => answer(id)}
              disabled={revealed}
              className={`${base} ${style}`}
            >
              {names[id - 1]}
            </button>
          );
        })}
      </div>

      {revealed && (
        <button
          type="button"
          onClick={newRound}
          className="rounded-full bg-poke-red px-8 py-2.5 text-sm font-bold text-white transition-colors hover:bg-poke-red-dark"
        >
          ¡Otro!
        </button>
      )}

      <audio ref={audioRef} preload="none" />
    </div>
  );
}
