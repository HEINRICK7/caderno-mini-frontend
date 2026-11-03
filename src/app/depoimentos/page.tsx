/* Hallmark · pre-emit critique: Philosophy 5 · Hierarchy 5 · Execution 4 · Specificity 5 · Restraint 5 · Variety 4 */
/* Hallmark · macrostructure: Catalogue · theme: Cadernô Express · nav: shared SaaS header · close: letter · motion: none */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Depoimentos",
  description: "Depoimentos de clientes do Cadernô Express, publicados com autorização.",
};

export default function TestimonialsPage() {
  return (
    <main className="subpage-shell marketing-shell">
      <SiteHeader />
      <div className="marketing-page testimonials-page">
        <header className="marketing-hero testimonials-hero">
          <p className="marketing-eyebrow">Depoimentos</p>
          <h1>Queremos ouvir sua experiência.</h1>
          <p>No momento, não há depoimentos de clientes publicados. Quando recebermos relatos autorizados, eles estarão disponíveis nesta página.</p>
        </header>

        <footer className="marketing-close marketing-close--letter">
          <p>Conheça o Cadernô Express e veja como ele funciona.</p>
          <Link className="button button--primary" href="/como-funciona">
            Como funciona <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </footer>
      </div>
    </main>
  );
}
