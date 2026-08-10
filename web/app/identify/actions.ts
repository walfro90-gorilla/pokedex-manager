"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPokemonDetail } from "@/lib/pokeapi";

export async function captureIdentifiedAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const name = String(formData.get("name"));
  if (!user) {
    redirect("/login?redirectTo=/identify");
  }

  // Se vuelve a pedir el detalle a PokéAPI en vez de confiar en lo que mandó
  // el cliente — PokéAPI es la fuente de verdad, no la respuesta de /identify.
  const pokemon = await getPokemonDetail(name);
  if (!pokemon) {
    throw new Error(`PokéAPI no encontró "${name}" — no se puede capturar`);
  }

  const { error } = await supabase.from("collection").insert({
    user_id: user.id,
    pokemon_id: pokemon.id,
    name: pokemon.name,
    sprite_url: pokemon.spriteUrl,
    types: pokemon.types,
    stats: pokemon.stats,
  });

  // 23505 = unique_violation — ya estaba capturado, no es un error real
  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }

  revalidatePath("/collection");
}
