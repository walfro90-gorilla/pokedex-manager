import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone: server.js autocontenido para la imagen Docker (docker-compose.yml)
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "raw.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
