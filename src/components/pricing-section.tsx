import { ArrowRight, Check, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PlanTermsNotice } from "@/components/plan-terms-notice";
import paymentPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/07-pagamento-confirmado.png";
import installmentPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/03-parcela-proxima-vencimento.png";
import birthdayPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/11-aniversario.png";

const benefits = [
  "16 modelos premium",
  "Personalização completa",
  "Compartilhamento",
];

function PlanArtwork({
  images,
}: {
  images: readonly { src: typeof paymentPreview; alt: string }[];
}) {
  return (
    <div aria-label="Prévia de modelos de relacionamento e cobrança" className="pricing-plan__art pricing-plan__art--annual" role="group">
      {images.map((image, index) => (
        <Image
          alt={image.alt}
          className={`pricing-plan__art-card pricing-plan__art-card--${index + 1}`}
          key={image.alt}
          src={image.src}
          priority={index === 1}
        />
      ))}
    </div>
  );
}

function PlanAction({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link className="button pricing-plan__action" href={href}>
      {label} <ArrowRight aria-hidden="true" size={17} />
    </Link>
  );
}

function PlanBenefits({ access }: { access: string }) {
  return (
    <ul className="pricing-plan__benefits">
      {benefits.map((benefit) => (
        <li key={benefit}>
          <span aria-hidden="true" className="pricing-plan__check"><Check size={14} strokeWidth={2.5} /></span>
          {benefit}
        </li>
      ))}
      <li>
        <span aria-hidden="true" className="pricing-plan__check"><Check size={14} strokeWidth={2.5} /></span>
        {access}
      </li>
    </ul>
  );
}

export function PricingSection() {
  return (
    <section aria-labelledby="pricing-title" className="pricing-section" id="planos">
      <div className="pricing-section__intro">
        <span className="pricing-section__eyebrow">Plano Cadernô Express</span>
        <h2 id="pricing-title">Acesso completo para o seu negócio</h2>
        <p>Os 16 modelos premium, com toda a liberdade para personalizar e compartilhar o ano todo.</p>
      </div>

      <div className="pricing-section__plans">
        <article className="pricing-plan pricing-plan--annual">
          <PlanArtwork
            images={[
              { src: installmentPreview, alt: "Modelo de parcela próxima do vencimento" },
              { src: paymentPreview, alt: "Modelo de pagamento confirmado" },
              { src: birthdayPreview, alt: "Modelo de aniversário" },
            ]}
          />
          <div className="pricing-plan__surface">
            <div className="pricing-plan__heading">
              <div>
                <h3>Plano Anual</h3>
                <p>Para criar e compartilhar o ano todo.</p>
              </div>
              <span className="pricing-plan__badge">
                <Star aria-hidden="true" fill="currentColor" size={13} /> 12 meses de acesso
              </span>
            </div>

            <div className="pricing-plan__price">
              <span className="pricing-plan__price-accessible">R$ 47,00, pagamento único</span>
              <span aria-hidden="true" className="pricing-plan__currency">R$</span>
              <strong aria-hidden="true">47</strong>
              <span aria-hidden="true" className="pricing-plan__cents">,00</span>
              <span aria-hidden="true" className="pricing-plan__period">pagamento único</span>
            </div>

            <PlanBenefits access="Acesso por 12 meses" />
            <PlanAction
              href="/templates?plan=annual"
              label="Escolher plano anual"
            />
          </div>
        </article>
      </div>
      <PlanTermsNotice plan="annual" />

    </section>
  );
}
