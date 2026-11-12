import { ArrowRight, Pencil, Share2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import AnimatedContent from "@/components/AnimatedContent";
import { HomeHero } from "@/components/home-hero";
import { HomeTemplateCarousel } from "@/components/home-template-carousel";
import { HomePainPoints } from "@/components/home-pain-points";
import { PricingSection } from "@/components/pricing-section";

const steps = [
  { number: "1", title: "Escolha a situação", text: "Agradecimento, cobrança ou novidade.", icon: "mark" },
  { number: "2", title: "Personalize o cartão", text: "Ajuste a mensagem para o seu negócio.", icon: "pencil" },
  { number: "3", title: "Compartilhe", text: "Envie pelo canal que você já usa.", icon: "share" },
];

export default function Home() {
  return (
    <div className="home-shell home-page">
      <SiteHeader />

      <main className="home-content">
        <HomeHero />

        <HomePainPoints />
        <HomeTemplateCarousel />
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
    </div>
  );
}
