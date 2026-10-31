"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ApiError, api } from "@/lib/api-client";
import type { Template } from "@/lib/api-contracts";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState("");
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

  const visibleTemplates = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return templates;
    return templates.filter((template) =>
      `${template.name} ${template.description ?? ""}`.toLocaleLowerCase("pt-BR").includes(term),
    );
  }, [search, templates]);

  return (
    <main className="subpage-shell">
      <SiteHeader />
      <section className="subpage-content">
        <div className="page-heading">
          <h1>Modelos</h1>
          <label className="search-field">
            <Search aria-hidden="true" size={17} />
            <span className="visually-hidden">Buscar modelo</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar modelo" />
          </label>
        </div>

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
                <div className="template-card__content">
                  <h2>{template.name}</h2>
                  {template.description ? <p>{template.description}</p> : null}
                  <Link className="text-link" href={`/templates/${encodeURIComponent(template.id)}`}>Abrir modelo <span aria-hidden="true">→</span></Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
