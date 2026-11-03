/* Hallmark · pre-emit critique: Philosophy 5 · Hierarchy 5 · Execution 4 · Specificity 5 · Restraint 5 · Variety 4 */
/* Hallmark · macrostructure: Catalogue · theme: Cadernô Express · nav: shared SaaS header · close: letter · motion: none */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import thanksPreview from "../../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/02-agradecimento-compra.png";
import approvalPreview from "../../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/16-lembrete-com-aprovacao.png";
import serviceCompletePreview from "../../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/10-servico-concluido.png";

export const metadata: Metadata = {
  title: "Depoimentos",
  description: "Conheça exemplos de cartões do Cadernô Express. Depoimentos reais serão publicados com autorização.",
};

const examples = [
  {
    title: "Agradecimento pela compra",
    image: thanksPreview,
    alt: "Prévia demonstrativa do modelo de agradecimento pela compra",
  },
  {
    title: "Serviço concluído",
    image: serviceCompletePreview,
    alt: "Prévia demonstrativa do modelo de serviço concluído",
  },
  {
    title: "Lembrete com aprovação",
    image: approvalPreview,
    alt: "Prévia demonstrativa do modelo de lembrete com aprovação",
  },
];

export default function TestimonialsPage() {
  return (
    <main className="subpage-shell marketing-shell">
      <SiteHeader />
      <div className="marketing-page testimonials-page">
        <header className="marketing-hero testimonials-hero">
          <p className="marketing-eyebrow">Depoimentos</p>
          <h1>Relatos reais, em breve.</h1>
          <p>Ainda não há depoimentos autorizados para publicar. Não inventamos avaliações: enquanto reunimos relatos de clientes, você pode conhecer exemplos reais dos modelos do Cadernô Express.</p>
        </header>

        <section aria-labelledby="testimonials-examples-title" className="testimonial-examples">
          <div className="marketing-section-heading">
            <h2 id="testimonials-examples-title">Exemplos de mensagens</h2>
            <p>Estas imagens mostram modelos do produto. Não são avaliações nem falas de clientes.</p>
          </div>
          <div className="testimonial-grid">
            {examples.map((example) => (
              <article className="testimonial-example" key={example.title}>
                <div className="testimonial-example__image">
                  <Image alt={example.alt} height={480} src={example.image} width={320} />
                </div>
                <div className="testimonial-example__caption">
                  <span>Modelo demonstrativo</span>
                  <h3>{example.title}</h3>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="testimonials-faq-title" className="marketing-faq testimonials-faq">
          <div className="marketing-section-heading">
            <h2 id="testimonials-faq-title">Sobre esta página</h2>
          </div>
          <div className="marketing-faq__items">
            <details className="marketing-faq__item">
              <summary>As imagens acima foram enviadas por clientes?</summary>
              <p>Não. São exemplos de modelos criados para mostrar o produto. Nenhuma fala ou experiência de cliente está sendo atribuída a essas imagens.</p>
            </details>
            <details className="marketing-faq__item">
              <summary>Por que ainda não há depoimentos?</summary>
              <p>Estamos reunindo relatos reais com autorização para publicação. Quando estiverem disponíveis, esta página será atualizada.</p>
            </details>
            <details className="marketing-faq__item">
              <summary>Posso experimentar um modelo?</summary>
              <p>Sim. Você pode escolher um modelo, personalizar a mensagem e conferir uma prévia sem custo. Alguns modelos ainda permitem criar um link de demonstração grátis por 7 dias; a publicação premium é liberada após a confirmação do pagamento.</p>
            </details>
          </div>
        </section>

        <footer className="marketing-close marketing-close--letter">
          <p>Veja como sua próxima mensagem pode ficar.</p>
          <Link className="button button--primary" href="/templates">
            Criar uma prévia <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </footer>
      </div>
    </main>
  );
}
