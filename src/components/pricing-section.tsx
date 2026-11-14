import { Check, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AnimatedContent from "@/components/AnimatedContent";
import { PlanCheckoutAction } from "@/components/plan-checkout-action";
import { PlanTermsNotice } from "@/components/plan-terms-notice";
import paymentPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/07-pagamento-confirmado.png";
import installmentPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/03-parcela-proxima-vencimento.png";
import birthdayPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/11-aniversario.png";

const benefits = [
  "Escolha entre 16 modelos",
  "Personalize e revise antes de publicar",
  "Crie, edite, publique e compartilhe quantos cards quiser",
];

function PlanArtwork({
  images,
}: {
  images: readonly { src: typeof paymentPreview; alt: string }[];
}) {
  return (
    <AnimatedContent
      aria-label="Prévia de modelos de relacionamento e cobrança"
      className="pricing-plan__art pricing-plan__art--annual"
      distance={12}
      duration={0.55}
      role="group"
      stagger={0.09}
      threshold={0.14}
    >
      {images.map((image, index) => (
        <Image
          alt={image.alt}
          className={`pricing-plan__art-card pricing-plan__art-card--${index + 1}`}
          height={1672}
          key={image.alt}
          src={image.src}
          priority={index === 1}
          width={941}
        />
      ))}
    </AnimatedContent>
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
      <AnimatedContent className="pricing-section__intro-reveal" distance={18} duration={0.65} threshold={0.1}>
        <div className="pricing-section__intro">
          <span className="pricing-section__eyebrow">Plano Cadernô Express</span>
          <h2 id="pricing-title">Todos os cards por 12 meses</h2>
          <p>Escolha entre 16 modelos, personalize e confira a prévia sem pagar. Uma compra de R$ 47, em pagamento único, ativa o acesso da sua conta: por 12 meses, crie, edite, publique e compartilhe quantos cards quiser.</p>
        </div>
      </AnimatedContent>

      <AnimatedContent className="pricing-section__plans" distance={22} duration={0.7} threshold={0.08}>
        <article className="pricing-plan pricing-plan--annual">
          <PlanArtwork
            images={[
              { src: installmentPreview, alt: "Modelo de parcela próxima do vencimento" },
              { src: paymentPreview, alt: "Modelo de pagamento confirmado" },
              { src: birthdayPreview, alt: "Modelo de aniversário" },
            ]}
          />
          <AnimatedContent
            className="pricing-plan__surface"
            distance={14}
            duration={0.55}
            stagger={0.08}
            threshold={0.14}
          >
            <div className="pricing-plan__heading">
              <div>
                <h3>Cards ilimitados</h3>
                <p>Use todos os modelos para criar, editar, publicar e compartilhar quantos cards quiser por 12 meses.</p>
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

            <PlanBenefits access="Crie, edite, publique e compartilhe cards ilimitados por 12 meses" />
            <PlanCheckoutAction />
            <Link className="pricing-plan__models-link" href="/templates">Ver os modelos antes de comprar</Link>
            <p className="pricing-plan__note">R$ 47,00 em pagamento único, sem renovação automática. O acesso para criar, editar e publicar cards ilimitados é ativado após a confirmação na AbacatePay. Compartilhe os links manualmente; nos modelos compatíveis, baixe a imagem para publicar nas redes por conta própria. Após 12 meses, os links deixam de abrir se sua conta não tiver outro acesso ativo; os rascunhos continuam na conta. Não há postagem nem envio automático.</p>
          </AnimatedContent>
        </article>
      </AnimatedContent>
      <AnimatedContent className="pricing-section__terms-reveal" delay={0.08} distance={12} duration={0.55} threshold={0.08}>
        <PlanTermsNotice plan="annual" />
      </AnimatedContent>

    </section>
  );
}
