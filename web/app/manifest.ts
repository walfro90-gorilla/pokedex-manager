import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PokéDex Manager",
    short_name: "PokéDex",
    description: "Tu colección personal de Pokémon, con IA",
    start_url: "/pokedex",
    display: "standalone",
    background_color: "#f6f7fb",
    theme_color: "#dc0a2d",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
