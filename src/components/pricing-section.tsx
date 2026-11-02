import { ArrowRight, Check, Star } from "lucide-react";
import Image from "next/image";
import paymentPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/07-pagamento-confirmado.png";
import installmentPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/03-parcela-proxima-vencimento.png";
import birthdayPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/11-aniversario.png";
import productPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/12-produto-em-destaque.png";
import offerPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/13-oferta-especial.png";
import collectionPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/14-novidades-colecao.png";

type PricingSectionProps = {
  annualCheckoutUrl?: string;
  lifetimeCheckoutUrl?: string;
};

const benefits = [
  "16 modelos premium",
  "Personalização completa",
  "Compartilhamento",
];

function PlanArtwork({
  images,
  variant,
}: {
  images: readonly { src: typeof paymentPreview; alt: string }[];
  variant: "annual" | "lifetime";
}) {
  return (
    <div aria-label={variant === "annual" ? "Prévia de modelos de relacionamento e cobrança" : "Prévia de modelos de ofertas e produtos"} className={`pricing-plan__art pricing-plan__art--${variant}`} role="group">
      {images.map((image, index) => (
        <Image
          alt={image.alt}
          className={`pricing-plan__art-card pricing-plan__art-card--${index + 1}`}
          key={image.alt}
          src={image.src}
          priority={variant === "annual" && index === 1}
        />
      ))}
    </div>
  );
}

function PlanAction({
  checkoutUrl,
  label,
  describedBy,
}: {
  checkoutUrl?: string;
  label: string;
  describedBy: string;
}) {
  const normalizedUrl = checkoutUrl?.trim();

  if (normalizedUrl) {
    return (
      <a className="button pricing-plan__action" href={normalizedUrl}>
        {label} <ArrowRight aria-hidden="true" size={17} />
      </a>
    );
  }

  return (
    <button aria-describedby={describedBy} className="button pricing-plan__action" disabled type="button">
      {label} <ArrowRight aria-hidden="true" size={17} />
    </button>
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

export function PricingSection({ annualCheckoutUrl, lifetimeCheckoutUrl }: PricingSectionProps) {
  return (
    <section aria-labelledby="pricing-title" className="pricing-section" id="planos">
      <div className="pricing-section__intro">
        <span className="pricing-section__eyebrow">Planos Cadernô Express</span>
        <h2 id="pricing-title">Escolha como quer acessar</h2>
        <p>Os 16 modelos premium, com toda a liberdade para personalizar e compartilhar.</p>
      </div>

      <div className="pricing-section__plans">
        <article className="pricing-plan pricing-plan--annual">
          <PlanArtwork
            images={[
              { src: installmentPreview, alt: "Modelo de parcela próxima do vencimento" },
              { src: paymentPreview, alt: "Modelo de pagamento confirmado" },
              { src: birthdayPreview, alt: "Modelo de aniversário" },
            ]}
            variant="annual"
          />
          <div className="pricing-plan__surface">
            <div className="pricing-plan__heading">
              <div>
                <h3>Plano Anual</h3>
                <p>Para criar e compartilhar o ano todo.</p>
              </div>
              <span className="pricing-plan__badge">
                <Star aria-hidden="true" fill="currentColor" size={13} /> Melhor opção
              </span>
            </div>

            <div className="pricing-plan__price">
              <span className="pricing-plan__price-accessible">R$ 33,50, pagamento único</span>
              <span aria-hidden="true" className="pricing-plan__currency">R$</span>
              <strong aria-hidden="true">33</strong>
              <span aria-hidden="true" className="pricing-plan__cents">,50</span>
              <span aria-hidden="true" className="pricing-plan__period">pagamento único</span>
            </div>

            <PlanBenefits access="Acesso por 12 meses" />
            <PlanAction
              checkoutUrl={annualCheckoutUrl}
              describedBy="pricing-checkout-note"
              label="Escolher anual"
            />
          </div>
        </article>

        <article className="pricing-plan pricing-plan--lifetime">
          <PlanArtwork
            images={[
              { src: productPreview, alt: "Modelo de produto em destaque" },
              { src: offerPreview, alt: "Modelo de oferta especial" },
              { src: collectionPreview, alt: "Modelo de novidades e coleção" },
            ]}
            variant="lifetime"
          />
          <div className="pricing-plan__surface">
            <div className="pricing-plan__heading">
              <div>
                <h3>Plano Vitalício</h3>
                <p>Uma compra. Acesso sem prazo para acabar.</p>
              </div>
              <span aria-hidden="true" className="pricing-plan__lifetime-mark">Para sempre</span>
            </div>

            <div className="pricing-plan__price">
              <span className="pricing-plan__price-accessible">R$ 67,00, pagamento único</span>
              <span aria-hidden="true" className="pricing-plan__currency">R$</span>
              <strong aria-hidden="true">67</strong>
              <span aria-hidden="true" className="pricing-plan__cents">,00</span>
              <span aria-hidden="true" className="pricing-plan__period">pagamento único</span>
            </div>

            <PlanBenefits access="Acesso vitalício" />
            <PlanAction
              checkoutUrl={lifetimeCheckoutUrl}
              describedBy="pricing-checkout-note"
              label="Quero acesso vitalício"
            />
          </div>
        </article>
      </div>

      {annualCheckoutUrl && lifetimeCheckoutUrl ? null : (
        <p className="pricing-section__note" id="pricing-checkout-note">
          A compra dos planos estará disponível em breve.
        </p>
      )}
    </section>
  );
}
