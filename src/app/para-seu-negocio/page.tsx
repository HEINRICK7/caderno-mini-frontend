/* Hallmark · pre-emit critique: Philosophy 5 · Hierarchy 5 · Execution 4 · Specificity 5 · Restraint 5 · Variety 4 */
/* Hallmark · macrostructure: Bento Grid · theme: Cadernô Express · nav: shared SaaS header · close: inline rule · motion: none */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { PlanTermsNotice } from "@/components/plan-terms-notice";
import purchasePreview from "../../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/02-agradecimento-compra.png";
import servicePreview from "../../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/09-servico-contratado.png";

export const metadata: Metadata = {
  title: "Para seu negócio",
  description: "Conheça modelos de mensagens para lojas, pequenos comércios e prestadores de serviços.",
};

const faqs = [
  {
    question: "Posso pedir reembolso?",
    answer: "Sim. A Cakto permite solicitar reembolso em até 7 dias corridos após a compra. Os planos têm pagamento único, sem renovação automática; o reembolso encerra o acesso.",
  },
  {
    question: "É para quem vende produtos ou presta serviços?",
    answer: "Para os dois. Há modelos de agradecimento, novidades e ofertas para produtos, além de mensagens para contratação, conclusão e aprovação de serviços.",
  },
  {
    question: "O Cadernô envia mensagens para meus clientes?",
    answer: "Não. O Cadernô Express cria o cartão e libera um link após a publicação. Você escolhe para quem enviar e compartilha pelo canal que preferir; não há disparos automáticos ou em massa.",
  },
  {
    question: "O Cadernô processa cobranças ou pagamentos dos meus clientes?",
    answer: "Não. Informações de pagamento que você incluir em um modelo são fornecidas pelo seu negócio. O Cadernô não inicia nem confirma transações bancárias.",
  },
];

export default function ForYourBusinessPage() {
  return (
    <main className="subpage-shell marketing-shell">
      <SiteHeader />
      <div className="marketing-page business-page">
        <header className="marketing-hero business-hero">
          <p className="marketing-eyebrow">Para quem cuida de cada cliente</p>
          <h1>Mensagens que combinam com seu negócio.</h1>
          <p>Escolha um modelo pronto para o que acontece no seu dia a dia, personalize com seus dados e compartilhe quando estiver pronto.</p>
        </header>

        <section aria-label="Modelos para cada tipo de negócio" className="business-bento">
          <article className="business-tile business-tile--products">
            <div className="business-tile__copy">
              <span className="business-tile__label">Produtos e comércio</span>
              <h2>Para quem vende produtos</h2>
              <p>Agradeça uma compra, apresente um produto, divulgue uma oferta ou conte sobre uma novidade da coleção.</p>
              <Link className="business-tile__link" href="/templates?segment=product">
                Ver modelos para produtos <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
            <Image alt="Modelo demonstrativo de agradecimento por uma compra" className="business-tile__image" height={400} src={purchasePreview} width={280} />
          </article>

          <article className="business-tile business-tile--services">
            <div className="business-tile__copy">
              <span className="business-tile__label">Atendimento e prestação de serviços</span>
              <h2>Para quem presta serviços</h2>
              <p>Confirme um serviço contratado, avise quando ele for concluído ou envie um lembrete para aprovação.</p>
              <Link className="business-tile__link" href="/templates?segment=service">
                Ver modelos para serviços <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
            <Image alt="Modelo demonstrativo de serviço contratado" className="business-tile__image" height={400} src={servicePreview} width={280} />
          </article>

          <article className="business-tile business-tile--relationship">
            <span className="business-tile__label">Relacionamento no dia a dia</span>
            <h2>Continue perto depois da venda.</h2>
            <p>Use mensagens de boas-vindas, agradecimento, aniversário, pagamento confirmado e outros momentos importantes da relação com seus clientes.</p>
            <Link className="business-tile__link" href="/templates">
              Explorar os modelos <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </article>

          <article className="business-tile business-tile--control">
            <span aria-hidden="true" className="business-tile__check"><Check size={18} /></span>
            <span className="business-tile__label">Você mantém o controle</span>
            <h2>Você decide quando e para quem enviar.</h2>
            <p>O Cadernô cria o cartão e o link. O compartilhamento é feito por você, sem disparo automático ou em massa.</p>
          </article>
        </section>

        <section aria-labelledby="business-access-title" className="business-access">
          <div className="marketing-section-heading">
            <h2 id="business-access-title">Experimente antes de publicar.</h2>
            <p>Personalize e confira a prévia sem custo. Pague apenas quando decidir publicar.</p>
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
          <p className="how-plans__note">O checkout é feito na Cakto; use o mesmo e-mail do seu acesso. A publicação premium é liberada depois da confirmação do pagamento. Alguns modelos oferecem um link de demonstração grátis, válido por 7 dias e sem acesso premium.</p>
          <PlanTermsNotice plan="annual" />
        </section>

        <section aria-labelledby="business-faq-title" className="marketing-faq business-faq">
          <div className="marketing-section-heading">
            <h2 id="business-faq-title">Antes de começar</h2>
            <p>Respostas diretas sobre o que a ferramenta faz.</p>
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

        <footer className="marketing-close marketing-close--inline">
          <p>Escolha o tipo de mensagem que seu negócio precisa hoje.</p>
          <Link className="button button--primary" href="/templates">
            Ver todos os modelos <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </footer>
      </div>
    </main>
  );
}
