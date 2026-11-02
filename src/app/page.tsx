import Link from "next/link";
import { ArrowRight, Pencil, Share2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { HomeTemplateCarousel } from "@/components/home-template-carousel";
import { PricingSection } from "@/components/pricing-section";

const steps = [
  { number: "1", title: "Escolha um modelo", text: "Cartões para diversas ocasiões.", icon: "mark" },
  { number: "2", title: "Personalize", text: "Adicione seu toque em segundos.", icon: "pencil" },
  { number: "3", title: "Compartilhe", text: "Envie para seus clientes de forma simples.", icon: "share" },
];

export default function Home() {
  return (
    <div className="home-shell home-page">
      <SiteHeader />

      <main className="home-content">
        <section aria-labelledby="home-title" className="hero">
          <div className="hero__copy">
            <h1 id="home-title">
              Seu próximo recado pode ser
              <span className="hero__headline-highlight">extraordinário.</span>
            </h1>
            <p>
              Modelos lindos para <strong>agradecer, cobrar, divulgar</strong> e criar conexões com seus clientes.
            </p>
            <div className="hero__actions">
              <Link className="button button--primary hero__button" href="/templates">
                Criar minha mensagem <ArrowRight aria-hidden="true" size={17} />
              </Link>
              <Link className="button hero__secondary" href="/templates">
                Ver modelos
              </Link>
            </div>
          </div>

        </section>

        <HomeTemplateCarousel />
        <PricingSection
          annualCheckoutUrl={process.env.NEXT_PUBLIC_CAKTO_ANNUAL_CHECKOUT_URL}
          lifetimeCheckoutUrl={process.env.NEXT_PUBLIC_CAKTO_LIFETIME_CHECKOUT_URL}
        />
      </main>

      <footer className="home-footer">
        <section aria-label="Como funciona" className="steps" id="steps">
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
        </section>
      </footer>
    </div>
  );
}
