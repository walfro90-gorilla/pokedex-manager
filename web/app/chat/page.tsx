import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChatWindow from "./chat-window";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/chat");

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Asistente de colección</h1>
      <p className="mb-6 text-sm text-gray-600">
        Usa herramientas reales sobre tu colección — nada inventado.
      </p>
      <ChatWindow />
    </main>
  );
}
