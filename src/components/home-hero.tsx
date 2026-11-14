"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Heart, MessageCircleHeart } from "lucide-react";
import thanksPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/02-agradecimento-compra.png";
import paymentPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/07-pagamento-confirmado.png";
import offerPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/13-oferta-especial.png";
import TiltedCard from "@/components/TiltedCard";

export function HomeHero() {
  return (
    <section aria-labelledby="home-title" className="hero">
      <div className="hero__copy">
        <p className="hero__eyebrow">
          <MessageCircleHeart aria-hidden="true" size={15} strokeWidth={2} />
          16 modelos para pequenos negócios
        </p>
        <h1 id="home-title">
          Cartões para agradecer, lembrar e divulgar.
        </h1>
        <p className="hero__description">Escolha um modelo, personalize e compartilhe pelo WhatsApp. Por R$ 47, em pagamento único, crie, edite, publique e compartilhe quantos cards quiser por 12 meses.</p>
        <div className="hero__actions">
          <Link className="button button--primary hero__button" href="/templates">
            Escolher um modelo <ArrowRight aria-hidden="true" size={17} />
          </Link>
          <Link className="button hero__secondary" href="#steps">
            Ver como funciona
          </Link>
        </div>
        <div aria-label="Situações atendidas" className="hero__moments">
          <span><Heart aria-hidden="true" size={14} /> Agradecer</span>
          <span>Lembrar pagamento</span>
          <span>Divulgar novidade</span>
        </div>
      </div>

      <div aria-hidden="true" className="hero-art">
        <div className="hero-art__halo" />
        <div className="hero-art__mini hero-art__mini--thanks">
          <Image alt="" className="hero-art__image" height={1672} src={thanksPreview} width={941} />
          <span className="hero-art__label">Agradecimento</span>
        </div>
        <div className="hero-art__mini hero-art__mini--payment">
          <Image alt="" className="hero-art__image" height={1672} src={paymentPreview} width={941} />
          <span className="hero-art__label">Pagamento confirmado</span>
        </div>
        <div className="hero-art__main">
          <TiltedCard
            altText=""
            axis="both"
            captionText="Oferta especial"
            containerHeight="clamp(300px, 32vw, 408px)"
            containerWidth="clamp(169px, 18vw, 229px)"
            glare={0.18}
            imageHeight="100%"
            imageSrc={offerPreview.src}
            imageWidth="100%"
            intro={false}
            rotateAmplitude={5}
            scaleOnHover={1.025}
            shadow={0.28}
            showTooltip={false}
            floating={false}
            gyroscope={false}
            smoothness={0.72}
          />
        </div>
        <div className="hero-art__note">
          <span className="hero-art__note-icon"><Heart aria-hidden="true" size={15} fill="currentColor" /></span>
          <span>Personalize antes de publicar.</span>
        </div>
      </div>
    </section>
  );
}
