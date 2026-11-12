"use client";

import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { ArrowUpRight, CircleAlert, RotateCcw, Search, SearchX, ShoppingBag, Sparkles, Wrench } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties } from "react";
import { StatusSticker } from "../../components/status-sticker";
import { SiteHeader } from "../../components/site-header";
import { ApiError, api } from "../../lib/api-client";
import { useCheckoutPlan } from "../../hooks/use-checkout-plan";
import type { Template } from "../../lib/api-contracts";
import welcomePreview from "../../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/01-boas-vindas.png";
import thanksPreview from "../../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/02-agradecimento-compra.png";
import installmentPreview from "../../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/03-parcela-proxima-vencimento.png";
import dueTodayPreview from "../../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/04-parcela-vence-hoje.png";
import overduePreview from "../../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/05-parcela-em-aberto.png";
import pixPreview from "../../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/06-cobranca-pix.png";
import paymentPreview from "../../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/07-pagamento-confirmado.png";
import settledPreview from "../../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/08-caderneta-quitada.png";
import servicePreview from "../../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/09-servico-contratado.png";
import serviceDonePreview from "../../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/10-servico-concluido.png";
import birthdayPreview from "../../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/11-aniversario.png";
import productPreview from "../../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/12-produto-em-destaque.png";
import offerPreview from "../../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/13-oferta-especial.png";
import collectionPreview from "../../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/14-novidades-colecao.png";
import reactivationPreview from "../../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/15-reativacao-cliente.png";
import approvalPreview from "../../../CADERNO_EXPRESS_BRANDKIT/assets/Caderno_Templates_Premium_16/16-lembrete-com-aprovacao.png";

const categories = [
  "Todos",
  "Agradecimento",
  "Boas-vindas",
  "Datas especiais",
  "Cobrança",
  "Entrega",
  "Promoções",
] as const;

type Segment = "product" | "service";
type CategoryFilter = typeof categories[number];

const catalogPreviews: Record<string, StaticImageData> = {
  "boas-vindas": welcomePreview,
  "agradecimento-compra": thanksPreview,
  "parcela-proxima": installmentPreview,
  "parcela-hoje": dueTodayPreview,
  "parcela-atrasada": overduePreview,
  "cobranca-pix": pixPreview,
  "pagamento-confirmado": paymentPreview,
  "caderneta-quitada": settledPreview,
  "servico-contratado": servicePreview,
  "servico-concluido": serviceDonePreview,
  aniversario: birthdayPreview,
  "produto-destaque": productPreview,
  "oferta-especial": offerPreview,
  "novidades-colecao": collectionPreview,
  "reativacao-cliente": reactivationPreview,
  "lembrete-aprovacao": approvalPreview,
};

function subscribeToLocation(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function getRequestedSegment(): Segment {
  const requestedSegment = new URLSearchParams(window.location.search).get("segment");
  return requestedSegment === "service" ? "service" : "product";
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const requestedSegment = useSyncExternalStore(subscribeToLocation, getRequestedSegment, () => "product");
  const [segmentOverride, setSegmentOverride] = useState<Segment | null>(null);
  const segment = segmentOverride ?? requestedSegment;
  const [category, setCategory] = useState<CategoryFilter>("Todos");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const checkoutPlan = useCheckoutPlan();

  const loadTemplates = useCallback(async () => {
    try {
      setTemplates(await api.getTemplates());
      setError("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar os modelos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void api.getTemplates().then((items) => {
      if (active) setTemplates(items);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar os modelos.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const visibleTemplates = useMemo(() => templates.filter((template) => {
    const metadata = template.definition.catalog;
    const matchesSegment = metadata?.segment === undefined || metadata.segment === "both" || metadata.segment === segment;
    const matchesCategory = category === "Todos" || metadata?.category === category;
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    const matchesQuery = normalizedQuery.length === 0 || `${template.name} ${template.description ?? ""}`
      .toLocaleLowerCase("pt-BR")
      .includes(normalizedQuery);
    return matchesSegment && matchesCategory && matchesQuery;
  }), [category, query, segment, templates]);

  function clearFilters() {
    setCategory("Todos");
    setQuery("");
  }

  return (
    <main className="subpage-shell templates-shell">
      <SiteHeader />
      <section className="subpage-content templates-content">
        <div className="templates-heading">
          <div className="templates-heading__copy">
            <span className="templates-eyebrow"><Sparkles aria-hidden="true" size={14} /> Feitos para o dia a dia do seu negócio</span>
            <h1>Escolha o próximo recado.</h1>
            <p>
              {checkoutPlan
                ? "Escolha um modelo para personalizar e continuar com o plano anual (R$ 47,00)."
                : "Comece com uma ideia pronta, personalize do seu jeito e compartilhe no momento certo."}
            </p>
          </div>
          <div aria-label="Modelos para diferentes momentos do negócio" className="templates-heading__proof">
            <span className="templates-heading__proof-icon"><ShoppingBag aria-hidden="true" size={18} /></span>
            <span><strong>Produtos e serviços</strong><small>para diferentes momentos</small></span>
          </div>
        </div>

        <section aria-label="Filtrar modelos" className="catalog-toolbar">
          <div className="catalog-toolbar__top">
            <div aria-label="Tipo de negócio" className="template-segment" role="group">
              <button
                aria-pressed={segment === "product"}
                className={segment === "product" ? "is-active" : ""}
                onClick={() => setSegmentOverride("product")}
                type="button"
              ><ShoppingBag aria-hidden="true" size={16} />Produtos</button>
              <button
                aria-pressed={segment === "service"}
                className={segment === "service" ? "is-active" : ""}
                onClick={() => setSegmentOverride("service")}
                type="button"
              ><Wrench aria-hidden="true" size={16} />Serviços</button>
            </div>
            <label className="catalog-search">
              <Search aria-hidden="true" size={18} />
              <span className="visually-hidden">Buscar modelos</span>
              <input
                aria-label="Buscar modelos"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por ocasião ou mensagem"
                type="search"
                value={query}
              />
              {query ? <button aria-label="Limpar busca" onClick={() => setQuery("")} type="button">×</button> : null}
            </label>
          </div>
          <nav aria-label="Categorias de modelos" className="template-filters">
            {categories.map((item) => (
              <button
                aria-pressed={category === item}
                className={category === item ? "is-active" : ""}
                key={item}
                onClick={() => setCategory(item)}
                type="button"
              >{item}</button>
            ))}
          </nav>
        </section>

        {loading ? (
          <div aria-label="Carregando modelos" aria-live="polite" className="template-grid template-grid--loading" role="status">
            {Array.from({ length: 8 }, (_, index) => (
              <div aria-hidden="true" className="template-card-skeleton" key={index}>
                <span />
                <i />
                <i />
              </div>
            ))}
          </div>
        ) : null}
        {!loading && error ? (
          <div className="catalog-state catalog-state--error" role="alert">
            <span className="catalog-state__icon"><CircleAlert aria-hidden="true" size={21} /></span>
            <div><h2>Não conseguimos carregar os modelos</h2><p>{error} Seus filtros permanecem selecionados enquanto você tenta novamente.</p></div>
            <button className="button button--secondary" onClick={() => { setLoading(true); setError(""); void loadTemplates(); }} type="button">
              <RotateCcw aria-hidden="true" size={16} /> Tentar novamente
            </button>
          </div>
        ) : null}
        {!loading && !error && visibleTemplates.length === 0 ? (
          <div className="catalog-state">
            <span className="catalog-state__icon"><SearchX aria-hidden="true" size={21} /></span>
            <div>
              <h2>{templates.length === 0 ? "Ainda não há modelos publicados" : "Nenhum modelo encontrado"}</h2>
              <p>{templates.length === 0 ? "Os modelos publicados pelo Cadernô aparecerão aqui." : "Experimente outro termo ou limpe os filtros para ver todas as opções."}</p>
            </div>
            {(templates.length > 0 && (query || category !== "Todos")) ? <button className="button button--secondary" onClick={clearFilters} type="button">Limpar filtros</button> : null}
          </div>
        ) : null}

        {!loading && !error && visibleTemplates.length > 0 ? (
          <>
            <div className="catalog-results" aria-live="polite">
              <span><strong>{visibleTemplates.length}</strong> {visibleTemplates.length === 1 ? "modelo" : "modelos"} para {segment === "product" ? "produtos" : "serviços"}</span>
              {query ? <span>Busca por “{query}”</span> : null}
            </div>
            <div className="template-grid">
            {visibleTemplates.map((template, index) => {
              const preview = catalogPreviews[template.id];
              return (
              <article className="template-card" key={template.id}>
                <Link
                  aria-label={`${template.name}. ${template.description ?? ""} Personalizar modelo`}
                  className="template-card__link"
                  href={`/templates/${encodeURIComponent(template.id)}${checkoutPlan ? `?plan=${checkoutPlan}` : ""}`}
                >
                  <div className="template-card__art" style={{ "--template-art-bg": template.definition.visual?.background ?? "#e8f5ef" } as CSSProperties}>
                    {preview ? (
                      <Image alt="" className="template-card__preview-image" src={preview} sizes="(max-width: 520px) 40vw, (max-width: 920px) 30vw, 20vw" priority={index < 4} />
                    ) : (
                      <StatusSticker
                        className="status-sticker--catalog"
                        illustration={template.definition.card?.illustration ?? "wave"}
                        label={template.name}
                      />
                    )}
                    <span className="template-card__open" aria-hidden="true"><ArrowUpRight size={17} /></span>
                  </div>
                  <div className="template-card__content">
                    <span className="template-card__category">{template.definition.catalog?.category ?? (segment === "product" ? "Produtos" : "Serviços")}</span>
                    <h2>{template.name}</h2>
                    {template.description ? <p>{template.description}</p> : null}
                    <span className="template-card__cta">Personalizar <ArrowUpRight aria-hidden="true" size={15} /></span>
                  </div>
                </Link>
              </article>
            );
            })}
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
