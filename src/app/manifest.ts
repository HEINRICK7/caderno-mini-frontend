import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Cadernô Express",
    short_name: "Cadernô",
    description: "Crie cartões digitais personalizados para se conectar com seus clientes.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFF9F0",
    theme_color: "#FFF9F0",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/caderno-express-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/caderno-express-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/caderno-express-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
