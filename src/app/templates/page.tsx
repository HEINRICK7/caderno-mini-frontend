"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StatusSticker } from "../../components/status-sticker";
import { SiteHeader } from "../../components/site-header";
import { ApiError, api } from "../../lib/api-client";
import type { Template } from "../../lib/api-contracts";

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

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [segment, setSegment] = useState<Segment>("product");
  const [category, setCategory] = useState<CategoryFilter>("Todos");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
    return matchesSegment && matchesCategory;
  }), [category, segment, templates]);

  return (
    <main className="subpage-shell templates-shell">
      <SiteHeader />
      <section className="subpage-content templates-content">
        <div className="templates-heading">
          <h1>Escolha um modelo</h1>
          <p>Cartões para o seu negócio. Personalize e compartilhe em segundos.</p>
        </div>

        <div aria-label="Tipo de negócio" className="template-segment" role="group">
          <button
            aria-pressed={segment === "product"}
            className={segment === "product" ? "is-active" : ""}
            onClick={() => setSegment("product")}
            type="button"
          >Produtos</button>
          <button
            aria-pressed={segment === "service"}
            className={segment === "service" ? "is-active" : ""}
            onClick={() => setSegment("service")}
            type="button"
          >Serviços</button>
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

        {loading ? <p className="page-message" role="status">Carregando modelos…</p> : null}
        {!loading && error ? (
          <div className="page-message page-message--error" role="alert">
            <p>{error}</p>
            <button className="text-button" onClick={() => { setLoading(true); setError(""); void loadTemplates(); }} type="button">Tentar novamente</button>
          </div>
        ) : null}
        {!loading && !error && visibleTemplates.length === 0 ? (
          <p className="page-message">{templates.length === 0 ? "Nenhum modelo disponível." : "Nenhum modelo encontrado."}</p>
        ) : null}

        {!loading && !error && visibleTemplates.length > 0 ? (
          <div className="template-grid">
            {visibleTemplates.map((template) => (
              <article className="template-card" key={template.id}>
                <Link
                  aria-label={`${template.name}. ${template.description ?? ""} Abrir modelo`}
                  className="template-card__link"
                  href={`/templates/${encodeURIComponent(template.id)}`}
                >
                  <div
                    className="template-card__art"
                    style={{ backgroundColor: template.definition.visual?.background ?? "#e1f3ef" }}
                  >
                    <StatusSticker
                      className="status-sticker--catalog"
                      illustration={template.definition.card?.illustration ?? "wave"}
                      label={template.name}
                    />
                  </div>
                  <div className="template-card__content">
                    <h2>{template.name}</h2>
                    {template.description ? <p>{template.description}</p> : null}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
