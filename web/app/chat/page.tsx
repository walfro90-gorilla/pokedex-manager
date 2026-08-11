import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Pokeball from "@/app/components/pokeball";
import ChatWindow, { type StoredMessage } from "./chat-window";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/chat");

  // Historial persistente (RLS: solo el propio). Si la tabla aún no existe,
  // degrada a chat sin historial en vez de romper la página.
  const { data } = await supabase
    .from("chat_messages")
    .select("role, content, cards")
    .order("created_at", { ascending: true })
    .limit(60)
    .returns<StoredMessage[]>();

  // El equipo del usuario (RLS) alimenta las sugerencias contextuales del chat
  const { data: team } = await supabase
    .from("collection")
    .select("name, types, stats")
    .order("captured_at", { ascending: false })
    .limit(12);

  return (
    // Altura completa del viewport menos header (3.5rem) y, en mobile, la tab
    // bar inferior (5rem) — el chat llena la pantalla sin scroll de página.
    <main className="mx-auto flex h-[calc(100dvh-8.5rem)] w-full max-w-2xl flex-col px-4 py-4 sm:h-[calc(100dvh-3.5rem)] sm:py-6">
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-black sm:text-3xl">
        <Pokeball size={28} /> Asistente
      </h1>
      <p className="mb-4 text-sm text-muted">
        Consulta y gestiona tu colección conversando. Usa herramientas reales — nada inventado.
      </p>
      <ChatWindow initialMessages={data ?? []} team={team ?? []} />
    </main>
  );
}
