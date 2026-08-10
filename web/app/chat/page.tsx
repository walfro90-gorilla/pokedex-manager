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
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8">
      <h1 className="mb-1 flex items-center gap-2 text-3xl font-black">
        <Pokeball size={30} /> Asistente
      </h1>
      <p className="mb-6 text-sm text-muted">
        Consulta y gestiona tu colección conversando. Usa herramientas reales — nada inventado.
      </p>
      <ChatWindow initialMessages={data ?? []} team={team ?? []} />
    </main>
  );
}
