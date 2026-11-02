"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { TemplateFields } from "@/components/template-fields";
import { MessagePhonePreview } from "@/components/message-phone-preview";
import { ApiError, api } from "@/lib/api-client";
import type { Draft, Template } from "@/lib/api-contracts";

type FieldValue = string | number | boolean;

function initialValues(draft: Draft, template: Template): Record<string, FieldValue> {
  const values: Record<string, FieldValue> = {};
  for (const field of template.definition.fields) {
    if (field.editable === false) continue;
    const value = draft.data[field.id];
    if (field.type === "boolean") values[field.id] = Boolean(value);
    else if (field.type === "number") values[field.id] = typeof value === "number" ? value : "";
    else values[field.id] = typeof value === "string" ? value : "";
  }
  return values;
}

export default function DraftPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploadBlocked, setImageUploadBlocked] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [creatingDemoLink, setCreatingDemoLink] = useState(false);
  const [demoLink, setDemoLink] = useState("");
  const [demoExpiresAt, setDemoExpiresAt] = useState("");

  const loadDraft = useCallback(async () => {
    try {
      const loadedDraft = await api.getDraft(draftId);
      const loadedTemplate = await api.getTemplate(loadedDraft.templateId);
      setDraft(loadedDraft);
      setTemplate(loadedTemplate);
      setValues(initialValues(loadedDraft, loadedTemplate));
      setImagePreviews({});
      setError("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar a mensagem.");
    } finally {
      setLoading(false);
    }
  }, [draftId]);

  useEffect(() => {
    let active = true;
    void api.getDraft(draftId).then(async (loadedDraft) => ({
      draft: loadedDraft,
      template: await api.getTemplate(loadedDraft.templateId),
    })).then(({ draft: loadedDraft, template: loadedTemplate }) => {
      if (!active) return;
      setDraft(loadedDraft);
      setTemplate(loadedTemplate);
      setValues(initialValues(loadedDraft, loadedTemplate));
      setImagePreviews({});
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar a mensagem.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [draftId]);

  function formData() {
    return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ""));
  }

  async function save() {
    if (!draft || !template) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const data = formData();
      await api.validateTemplate(template.id, data);
      const updated = await api.saveDraft(draft.id, data);
      setDraft(updated);
      setNotice("Alterações salvas.");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível salvar a mensagem.");
      throw cause;
    } finally {
      setSaving(false);
    }
  }

  async function continueToCheckout(plan: "annual" | "lifetime") {
    if (!draft) return;
    setCheckingOut(true);
    setError("");
    const paymentWindow = window.open("about:blank", "_blank");
    try {
      await save();
      const checkout = await api.createCheckout(draft.id, plan);
      if (paymentWindow) {
        paymentWindow.opener = null;
        paymentWindow.location.href = checkout.checkoutUrl;
      } else {
        window.location.assign(checkout.checkoutUrl);
        return;
      }
      router.push(`/compras/${encodeURIComponent(checkout.purchaseId)}`);
    } catch (cause) {
      paymentWindow?.close();
      if (cause instanceof ApiError && cause.status === 401) {
        router.push(`/entrar?returnTo=${encodeURIComponent(`/mensagens/${draft.id}`)}`);
      } else if (!(cause instanceof ApiError && error)) {
        setError(cause instanceof ApiError ? cause.message : "Não foi possível continuar.");
      }
    } finally {
      setCheckingOut(false);
    }
  }

  async function createDemoLink() {
    if (!draft || !template) return;
    setCreatingDemoLink(true);
    setError("");
    setNotice("");
    setDemoLink("");
    try {
      const data = formData();
      await api.validateTemplate(template.id, data);
      const updated = await api.saveDraft(draft.id, data);
      setDraft(updated);
      const publication = await api.createDemoPublication(draft.id);
      setDemoLink(publication.publicUrl);
      setDemoExpiresAt(publication.expiresAt);
      setNotice(publication.created
        ? "Seu link de demonstração está pronto. Ele funciona por 7 dias e não libera acesso premium."
        : "Você já usou a demonstração gratuita desta categoria; este é o link que já tinha sido criado.");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível gerar o link de demonstração.");
    } finally {
      setCreatingDemoLink(false);
    }
  }

  return (
    <main className="subpage-shell">
      <SiteHeader />
      <section className="subpage-content template-editor-content">
        {loading ? <p className="page-message" role="status">Carregando mensagem…</p> : null}
        {!loading && error && !draft ? (
          <div className="page-message page-message--error" role="alert">
            <p>{error}</p>
            <button className="text-button" onClick={() => { setLoading(true); setError(""); void loadDraft(); }} type="button">Tentar novamente</button>
          </div>
        ) : null}
        {!loading && draft && template ? (
          <>
            <div className="template-editor-heading">
              <h1>Personalize sua mensagem</h1>
              <p>Preencha os detalhes e veja a prévia do seu cartão.</p>
            </div>
            <div className="template-editor-layout">
              <form className="template-form template-editor-form" onSubmit={(event) => { event.preventDefault(); void save().catch(() => undefined); }}>
                <TemplateFields
                  fields={template.definition.fields}
                  values={values}
                  onUploadStateChange={setImageUploadBlocked}
                  onChange={(id, value) => setValues((current) => ({ ...current, [id]: value }))}
                  imagePreviews={imagePreviews}
                  onImagePreviewChange={(id, preview) => setImagePreviews((current) => {
                    const next = { ...current };
                    if (preview) next[id] = preview;
                    else delete next[id];
                    return next;
                  })}
                />
                {error ? <p className="form-error" role="alert">{error}</p> : null}
                {notice ? <p className="form-notice" role="status">{notice}</p> : null}
                <div className="template-editor-actions">
                  <button className="button button--secondary" disabled={saving || checkingOut || creatingDemoLink || imageUploadBlocked} type="submit">
                    {saving ? "Salvando…" : "Salvar alterações"}
                  </button>
                  {template.definition.catalog?.homeCategory ? (
                    <>
                      <button
                        className="button button--secondary button--local-test-link"
                        disabled={saving || checkingOut || creatingDemoLink || imageUploadBlocked}
                        onClick={() => void createDemoLink()}
                        type="button"
                      >
                        {creatingDemoLink ? "Gerando demonstração…" : "Gerar link gratuito de demonstração"}
                      </button>
                      <p className="template-demo-help">Um link por categoria neste navegador; válido por 7 dias e separado do acesso premium.</p>
                    </>
                  ) : null}
                  <button className="button button--primary form-submit" disabled={saving || checkingOut || creatingDemoLink || imageUploadBlocked} onClick={() => void continueToCheckout("annual")} type="button">
                    {checkingOut ? "Aguarde…" : "Anual · R$ 33,50"}
                  </button>
                  <button className="button button--primary form-submit" disabled={saving || checkingOut || creatingDemoLink || imageUploadBlocked} onClick={() => void continueToCheckout("lifetime")} type="button">
                    {checkingOut ? "Aguarde…" : "Vitalício · R$ 67,00"}
                  </button>
                  {demoLink ? (
                    <div className="share-result template-demo-result">
                      <p className="form-notice">Válido até {new Date(demoExpiresAt).toLocaleDateString("pt-BR")}.</p>
                      <a className="share-result__url" href={demoLink}>{demoLink}</a>
                      <a className="button button--secondary" href={`https://wa.me/?text=${encodeURIComponent(demoLink)}`} rel="noreferrer" target="_blank">Compartilhar demonstração</a>
                    </div>
                  ) : null}
                </div>
              </form>
              <MessagePhonePreview data={values} definition={template.definition} imagePreviews={imagePreviews} title={template.name} />
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
