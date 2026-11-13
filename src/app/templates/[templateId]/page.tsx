"use client";

import { ArrowRight } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "../../../components/site-header";
import { CustomerAreaShell, CustomerWorkspaceLoading } from "../../../components/customer-area-shell";
import { TemplateFields } from "../../../components/template-fields";
import { MessagePhonePreview } from "../../../components/message-phone-preview";
import { PlanTermsNotice } from "../../../components/plan-terms-notice";
import { trackInitiateCheckout } from "../../../components/meta-pixel";
import { ApiError, api } from "../../../lib/api-client";
import { useCheckoutPlan } from "../../../hooks/use-checkout-plan";
import { useCustomerWorkspace } from "../../../hooks/use-customer-workspace";
import { consumePixQrHandoff } from "../../../lib/pix-qr-handoff";
import type { Template } from "../../../lib/api-contracts";
import {
  SINGLE_PIX_CHARGE_MODE,
  templateEditorFields,
  templateEditorPreviewData,
  templateEditorSubmitData,
} from "../../../lib/template-editor";

type FieldValue = string | number | boolean;

function editableExampleValues(template: Template): Record<string, FieldValue> {
  const editableFields = new Set(template.definition.fields.filter((field) => field.editable !== false).map((field) => field.id));
  const values = Object.fromEntries(
    Object.entries(template.definition.exampleData ?? {}).filter(([fieldId]) => editableFields.has(fieldId)),
  ) as Record<string, FieldValue>;
  if (template.id === "cobranca-pix") {
    values.chargeMode = SINGLE_PIX_CHARGE_MODE;
    values.detailLabel1 = "Valor";
  }
  return values;
}

export default function TemplatePage() {
  const { templateId } = useParams<{ templateId: string }>();
  const router = useRouter();
  const workspace = useCustomerWorkspace();
  const [template, setTemplate] = useState<Template | null>(null);
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pixQrImportMessage, setPixQrImportMessage] = useState("");
  const [pixQrImportFailed, setPixQrImportFailed] = useState(false);
  const requestedCheckoutPlan = useCheckoutPlan();
  const checkoutPlan = workspace.access?.active ? null : requestedCheckoutPlan;

  const initializeTemplate = useCallback((loadedTemplate: Template) => {
    const nextValues = editableExampleValues(loadedTemplate);
    const supportsPixQr = loadedTemplate.definition.fields.some((field) => field.id === "pixCopyPaste");
    const importRequested = supportsPixQr
      && new URLSearchParams(window.location.search).get("usePixQr") === "1";
    const handoff = importRequested ? consumePixQrHandoff() : null;

    if (handoff) {
      nextValues.pixCopyPaste = handoff.payload;
      if (loadedTemplate.definition.fields.some((field) => field.id === "amount")) {
        nextValues.amount = handoff.amount ?? "";
      }
      setPixQrImportMessage(handoff.amount === null
        ? "QR Pix inserido. Confira o recebedor antes de criar a mensagem; o pagador informa o valor no banco."
        : "QR Pix e valor inseridos. Confira o recebedor e o valor antes de criar a mensagem.");
      setPixQrImportFailed(false);
    } else {
      setPixQrImportMessage(importRequested
        ? "Este QR Pix não está disponível nesta aba. Gere outro QR ou cole o código no campo abaixo."
        : "");
      setPixQrImportFailed(importRequested);
    }

    setTemplate(loadedTemplate);
    setValues(nextValues);
  }, []);

  const loadTemplate = useCallback(async () => {
    try {
      const loadedTemplate = await api.getTemplate(templateId);
      initializeTemplate(loadedTemplate);
      setError("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar este modelo.");
    } finally {
      setLoading(false);
    }
  }, [initializeTemplate, templateId]);

  useEffect(() => {
    let active = true;
    void api.getTemplate(templateId).then((loadedTemplate) => {
      if (active) {
        initializeTemplate(loadedTemplate);
      }
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar este modelo.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [initializeTemplate, templateId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!template) return;
    const paymentWindow = checkoutPlan ? window.open("about:blank", "_blank") : null;
    let createdDraftId: string | undefined;
    setSaving(true);
    setError("");
    const data = templateEditorSubmitData(template, values);
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

  const editorContent = (
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
                  : workspace.access?.active
                    ? "Sua conta está conectada e tem acesso premium ativo. Personalize e crie sua mensagem."
                    : "Exemplo preenchido com a mensagem da referência. Edite os campos e veja a prévia em tempo real; para publicar, entre e tenha uma licença ativa."}
              </p>
            </div>
            <div className="template-editor-layout">
              <form className="template-form template-editor-form" onSubmit={submit}>
                <TemplateFields
                  fields={templateEditorFields(template, values)}
                  values={values}
                  pixQrGeneratorHref={template.definition.fields.some((field) => field.id === "pixCopyPaste")
                    ? `/qrcode?returnTemplate=${encodeURIComponent(template.id)}${checkoutPlan ? `&plan=${checkoutPlan}` : ""}`
                    : undefined}
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
                {pixQrImportMessage ? <p className={`pix-qr-import-notice${pixQrImportFailed ? " is-error" : ""}`} role={pixQrImportFailed ? "alert" : "status"}>{pixQrImportMessage}</p> : null}
                {error ? <p className="form-error" role="alert">{error}</p> : null}
                <div className="template-editor-actions">
                  {checkoutPlan ? <PlanTermsNotice plan={checkoutPlan} /> : null}
                  <button className="button button--primary form-submit" disabled={saving || uploadingImage || workspace.status === "loading"} type="submit">
                    {saving
                      ? "Salvando…"
                      : checkoutPlan
                        ? <>Continuar para o checkout <ArrowRight aria-hidden="true" size={17} /></>
                        : workspace.access?.active
                          ? <>Criar mensagem <ArrowRight aria-hidden="true" size={17} /></>
                          : <>Continuar com esta mensagem <ArrowRight aria-hidden="true" size={17} /></>}
                  </button>
                </div>
              </form>
              <MessagePhonePreview
                data={templateEditorPreviewData(template, values)}
                definition={template.definition}
                imagePreviews={imagePreviews}
                title={template.name}
              />
            </div>
          </>
        ) : null}
      </section>
  );

  if (workspace.status === "loading") return <CustomerWorkspaceLoading label="Abrindo o editor da sua mensagem…" />;
  if (workspace.status === "authenticated") {
    return <CustomerAreaShell access={workspace.access} email={workspace.email}>{editorContent}</CustomerAreaShell>;
  }

  return <main className="subpage-shell"><SiteHeader />{editorContent}</main>;
}
