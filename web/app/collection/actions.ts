"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function releaseAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));

  const { error } = await supabase.from("collection").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/collection");
}

export async function updateNoteAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const notes = String(formData.get("notes") || "");

  const { error } = await supabase.from("collection").update({ notes }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/collection");
}
