import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/dm-sans";
import "./globals.css";
import "./flow.css";

export const metadata: Metadata = {
  title: {
    default: "Cadernô Express — Pequenas mensagens. Grandes conexões.",
    template: "%s | Cadernô Express",
  },
  description: "Crie cartões digitais personalizados para se conectar com seus clientes.",
  applicationName: "Cadernô Express",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Cadernô Express",
    title: "Cadernô Express — Pequenas mensagens. Grandes conexões.",
    description: "Crie cartões digitais personalizados para se conectar com seus clientes.",
  },
};

export const viewport: Viewport = { themeColor: "#FFF9F0" };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
