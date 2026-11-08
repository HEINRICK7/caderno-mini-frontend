"use client";

import { ArrowRight, Share2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "../../../components/site-header";
import { TemplateFields } from "../../../components/template-fields";
import { MessagePhonePreview } from "../../../components/message-phone-preview";
import { PlanTermsNotice } from "../../../components/plan-terms-notice";
import { trackInitiateCheckout } from "../../../components/meta-pixel";
import { ApiError, api } from "../../../lib/api-client";
import { useCheckoutPlan } from "../../../hooks/use-checkout-plan";
import type { Template } from "../../../lib/api-contracts";

type FieldValue = string | number | boolean;

function editableExampleValues(template: Template): Record<string, FieldValue> {
  const editableFields = new Set(template.definition.fields.filter((field) => field.editable !== false).map((field) => field.id));
  return Object.fromEntries(
    Object.entries(template.definition.exampleData ?? {}).filter(([fieldId]) => editableFields.has(fieldId)),
  ) as Record<string, FieldValue>;
}

export default function TemplatePage() {
  const { templateId } = useParams<{ templateId: string }>();
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const checkoutPlan = useCheckoutPlan();

  const loadTemplate = useCallback(async () => {
    try {
      const loadedTemplate = await api.getTemplate(templateId);
      setTemplate(loadedTemplate);
      setValues(editableExampleValues(loadedTemplate));
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
      if (active) {
        setTemplate(loadedTemplate);
        setValues(editableExampleValues(loadedTemplate));
      }
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
    const paymentWindow = checkoutPlan ? window.open("about:blank", "_blank") : null;
    let createdDraftId: string | undefined;
    setSaving(true);
    setError("");
    const data = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ""));
    try {
      await api.validateTemplate(template.id, data);
      const draft = await api.createDraft(template.id, data);
      createdDraftId = draft.id;
      if (checkoutPlan) {
        const checkout = await api.createCheckout(draft.id, checkoutPlan);
        trackInitiateCheckout(checkoutPlan);
        if (paymentWindow) {
          paymentWindow.opener = null;
          paymentWindow.location.href = checkout.checkoutUrl;
        } else {
          window.location.assign(checkout.checkoutUrl);
          return;
        }
        router.push(`/compras/${encodeURIComponent(checkout.purchaseId)}`);
        return;
      }
      router.push(`/mensagens/${encodeURIComponent(draft.id)}`);
    } catch (cause) {
      paymentWindow?.close();
      if (checkoutPlan && createdDraftId && cause instanceof ApiError && cause.status === 401) {
        router.push(`/entrar?returnTo=${encodeURIComponent(`/mensagens/${createdDraftId}?plan=${checkoutPlan}`)}`);
      } else {
        setError(cause instanceof ApiError ? cause.message : "Não foi possível criar a mensagem.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="subpage-shell">
      <SiteHeader />
      <section className="subpage-content template-editor-content">
        {loading ? <p className="page-message" role="status">Carregando modelo…</p> : null}
        {!loading && error && !template ? (
          <div className="page-message page-message--error" role="alert">
            <p>{error}</p>
            <button className="text-button" onClick={() => { setLoading(true); setError(""); void loadTemplate(); }} type="button">Tentar novamente</button>
          </div>
        ) : null}
        {!loading && template ? (
          <>
            <div className="template-editor-heading">
              <h1>Personalize sua mensagem</h1>
              <p>
                {checkoutPlan
                  ? "Edite os campos e continue para o checkout do plano anual (R$ 47,00)."
                  : "Exemplo preenchido com a mensagem da referência. Edite os campos e veja a prévia em tempo real."}
              </p>
            </div>
            <div className="template-editor-layout">
              <form className="template-form template-editor-form" onSubmit={submit}>
                <TemplateFields
                  fields={template.definition.fields}
                  values={values}
                  onUploadStateChange={setUploadingImage}
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
                <div className="template-editor-actions">
                  {checkoutPlan ? <PlanTermsNotice plan={checkoutPlan} /> : null}
                  <button className="button button--primary form-submit" disabled={saving || uploadingImage} type="submit">
                    {saving
                      ? "Salvando…"
                      : checkoutPlan
                        ? <>Continuar para o checkout <ArrowRight aria-hidden="true" size={17} /></>
                        : <>Ver prévia gratuita <ArrowRight aria-hidden="true" size={17} /></>}
                  </button>
                  <button
                    aria-label="Compartilhar (disponível após a publicação)"
                    className="button button--share"
                    disabled
                    title="Disponível após a publicação"
                    type="button"
                  >
                    <Share2 aria-hidden="true" size={16} /> Compartilhar
                  </button>
                </div>
              </form>
              <MessagePhonePreview
                data={{ ...(template.definition.exampleData ?? {}), ...values }}
                definition={template.definition}
                imagePreviews={imagePreviews}
                title={template.name}
              />
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
