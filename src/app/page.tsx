import { ArrowRight, Pencil, Share2 } from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import AnimatedContent from "@/components/AnimatedContent";
import { HomeHero } from "@/components/home-hero";
import { HomeTemplateCarousel } from "@/components/home-template-carousel";
import { HomePainPoints } from "@/components/home-pain-points";
import { PricingSection } from "@/components/pricing-section";

const steps = [
  { number: "1", title: "Escolha um modelo", text: "Agradecimento, cobrança, novidade ou serviço.", icon: "mark" },
  { number: "2", title: "Personalize e confira", text: "Edite a mensagem e veja a prévia sem pagar.", icon: "pencil" },
  { number: "3", title: "Compartilhe seus cards", text: "Durante 12 meses, publique quantos cards quiser e compartilhe os links pelo canal que preferir.", icon: "share" },
];

export default function Home() {
  return (
    <div className="home-shell home-page">
      <SiteHeader />

      <main className="home-content">
        <HomeHero />

        <HomeTemplateCarousel />
        <HomePainPoints />
        <section aria-label="Como funciona" className="home-steps-section" id="steps">
          <AnimatedContent className="steps" distance={20} duration={0.65} stagger={0.12} threshold={0.08}>
            {steps.map((step) => (
              <article className="step" key={step.number}>
                <span className={`step__number step__number--${step.number}`}>{step.number}</span>
                <span aria-hidden="true" className={`step__icon step__icon--${step.icon}`}>
                  {step.icon === "mark" ? <span className="step__mark-art"><i /></span> : null}
                  {step.icon === "pencil" ? <Pencil size={17} /> : null}
                  {step.icon === "share" ? <Share2 size={16} /> : null}
                </span>
                <div className="step__copy">
                  <h2>{step.title}</h2>
                  <p>{step.text}</p>
                </div>
                {step.number !== "3" && <ArrowRight aria-hidden="true" className="step__arrow" size={12} />}
              </article>
            ))}
          </AnimatedContent>
        </section>
        <PricingSection />
      </main>

      <footer className="home-footer">
        <div className="home-footer__inner">
          <div className="home-footer__brand">
            <span className="home-footer__name">Cadernô Express</span>
            <p>Cartões para cuidar do cliente depois da venda.</p>
          </div>
          <nav aria-label="Links do rodapé" className="home-footer__links">
            <Link href="/templates">Modelos</Link>
            <Link href="/como-funciona">Como funciona</Link>
            <Link href="/para-seu-negocio">Para seu negócio</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
