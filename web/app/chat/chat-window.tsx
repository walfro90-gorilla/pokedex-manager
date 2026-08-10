"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ChatMessage = { role: "user" | "assistant"; content: string };
type ToolUse = { tool: string; result_preview: string };

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL ?? "http://localhost:8000";

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toolsUsed, setToolsUsed] = useState<ToolUse[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage() {
    const message = input.trim();
    if (!message || loading) return;

    setLoading(true);
    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: message }]);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesión expirada, vuelve a iniciar sesión.");

      const res = await fetch(`${AI_SERVICE_URL}/agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message, history: messages }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Error ${res.status}`);
      }

      const data: { reply: string; history: ChatMessage[]; tools_used: ToolUse[] } =
        await res.json();

      setMessages(data.history);
      setToolsUsed(data.tools_used);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error hablando con el asistente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-h-[300px] flex-col gap-2 rounded-lg border border-gray-200 p-4">
        {messages.length === 0 && (
          <p className="text-sm text-gray-500">
            Pregúntame sobre tu colección, ej. &quot;¿qué tipos tengo?&quot; o &quot;agrega a
            bulbasaur&quot;.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <span
              className={
                m.role === "user"
                  ? "inline-block rounded-lg bg-black px-3 py-2 text-sm text-white"
                  : "inline-block rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-800"
              }
            >
              {m.content}
            </span>
          </div>
        ))}
      </div>

      {toolsUsed.length > 0 && (
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer">Tools usadas ({toolsUsed.length})</summary>
          <ul className="mt-1 flex flex-col gap-1">
            {toolsUsed.map((t, i) => (
              <li key={i}>
                <code>{t.tool}</code>: {t.result_preview}
              </li>
            ))}
          </ul>
        </details>
      )}

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
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}
