"use client";

import Link from "next/link";
import { ArrowRight, HeartHandshake, Lightbulb, Palette } from "lucide-react";
import type { CSSProperties } from "react";
import AnimatedContent from "@/components/AnimatedContent";
import SpotlightCard from "@/components/SpotlightCard";

const painPoints = [
  {
    icon: Lightbulb,
    number: "01",
    label: "Relacionamento",
    title: "Faltam palavras na hora certa?",
    description:
      "Comece com modelos para agradecer, lembrar um pagamento ou apresentar uma novidade.",
  },
  {
    icon: Palette,
    number: "02",
    label: "Agilidade",
    title: "Criar cada arte toma tempo?",
    description:
      "Escolha um cartão e personalize os detalhes do seu negócio sem montar tudo do zero.",
  },
  {
    icon: HeartHandshake,
    number: "03",
    label: "Pós-venda",
    title: "O contato esfria depois da venda?",
    description:
      "Tenha opções para agradecer, acompanhar e retomar a conversa quando fizer sentido.",
  },
];

export function HomePainPoints() {
  return (
    <section aria-labelledby="home-pain-points-title" className="home-pain-points" id="situacoes">
      <AnimatedContent className="home-pain-points__intro" distance={18} duration={0.65} threshold={0.12}>
        <p className="home-section-eyebrow">O que o Cadernô resolve</p>
        <h2 id="home-pain-points-title">Menos página em branco. Mais presença no dia a dia.</h2>
        <p>
          Para transformar momentos comuns do negócio em conversas cuidadosas com seus clientes.
        </p>
      </AnimatedContent>

      <AnimatedContent
        className="home-pain-points__grid"
        distance={20}
        duration={0.65}
        stagger={0.12}
        threshold={0.12}
      >
        {painPoints.map(({ icon: Icon, number, label, title, description }, index) => (
          <article className={`home-pain-card home-pain-card--${index + 1}`} key={title}>
            <SpotlightCard
              ambient={false}
              borderGlow={0.3}
              className="home-pain-card__surface"
              flare={false}
              intensity={0.42}
              proximity={96}
              smoothing={0.38}
              softness={0.78}
              spotlightColor="#168a80"
              spotlightSize={250}
              style={
                {
                  "--spotlight-card-surface": index === 1 ? "#f5faf6" : index === 2 ? "#fff8f3" : "#fffefa",
                  "--spotlight-card-border": "rgba(22, 83, 77, 0.12)",
                  "--spotlight-card-shadow": "0 12px 30px rgba(16, 38, 79, 0.055)",
                  "--pain-accent": index === 1 ? "#b9684b" : index === 2 ? "#617b88" : "#168a80",
                } as CSSProperties
              }
              theme="light"
            >
              <div className="home-pain-card__top">
                <span aria-hidden="true" className="home-pain-card__icon">
                  <Icon size={21} strokeWidth={1.8} />
                </span>
                <span className="home-pain-card__number">{number}<span> / 03</span></span>
              </div>
              <p className="home-pain-card__label">{label}</p>
              <h3>{title}</h3>
              <p>{description}</p>
              <Link className="home-pain-card__link" href="/templates">
                Encontrar um modelo <ArrowRight aria-hidden="true" size={15} />
              </Link>
            </SpotlightCard>
          </article>
        ))}
      </AnimatedContent>
    </section>
  );
}
