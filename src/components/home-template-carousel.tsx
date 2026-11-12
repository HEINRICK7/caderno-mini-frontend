"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CreditCard, Heart, Settings, Tag } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import AnimatedContent from "@/components/AnimatedContent";
import welcomePreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/01-boas-vindas.png";
import thanksPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/02-agradecimento-compra.png";
import installmentPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/03-parcela-proxima-vencimento.png";
import duePreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/04-parcela-vence-hoje.png";
import overduePreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/05-parcela-em-aberto.png";
import pixPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/06-cobranca-pix.png";
import paymentPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/07-pagamento-confirmado.png";
import settledPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/08-caderneta-quitada.png";
import servicePreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/09-servico-contratado.png";
import serviceCompletePreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/10-servico-concluido.png";
import birthdayPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/11-aniversario.png";
import productPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/12-produto-em-destaque.png";
import offerPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/13-oferta-especial.png";
import collectionPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/14-novidades-colecao.png";
import reactivationPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/15-reativacao-cliente.png";
import approvalPreview from "../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/16-lembrete-com-aprovacao.png";

const categories = [
  { id: "relacionamento", label: "Relacionamento", Icon: Heart },
  { id: "cobrancas", label: "Cobranças", Icon: CreditCard },
  { id: "ofertas", label: "Ofertas", Icon: Tag },
  { id: "servicos", label: "Serviços", Icon: Settings },
] as const;

type CategoryId = typeof categories[number]["id"];

const cards: Array<{
  id: string;
  title: string;
  description: string;
  image: typeof welcomePreview;
  category: CategoryId;
  className: string;
}> = [
  {
    id: "boas-vindas",
    title: "Boas-vindas",
    description: "Uma mensagem acolhedora para seus clientes.",
    image: welcomePreview,
    category: "relacionamento",
    className: "welcome",
  },
  {
    id: "agradecimento-compra",
    title: "Agradecimento pela compra",
    description: "Agradeça a preferência de quem comprou na sua loja.",
    image: thanksPreview,
    category: "relacionamento",
    className: "birthday",
  },
  {
    id: "aniversario",
    title: "Aniversário",
    description: "Celebre momentos especiais com quem importa.",
    image: birthdayPreview,
    category: "relacionamento",
    className: "collection",
  },
  {
    id: "reativacao-cliente",
    title: "Reativação de cliente",
    description: "Retome o contato com clientes de forma carinhosa.",
    image: reactivationPreview,
    category: "relacionamento",
    className: "offer",
  },
  {
    id: "parcela-proxima",
    title: "Parcela próxima do vencimento",
    description: "Avise sobre a próxima data de vencimento.",
    image: installmentPreview,
    category: "cobrancas",
    className: "due",
  },
  {
    id: "parcela-hoje",
    title: "Parcela vence hoje",
    description: "Lembre seus clientes com cuidado e clareza.",
    image: duePreview,
    category: "cobrancas",
    className: "welcome",
  },
  {
    id: "parcela-atrasada",
    title: "Parcela em atraso",
    description: "Envie um lembrete gentil sobre um pagamento pendente.",
    image: overduePreview,
    category: "cobrancas",
    className: "birthday",
  },
  {
    id: "cobranca-pix",
    title: "Cobrança Pix",
    description: "Compartilhe os dados de pagamento com praticidade.",
    image: pixPreview,
    category: "cobrancas",
    className: "collection",
  },
  {
    id: "pagamento-confirmado",
    title: "Pagamento confirmado",
    description: "Confirme que o pagamento chegou direitinho.",
    image: paymentPreview,
    category: "cobrancas",
    className: "offer",
  },
  {
    id: "caderneta-quitada",
    title: "Caderneta quitada",
    description: "Comemore a quitação da conta com seu cliente.",
    image: settledPreview,
    category: "cobrancas",
    className: "due",
  },
  {
    id: "produto-destaque",
    title: "Produto em destaque",
    description: "Apresente um produto especial do seu negócio.",
    image: productPreview,
    category: "ofertas",
    className: "birthday",
  },
  {
    id: "oferta-especial",
    title: "Oferta especial",
    description: "Divulgue uma condição especial para seus clientes.",
    image: offerPreview,
    category: "ofertas",
    className: "offer",
  },
  {
    id: "novidades-colecao",
    title: "Novidades e coleção",
    description: "Apresente seus produtos com uma mensagem especial.",
    image: collectionPreview,
    category: "ofertas",
    className: "collection",
  },
  {
    id: "servico-contratado",
    title: "Serviço contratado",
    description: "Agradeça pela confiança no seu trabalho.",
    image: servicePreview,
    category: "servicos",
    className: "welcome",
  },
  {
    id: "servico-concluido",
    title: "Serviço concluído",
    description: "Avise que o serviço foi concluído.",
    image: serviceCompletePreview,
    category: "servicos",
    className: "birthday",
  },
  {
    id: "lembrete-aprovacao",
    title: "Lembrete com aprovação",
    description: "Peça a aprovação do cliente para continuar.",
    image: approvalPreview,
    category: "servicos",
    className: "due",
  },
];

const initialCardId = (category: CategoryId) =>
  category === "ofertas" ? "oferta-especial" : cards.find((card) => card.category === category)!.id;

export function HomeTemplateCarousel() {
  const trackRef = useRef<HTMLElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("ofertas");
  const [activeId, setActiveId] = useState("oferta-especial");
  const visibleCards = cards.filter((card) => card.category === selectedCategory);
  const selectedInitialId = initialCardId(selectedCategory);

  useEffect(() => {
    trackRef.current = document.getElementById("examples");
  }, []);

  const scrollToCard = useCallback((id: string, behavior: ScrollBehavior = "smooth") => {
    const track = trackRef.current;
    const card = track?.querySelector<HTMLElement>(`[data-card-id="${id}"]`);
    if (!track || !card) return;

    const trackRect = track.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const cardCenter = cardRect.left - trackRect.left + track.scrollLeft + cardRect.width / 2;

    track.scrollTo({ left: cardCenter - track.clientWidth / 2, behavior });
    setActiveId(id);
  }, []);

  const updateActiveCard = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const center = track.getBoundingClientRect().left + track.clientWidth / 2;
    const cardsInTrack = Array.from(track.querySelectorAll<HTMLElement>("[data-card-id]"));
    const closest = cardsInTrack.reduce<HTMLElement | null>((nearest, card) => {
      if (!nearest) return card;
      const cardCenter = card.getBoundingClientRect().left + card.offsetWidth / 2;
      const nearestCenter = nearest.getBoundingClientRect().left + nearest.offsetWidth / 2;
      return Math.abs(cardCenter - center) < Math.abs(nearestCenter - center) ? card : nearest;
    }, null);

    if (closest?.dataset.cardId) setActiveId(closest.dataset.cardId);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => scrollToCard(selectedInitialId, "auto"));
    return () => window.cancelAnimationFrame(frame);
  }, [scrollToCard, selectedCategory, selectedInitialId]);

  const selectCategory = (category: CategoryId) => {
    setActiveId(initialCardId(category));
    setSelectedCategory(category);
  };

  const moveBy = (direction: -1 | 1) => {
    const currentIndex = visibleCards.findIndex((card) => card.id === activeId);
    const nextIndex = Math.max(0, Math.min(visibleCards.length - 1, Math.max(0, currentIndex) + direction));
    scrollToCard(visibleCards[nextIndex].id);
  };

  const activeIndex = visibleCards.findIndex((card) => card.id === activeId);

  return (
    <div className="home-carousel">
      <AnimatedContent className="home-carousel__intro-reveal" distance={18} duration={0.65} threshold={0.1}>
        <div className="home-carousel__intro">
          <p className="home-section-eyebrow">Modelos para situações reais</p>
          <h2>O que você precisa dizer hoje?</h2>
          <p>Encontre um ponto de partida para agradecer, cobrar com cuidado ou divulgar uma novidade.</p>
        </div>
      </AnimatedContent>

      <AnimatedContent className="home-categories-reveal" delay={0.08} distance={12} duration={0.55} threshold={0.1}>
        <div aria-label="Categorias de mensagens" className="home-categories" role="group">
          <ul>
            {categories.map(({ id, label, Icon }) => (
              <li key={id}>
                <button
                  aria-label={`${label}: ${cards.filter((card) => card.category === id).length} modelos`}
                  aria-pressed={selectedCategory === id}
                  className={selectedCategory === id ? "is-active" : ""}
                  onClick={() => selectCategory(id)}
                  type="button"
                >
                  <Icon aria-hidden="true" size={14} strokeWidth={1.8} />
                  <span>{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </AnimatedContent>

      <AnimatedContent
        aria-label={`Modelos de ${categories.find((category) => category.id === selectedCategory)!.label.toLowerCase()}`}
        className="cards-showcase"
        duration={0.7}
        id="examples"
        onScroll={updateActiveCard}
        role="region"
        stagger={0.09}
        tabIndex={0}
        threshold={0.08}
      >
        {visibleCards.map((card, index) => (
          <Link
            aria-label={`${card.title}. ${card.description} Abrir modelo.`}
            aria-current={activeId === card.id ? "true" : undefined}
            className={`sample-card sample-card--${card.className}${activeId === card.id ? " is-active" : ""}`}
            data-card-id={card.id}
            href={`/templates/${card.id}`}
            key={card.id}
            style={{ "--mobile-order": index } as CSSProperties}
          >
            <Image
              alt=""
              className="sample-card__image"
              height={1672}
              loading={index < 3 ? "eager" : "lazy"}
              sizes="(max-width: 639px) 48vw, (max-width: 899px) 27vw, 18vw"
              src={card.image}
              width={941}
            />
          </Link>
        ))}
      </AnimatedContent>

      <button
        aria-label="Modelo anterior"
        className="carousel-arrow carousel-arrow--previous"
        disabled={activeIndex <= 0}
        onClick={() => moveBy(-1)}
        type="button"
      >
        <ChevronLeft aria-hidden="true" size={18} />
      </button>
      <button
        aria-label="Próximo modelo"
        className="carousel-arrow carousel-arrow--next"
        disabled={activeIndex === visibleCards.length - 1}
        onClick={() => moveBy(1)}
        type="button"
      >
        <ChevronRight aria-hidden="true" size={18} />
      </button>

      <div aria-label="Escolher modelo do carrossel" className="carousel-pagination" role="group">
        {visibleCards.map((card) => (
          <button
            aria-label={`Mostrar ${card.title}`}
            aria-pressed={activeId === card.id}
            className={`carousel-pagination__dot${activeId === card.id ? " is-active" : ""}`}
            key={card.id}
            onClick={() => scrollToCard(card.id)}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}
