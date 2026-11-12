/* Hallmark · pre-emit critique: Philosophy 5 · Hierarchy 5 · Execution 4 · Specificity 5 · Restraint 5 · Variety 4 */
/* Hallmark · macrostructure: Catalogue · theme: Cadernô Express · nav: shared SaaS header · close: letter · motion: none */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart, MessageSquareQuote, Sparkles } from "lucide-react";
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
          <p>Estamos preparando este espaço para histórias reais de quem usa o Cadernô no dia a dia.</p>
        </header>

        <section aria-label="Depoimentos de clientes" className="testimonials-empty">
          <div aria-hidden="true" className="testimonials-empty__art">
            <span className="testimonials-empty__spark"><Sparkles size={16} /></span>
            <span className="testimonials-empty__bubble"><MessageSquareQuote size={38} strokeWidth={1.5} /></span>
            <span className="testimonials-empty__heart"><Heart size={16} fill="currentColor" /></span>
          </div>
          <div className="testimonials-empty__copy">
            <span className="marketing-eyebrow">Relatos verdadeiros, sempre</span>
            <h2>Sem frases prontas. Só experiências reais.</h2>
            <p>Ainda não publicamos depoimentos. Quando eles chegarem, serão exibidos aqui com autorização de cada cliente.</p>
          </div>
        </section>

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
