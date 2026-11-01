import Link from "next/link";
import { ArrowRight, Pencil, Share2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { StatusSticker } from "@/components/status-sticker";

const cards = [
  {
    id: "boas-vindas",
    column: 0,
    row: 0,
    title: "Olá, Maria!",
    message: "Que bom ter você por aqui!",
    tone: "welcome",
  },
  {
    id: "agradecimento-compra",
    column: 1,
    row: 0,
    title: "Obrigado, Maria!",
    message: "Sua compra foi um sucesso!",
    tone: "thanks",
  },
  {
    id: "aniversario",
    column: 2,
    row: 2,
    title: "Feliz aniversário, Maria!",
    message: "",
    tone: "birthday",
  },
];

const steps = [
  { number: "1", title: "Escolha um modelo", text: "Cartões pra produtos ou serviços.", icon: "mark" },
  { number: "2", title: "Personalize", text: "Adicione seu toque em segundos.", icon: "pencil" },
  { number: "3", title: "Compartilhe", text: "Envie para seus clientes de forma simples.", icon: "share" },
];

export default function Home() {
  return (
    <main className="home-shell">
      <SiteHeader />

      <section className="hero">
        <div className="hero__copy">
          <h1>Transforme momentos em mensagens especiais.</h1>
          <p>Crie cartões personalizados para seus clientes e compartilhe em segundos.</p>
          <Link className="button button--primary hero__button" href="/templates">
            Criar minha mensagem <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>

        <div aria-label="Exemplos de cartões personalizados" className="cards-showcase" id="examples">
          <span aria-hidden="true" className="cards-spark cards-spark--left">╱</span>
          <span aria-hidden="true" className="cards-spark cards-spark--top">╱</span>
          <span aria-hidden="true" className="cards-spark cards-spark--right">╱</span>
          {cards.map((card) => (
            <article className={`sample-card sample-card--${card.tone}`} key={card.id}>
              <div className="sample-card__art">
                <StatusSticker column={card.column} label={card.title} row={card.row} />
              </div>
              <div className="sample-card__body">
                <h2>{card.title}</h2>
                <p>{card.message}</p>
                <span aria-hidden="true" className="sample-card__heart">♡</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Como funciona" className="steps" id="steps">
        {steps.map((step) => (
          <article className="step" key={step.number}>
            <span className={`step__number step__number--${step.number}`}>{step.number}</span>
            <span aria-hidden="true" className={`step__icon step__icon--${step.icon}`}>
              {step.icon === "mark" ? <span className="step__mark-art"><i /></span> : null}
              {step.icon === "pencil" ? <Pencil size={20} /> : null}
              {step.icon === "share" ? <Share2 size={19} /> : null}
            </span>
            <div className="step__copy">
              <h2>{step.title}</h2>
              <p>{step.text}</p>
            </div>
            {step.number !== "3" && <ArrowRight aria-hidden="true" className="step__arrow" size={12} />}
          </article>
        ))}
      </section>
    </main>
  );
}
