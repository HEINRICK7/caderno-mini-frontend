import { ArrowRight, Pencil, Share2 } from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import AnimatedContent from "@/components/AnimatedContent";
import { HomeHero } from "@/components/home-hero";
import { HomeTemplateCarousel } from "@/components/home-template-carousel";
import { HomePainPoints } from "@/components/home-pain-points";
import { PricingSection } from "@/components/pricing-section";

const steps = [
  { number: "1", title: "Escolha o que quer dizer", text: "Agradecer, lembrar um pagamento, divulgar uma oferta ou apresentar um serviço.", icon: "mark" },
  { number: "2", title: "Ajuste e confira", text: "Personalize o modelo e veja a prévia sem pagar antes de publicar.", icon: "pencil" },
  { number: "3", title: "Use e compartilhe", text: "Por R$ 47,00 em pagamento único, tenha 12 meses para publicar cards ilimitados. Compartilhe o link manualmente; nos modelos compatíveis, baixe a imagem para publicar por conta própria.", icon: "share" },
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
            <p>Modelos de agradecimento, cobrança, oferta e serviços. R$ 47,00 em pagamento único, sem renovação: 12 meses para publicar cards ilimitados e compartilhar links manualmente. O download de imagem está disponível em modelos compatíveis.</p>
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
