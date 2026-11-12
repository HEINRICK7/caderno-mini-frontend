/* Hallmark · pre-emit critique: Philosophy 5 · Hierarchy 5 · Execution 4 · Specificity 5 · Restraint 5 · Variety 4 */
/* Hallmark · macrostructure: Narrative Workflow · theme: Cadernô Express · nav: shared SaaS header · close: statement · motion: none */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { PlanTermsNotice } from "@/components/plan-terms-notice";
import welcomePreview from "../../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/01-boas-vindas.png";
import paymentPreview from "../../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/07-pagamento-confirmado.png";

export const metadata: Metadata = {
  title: "Como funciona",
  description: "Veja como escolher, personalizar e publicar um cartão digital com o Cadernô Express.",
};

const steps = [
  {
    number: "01",
    title: "Escolha a situação",
    description: "Encontre um modelo para agradecer, dar boas-vindas, divulgar uma oferta, enviar um lembrete ou falar sobre um serviço.",
    note: "Há modelos para produtos e serviços.",
  },
  {
    number: "02",
    title: "Personalize a mensagem",
    description: "Preencha os campos do modelo com as informações do seu negócio e do cliente. Você não precisa montar o design do zero.",
    note: "Os campos mudam conforme o modelo.",
  },
  {
    number: "03",
    title: "Confira a prévia",
    description: "Veja como o cartão ficará antes de publicar. Ajuste os dados e revise o texto com calma.",
    note: "Criar e visualizar a prévia não tem custo.",
  },
  {
    number: "04",
    title: "Publique e compartilhe",
    description: "Escolha um plano e conclua a compra no checkout da AbacatePay. Depois que o pagamento for confirmado, você recebe um link público para compartilhar.",
    note: "Seu cliente abre o link sem conta; você escolhe quando compartilhar.",
  },
];

const faqs = [
  {
    question: "Preciso pagar para criar a mensagem?",
    answer: "Não. Você pode escolher um modelo, personalizar os campos e conferir a prévia sem custo. O pagamento é necessário para publicar o cartão e liberar o link público.",
  },
  {
    question: "O pagamento é mensal?",
    answer: "Não. O Plano Anual custa R$ 47,00 em pagamento único e dá acesso por 12 meses.",
  },
  {
    question: "Posso pedir reembolso?",
    answer: "Os planos são de pagamento único, sem renovação automática. Para solicitar um reembolso, entre em contato com o suporte do Cadernô; o acesso é encerrado depois que o estorno é confirmado.",
  },
  {
    question: "O Cadernô envia a mensagem pelo WhatsApp?",
    answer: "Não envia mensagens automaticamente nem em massa. Depois de publicar, você compartilha o link com seus clientes pelos canais que preferir.",
  },
  {
    question: "Preciso entrar em uma conta?",
    answer: "Você pode criar e visualizar a prévia sem entrar. Para concluir a compra e publicar, acesse pelo link enviado ao seu e-mail e use esse mesmo endereço no checkout da AbacatePay.",
  },
  {
    question: "Existe uma demonstração gratuita por link?",
    answer: "Alguns modelos permitem gerar um link de demonstração gratuito. Ele é limitado a uma demonstração por categoria neste navegador, vale por 7 dias e não libera o acesso premium.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="subpage-shell marketing-shell">
      <SiteHeader />
      <div className="marketing-page how-page">
        <header className="marketing-hero how-hero">
          <div className="how-hero__copy">
            <p className="marketing-eyebrow">Do primeiro modelo ao link</p>
            <h1>Uma mensagem especial, em quatro passos.</h1>
            <p>Escolha, personalize e revise seu cartão sem custo. Você só paga quando decidir publicá-lo.</p>
            <Link className="button button--primary marketing-hero__action" href="/templates">
              Ver modelos <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>
          <div aria-hidden="true" className="how-hero__visual">
            <div className="how-hero__halo" />
            <Image alt="" className="how-hero__card how-hero__card--back" src={welcomePreview} />
            <Image alt="" className="how-hero__card how-hero__card--front" src={paymentPreview} />
            <span className="how-hero__caption"><Check aria-hidden="true" size={14} /> Pronto para compartilhar</span>
          </div>
        </header>

        <ol aria-label="Etapas para criar e publicar um cartão" className="workflow-list">
          {steps.map((step) => (
            <li className="workflow-step" key={step.number}>
              <span aria-hidden="true" className="workflow-step__number">{step.number}</span>
              <div className="workflow-step__copy">
                <h2>{step.title}</h2>
                <p>{step.description}</p>
              </div>
              <p className="workflow-step__note"><Check aria-hidden="true" size={16} />{step.note}</p>
            </li>
          ))}
        </ol>

        <section aria-labelledby="how-plans-title" className="how-plans">
          <div className="marketing-section-heading">
            <h2 id="how-plans-title">Quanto custa publicar?</h2>
            <p>Pagamento único, sem assinatura ou renovação automática. Acesso completo por 12 meses.</p>
          </div>
          <div className="how-plan-grid">
            <article className="how-plan">
              <div>
                <h3>Plano Anual</h3>
                <p className="how-plan__price">R$ 47,00</p>
                <p>Pagamento único · acesso por 12 meses</p>
              </div>
              <Link className="button button--primary" href="/templates?plan=annual">
                Escolher o plano anual <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </article>
          </div>
          <p className="how-plans__note">O checkout abre na AbacatePay: use o mesmo e-mail do seu acesso. A publicação e o link público premium são liberados após a confirmação do pagamento. Alguns modelos também oferecem um link de demonstração temporário por 7 dias.</p>
          <PlanTermsNotice plan="annual" />
        </section>

        <section aria-labelledby="how-faq-title" className="marketing-faq">
          <div className="marketing-section-heading">
            <h2 id="how-faq-title">Dúvidas comuns</h2>
            <p>O essencial sobre prévia, publicação e compartilhamento.</p>
          </div>
          <div className="marketing-faq__items">
            {faqs.map((faq) => (
              <details className="marketing-faq__item" key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="marketing-close marketing-close--statement">
          <p>Pequenas mensagens. Grandes conexões.</p>
          <Link className="button button--primary" href="/templates">
            Criar minha mensagem <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </footer>
      </div>
    </main>
  );
}
