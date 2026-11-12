import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { PwaServiceWorker } from "@/components/pwa-service-worker";
import { MetaPixel } from "@/components/meta-pixel";
import "@fontsource/poppins/latin-700.css";
import "@fontsource/poppins/latin-ext-700.css";
import "@fontsource/poppins/latin-800.css";
import "@fontsource/poppins/latin-ext-800.css";
import "@fontsource/poppins/latin-900.css";
import "@fontsource/poppins/latin-ext-900.css";
import "@fontsource/poppins/latin-800-italic.css";
import "@fontsource/poppins/latin-ext-800-italic.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-ext-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-ext-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-ext-600.css";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/dm-sans";
import "./globals.css";
import "./flow.css";
import "./premium.css";

const publicAppUrl = process.env.PUBLIC_APP_URL ?? "http://localhost:3001";

export const metadata: Metadata = {
  metadataBase: new URL(publicAppUrl),
  title: {
    default: "Cadernô Express — Pequenas mensagens. Grandes conexões.",
    template: "%s | Cadernô Express",
  },
  description:
    "Cartões personalizáveis para pequenos negócios: agradeça, lembre pagamentos e divulgue novidades sem criar cada mensagem do zero.",
  applicationName: "Cadernô Express",
  appleWebApp: {
    capable: true,
    title: "Cadernô Express",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Cadernô Express",
    title: "Cadernô Express — Pequenas mensagens. Grandes conexões.",
    description:
      "Cartões personalizáveis para pequenos negócios: agradeça, lembre pagamentos e divulgue novidades sem criar cada mensagem do zero.",
  },
};

export const viewport: Viewport = { themeColor: "#FFF9F0" };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <Suspense fallback={null}>
          <MetaPixel />
        </Suspense>
        <PwaServiceWorker />
      </body>
    </html>
  );
}
