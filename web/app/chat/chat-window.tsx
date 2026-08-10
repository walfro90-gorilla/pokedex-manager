"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import TypeBadge from "@/app/components/type-badge";

// Card de pokémon extraída de los resultados de tools del agente
export type PokemonCard = {
  pokemon_id: number;
  name: string;
  sprite_url?: string | null;
  types?: string[];
};

export type StoredMessage = {
  role: "user" | "assistant";
  content: string;
  cards: PokemonCard[];
};

type ToolUse = { tool: string; result_preview: string; result?: unknown };

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL ?? "http://localhost:8000";

function looksLikeCard(x: unknown): x is PokemonCard {
  return (
    typeof x === "object" && x !== null &&
    "pokemon_id" in x && "name" in x &&
    typeof (x as PokemonCard).pokemon_id === "number"
  );
}

// De la traza de tools -> cards únicas (máx 6 por mensaje)
function extractCards(tools: ToolUse[]): PokemonCard[] {
  const cards = new Map<number, PokemonCard>();
  for (const t of tools) {
    const r = t.result;
    const candidates = Array.isArray(r) ? r : [r];
    for (const c of candidates) {
      if (looksLikeCard(c) && !cards.has(c.pokemon_id)) {
        cards.set(c.pokemon_id, {
          pokemon_id: c.pokemon_id,
          name: c.name,
          sprite_url: (c as PokemonCard & { sprite_url?: string }).sprite_url,
          types: (c as PokemonCard & { types?: string[] }).types,
        });
      }
    }
  }
  return [...cards.values()].slice(0, 6);
}

function CardChip({ card }: { card: PokemonCard }) {
  return (
    <Link
      href={`/pokedex/${card.name}`}
      className="poke-card flex w-36 shrink-0 flex-col items-center p-3 text-center"
    >
      {card.sprite_url ? (
        <Image src={card.sprite_url} alt={card.name} width={72} height={72} unoptimized />
      ) : (
        <div className="h-[72px] w-[72px] rounded-full bg-gray-100" />
      )}
      <span className="pixel mt-1 text-[8px] text-muted">
        #{String(card.pokemon_id).padStart(4, "0")}
      </span>
      <span className="text-xs font-bold capitalize">{card.name}</span>
      {card.types && (
        <span className="mt-1.5 flex flex-wrap justify-center gap-1">
          {card.types.map((t) => (
            <TypeBadge key={t} type={t} size="sm" />
          ))}
        </span>
      )}
    </Link>
  );
}

// Cada chip demuestra un caso del bonus 3: análisis, comparativas,
// recomendaciones y curiosidades — siempre con datos reales vía tools.
const SUGGESTIONS = [
  "¿Qué Pokémon tengo?",
  "¿Cuál de los míos tiene más ataque?",
  "Compara a mis dos Pokémon más fuertes",
  "¿Qué Pokémon me recomiendas agregar según mi equipo?",
  "Cuéntame una curiosidad de un Pokémon de mi equipo",
  "Agrega a eevee a mi colección",
];

export default function ChatWindow({ initialMessages }: { initialMessages: StoredMessage[] }) {
  const [messages, setMessages] = useState<StoredMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text?: string) {
    const message = (text ?? input).trim();
    if (!message || loading) return;

    setLoading(true);
    setError(null);
    setInput("");
    const userMsg: StoredMessage = { role: "user", content: message, cards: [] };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesión expirada, vuelve a iniciar sesión.");

      // El agente recibe solo role/content (las cards son presentación)
      const history = messages.map(({ role, content }) => ({ role, content }));

      const res = await fetch(`${AI_SERVICE_URL}/agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message, history }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Error ${res.status}`);
      }

      const data: { reply: string; tools_used: ToolUse[] } = await res.json();
      const assistantMsg: StoredMessage = {
        role: "assistant",
        content: data.reply,
        cards: extractCards(data.tools_used),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Persistir el intercambio (RLS: insert propio). Si la tabla no existe
      // aún, el chat sigue funcionando sin historial.
      await supabase.from("chat_messages").insert([
        { role: userMsg.role, content: userMsg.content, cards: userMsg.cards },
        { role: assistantMsg.role, content: assistantMsg.content, cards: assistantMsg.cards },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error hablando con el asistente");
    } finally {
      setLoading(false);
    }
  }

  async function clearHistory() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("chat_messages").delete().eq("user_id", user.id);
    setMessages([]);
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="poke-card flex min-h-[360px] flex-1 flex-col gap-4 overflow-y-auto p-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <p className="text-sm text-muted">Prueba con:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  className="rounded-full border-2 border-gray-200 px-4 py-1.5 text-xs font-medium transition-colors hover:border-poke-red hover:text-poke-red"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "self-end" : "self-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm bg-poke-red px-4 py-2.5 text-sm text-white"
                  : "max-w-full rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-2.5 text-sm text-foreground"
              }
            >
              {m.content}
            </div>
            {m.cards.length > 0 && (
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {m.cards.map((c) => (
                  <CardChip key={c.pokemon_id} card={c} />
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 self-start rounded-2xl bg-gray-100 px-4 py-2.5">
            <span className="h-2 w-2 animate-bounce rounded-full bg-poke-red [animation-delay:0ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-poke-red [animation-delay:120ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-poke-red [animation-delay:240ms]" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta..."
          className="flex-1 rounded-full border-2 border-gray-200 bg-surface px-5 py-2.5 text-sm outline-none transition-colors focus:border-poke-blue"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-poke-red px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-poke-red-dark disabled:opacity-50"
        >
          Enviar
        </button>
      </form>

      {messages.length > 0 && (
        <button
          type="button"
          onClick={clearHistory}
          className="self-center text-xs text-muted transition-colors hover:text-poke-red"
        >
          Borrar historial
        </button>
      )}
    </div>
  );
}
