"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Heart, MessageCircleHeart } from "lucide-react";
import thanksPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/02-agradecimento-compra.png";
import paymentPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/07-pagamento-confirmado.png";
import offerPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/13-oferta-especial.png";
import BlurText from "@/components/BlurText";
import TiltedCard from "@/components/TiltedCard";

export function HomeHero() {
  return (
    <section aria-labelledby="home-title" className="hero">
      <div className="hero__copy">
        <p className="hero__eyebrow">
          <MessageCircleHeart aria-hidden="true" size={15} strokeWidth={2} />
          Pós-venda simples para pequenos negócios
        </p>
        <h1 id="home-title">
          A venda termina.
          <span className="hero__headline-highlight">O cuidado continua.</span>
        </h1>
        <BlurText
          animateBy="words"
          blur={5}
          className="hero__description"
          delay={16}
          direction="top"
          distance={14}
          stepDuration={0.42}
          text="Agradeça, lembre um pagamento ou divulgue uma novidade com um cartão pronto para personalizar, sem criar cada mensagem do zero."
          trigger="load"
        />
        <div className="hero__actions">
          <Link className="button button--primary hero__button" href="/templates">
            Escolher um cartão <ArrowRight aria-hidden="true" size={17} />
          </Link>
          <Link className="button hero__secondary" href="#steps">
            Ver como funciona
          </Link>
        </div>
        <div aria-label="Situações atendidas" className="hero__moments">
          <span><Heart aria-hidden="true" size={14} /> Agradecer</span>
          <span>Lembrar</span>
          <span>Divulgar</span>
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
          <span>Uma mensagem boa fica na memória.</span>
        </div>
      </div>
    </section>
  );
}
