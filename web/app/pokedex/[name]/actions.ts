"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function captureAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const name = String(formData.get("name"));
  if (!user) {
    redirect(`/login?redirectTo=/pokedex/${name}`);
  }

  const pokemon_id = Number(formData.get("pokemon_id"));
  const sprite_url = String(formData.get("sprite_url"));
  const types = JSON.parse(String(formData.get("types") || "[]"));
  const stats = JSON.parse(String(formData.get("stats") || "{}"));

  const { error } = await supabase.from("collection").insert({
    user_id: user.id,
    pokemon_id,
    name,
    sprite_url,
    types,
    stats,
  });

  // 23505 = unique_violation (collection_user_pokemon_unique) — ya estaba capturado, no es un error real
  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }

  revalidatePath(`/pokedex/${name}`);
  revalidatePath("/collection");
  // captured=1 solo si fue captura NUEVA (dispara el confetti en el detalle)
  redirect(error?.code === "23505" ? `/pokedex/${name}` : `/pokedex/${name}?captured=1`);
}
