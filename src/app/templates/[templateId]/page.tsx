"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { TemplateFields } from "@/components/template-fields";
import { MessageTemplateCard } from "@/components/message-template-card";
import { ApiError, api } from "@/lib/api-client";
import type { Template } from "@/lib/api-contracts";

type FieldValue = string | number | boolean;

export default function TemplatePage() {
  const { templateId } = useParams<{ templateId: string }>();
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadTemplate = useCallback(async () => {
    try {
      setTemplate(await api.getTemplate(templateId));
      setError("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar este modelo.");
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    let active = true;
    void api.getTemplate(templateId).then((loadedTemplate) => {
      if (active) setTemplate(loadedTemplate);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar este modelo.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [templateId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!template) return;
    setSaving(true);
    setError("");
    const data = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ""));
    try {
      await api.validateTemplate(template.id, data);
      const draft = await api.createDraft(template.id, data);
      router.push(`/mensagens/${encodeURIComponent(draft.id)}`);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível criar a mensagem.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="subpage-shell">
      <SiteHeader />
      <section className="subpage-content">
        <Link className="back-link" href="/templates">← Modelos</Link>
        {loading ? <p className="page-message" role="status">Carregando modelo…</p> : null}
        {!loading && error && !template ? (
          <div className="page-message page-message--error" role="alert">
            <p>{error}</p>
            <button className="text-button" onClick={() => { setLoading(true); setError(""); void loadTemplate(); }} type="button">Tentar novamente</button>
          </div>
        ) : null}
        {!loading && template ? (
          <>
            <div className="page-heading page-heading--stacked">
              <h1>{template.name}</h1>
              {template.description ? <p>{template.description}</p> : null}
            </div>
            <div className="editor-layout">
              <form className="template-form" onSubmit={submit}>
                <TemplateFields
                  fields={template.definition.fields}
                  values={values}
                  onChange={(id, value) => setValues((current) => ({ ...current, [id]: value }))}
                />
                {error ? <p className="form-error" role="alert">{error}</p> : null}
                <button className="button button--primary form-submit" disabled={saving} type="submit">
                  {saving ? "Salvando…" : "Continuar"}
                </button>
              </form>
              <div className="preview-panel" aria-label="Prévia da mensagem">
                <MessageTemplateCard data={values} definition={template.definition} title={template.name} />
              </div>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
