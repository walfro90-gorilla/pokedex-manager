"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateTrainerNameAction(formData: FormData) {
  const supabase = await createClient();
  const display_name = String(formData.get("display_name") || "").trim().slice(0, 40);
  if (!display_name) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.auth.updateUser({ data: { display_name } });
  if (error) throw new Error(error.message);

  // Write-through al perfil público (directorio de entrenadores)
  await supabase.from("profiles").upsert({ user_id: user.id, display_name });

  revalidatePath("/collection");
  revalidatePath("/trainers");
}
