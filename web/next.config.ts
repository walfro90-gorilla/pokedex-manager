import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone: server.js autocontenido para la imagen Docker (docker-compose.yml)
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
