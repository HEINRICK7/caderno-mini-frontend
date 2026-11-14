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
import type { MerchantChargeMessageContext, Template } from "../../../lib/api-contracts";
import {
  INSTALLMENT_PIX_CHARGE_MODE,
  SINGLE_PIX_CHARGE_MODE,
  templateEditorFields,
  templateEditorPreviewData,
  templateEditorSubmitData,
} from "../../../lib/template-editor";

type FieldValue = string | number | boolean;
type BillingSource = { sourceType: "sale" | "sale_installment" | "sale_payment" | "recurring_charge" | "recurring_payment"; sourceId: string };

function editableExampleValues(template: Template): Record<string, FieldValue> {
  const editableFields = new Set(template.definition.fields.filter((field) => field.editable !== false).map((field) => field.id));
  const values = Object.fromEntries(
    Object.entries(template.definition.exampleData ?? {}).filter(([fieldId]) => editableFields.has(fieldId)),
  ) as Record<string, FieldValue>;
  const financialFieldsToConfirm = template.id === "pagamento-confirmado"
    ? ["amount", "paidAt", "installmentNumber", "installmentTotal", "paymentStatus", "detailsLink"]
    : template.id === "caderneta-quitada"
      ? ["settlementStatus", "outstandingBalance"]
      : [];
  for (const fieldId of financialFieldsToConfirm) values[fieldId] = "";
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
  const [billingSource, setBillingSource] = useState<BillingSource | null>(null);
  const [linkedDraftId, setLinkedDraftId] = useState("");
  const [billingPrefilled, setBillingPrefilled] = useState(false);
  const requestedCheckoutPlan = useCheckoutPlan();
  const checkoutPlan = workspace.access?.active ? null : requestedCheckoutPlan;

  const initializeTemplate = useCallback(async (loadedTemplate: Template, isActive: () => boolean = () => true) => {
    const nextValues = editableExampleValues(loadedTemplate);
    const params = new URLSearchParams(window.location.search);
    const installmentId = params.get("installmentId");
    const recurringChargeId = params.get("recurringChargeId");
    const saleId = params.get("saleId");
    const salePaymentId = params.get("salePaymentId");
    const recurringPaymentId = params.get("recurringPaymentId");
    const requestedSources = [installmentId, recurringChargeId, saleId, salePaymentId, recurringPaymentId].filter(Boolean);
    if (requestedSources.length > 1) throw new Error("Abra uma mensagem por venda ou pagamento por vez.");
    let chargeContext: MerchantChargeMessageContext | null = null;
    const source: BillingSource | null = installmentId
      ? { sourceType: "sale_installment", sourceId: installmentId }
      : recurringChargeId
        ? { sourceType: "recurring_charge", sourceId: recurringChargeId }
        : saleId
          ? { sourceType: "sale", sourceId: saleId }
          : salePaymentId
            ? { sourceType: "sale_payment", sourceId: salePaymentId }
            : recurringPaymentId
              ? { sourceType: "recurring_payment", sourceId: recurringPaymentId }
        : null;
    if (installmentId) chargeContext = await api.getMerchantInstallmentMessageContext(installmentId);
    else if (recurringChargeId) chargeContext = await api.getMerchantRecurringChargeMessageContext(recurringChargeId);
    else if (saleId) chargeContext = await api.getMerchantSaleMessageContext(saleId);
    else if (salePaymentId) chargeContext = await api.getMerchantSalePaymentMessageContext(salePaymentId);
    else if (recurringPaymentId) chargeContext = await api.getMerchantRecurringPaymentMessageContext(recurringPaymentId);

    if (chargeContext) {
      const editableFields = new Set(loadedTemplate.definition.fields.filter((field) => field.editable !== false).map((field) => field.id));
      const setIfEditable = (fieldId: string, value: FieldValue) => {
        if (editableFields.has(fieldId)) nextValues[fieldId] = value;
      };
      setIfEditable("recipientName", chargeContext.customerName);
      setIfEditable("businessName", chargeContext.businessName);
      setIfEditable("amount", chargeContext.amountMinor / 100);
      setIfEditable("installmentAmount", chargeContext.amountMinor / 100);
      setIfEditable("dueDate", chargeContext.dueDate ?? "");
      setIfEditable("detailLabel1", chargeContext.installmentNumber === null ? "Valor" : "Valor da parcela");
      setIfEditable("detailLabel2", "Vencimento");
      setIfEditable("detailLabel3", "Parcela");
      setIfEditable("installmentNumber", chargeContext.installmentNumber ?? "");
      setIfEditable("installmentTotal", chargeContext.installmentTotal ?? "");
      setIfEditable("paidAt", chargeContext.paidAt ?? "");
      setIfEditable("purchaseAmount", chargeContext.amountMinor / 100);
      setIfEditable("productName", chargeContext.itemNames.join(", ").slice(0, 120));
      if (loadedTemplate.id === "cobranca-pix") {
        nextValues.chargeMode = chargeContext.installmentNumber === null ? SINGLE_PIX_CHARGE_MODE : INSTALLMENT_PIX_CHARGE_MODE;
      }
      if (loadedTemplate.id === "agradecimento-compra" && chargeContext.sourceType === "sale") {
        setIfEditable("title", "Obrigado pela sua compra!");
        setIfEditable("subtitle", "Sua compra foi registrada com sucesso.");
        setIfEditable("message", "Agradecemos por escolher nosso negócio. Se precisar de ajuda, estamos à disposição.");
        setIfEditable("detailLabel1", "Produto ou serviço");
        setIfEditable("detailLabel2", "Valor da compra");
      }
      if (loadedTemplate.id === "pagamento-confirmado" && chargeContext.paidAt) {
        setIfEditable("subtitle", "Pagamento registrado manualmente.");
        setIfEditable("message", "Confira no seu banco antes de confirmar esta mensagem.");
      }
      if (["sale_installment", "recurring_charge"].includes(chargeContext.sourceType)) {
        setIfEditable("subtitle", chargeContext.installmentNumber === null ? "A cobrança está disponível para pagamento." : "Confira os dados da parcela antes de pagar.");
        setIfEditable("primaryActionLabel", "Copiar código Pix");
      }
      if (loadedTemplate.definition.fields.some((field) => field.id === "message") && ["sale_installment", "recurring_charge"].includes(chargeContext.sourceType)) {
        setIfEditable("message", "No link você encontra o QR Code Pix e o código Pix Copia e Cola. Confira o recebedor e o valor no app do banco antes de pagar.");
      }
    }

    const supportsPixQr = loadedTemplate.definition.fields.some((field) => field.id === "pixCopyPaste");
    const importRequested = supportsPixQr && params.get("usePixQr") === "1";
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

    if (isActive()) {
      setTemplate(loadedTemplate);
      setValues(nextValues);
      setBillingSource(source);
      setLinkedDraftId("");
      setBillingPrefilled(Boolean(chargeContext));
    }
  }, []);

  const loadTemplate = useCallback(async () => {
    try {
      const loadedTemplate = await api.getTemplate(templateId);
      await initializeTemplate(loadedTemplate);
      setError("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar este modelo.");
    } finally {
      setLoading(false);
    }
  }, [initializeTemplate, templateId]);

  useEffect(() => {
    let active = true;
    void api.getTemplate(templateId).then(async (loadedTemplate) => {
      await initializeTemplate(loadedTemplate, () => active);
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
      const draft = linkedDraftId
        ? await api.saveDraft(linkedDraftId, data)
        : await api.createDraft(template.id, data);
      createdDraftId = draft.id;
      if (billingSource) {
        setLinkedDraftId(draft.id);
        await api.linkMerchantChargeMessage({ draftId: draft.id, ...billingSource });
      }
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
      setLinkedDraftId("");
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
            {billingPrefilled ? <p className="merchant-billing-prefill-notice" role="status">{billingSource?.sourceType === "sale" ? "Preenchida com os dados da venda. Confira os detalhes antes de salvar e compartilhar." : billingSource?.sourceType.includes("payment") ? "Preenchida com os dados do pagamento registrado." : "Preenchida com os dados atuais da caderneta. Confira o valor e o vencimento antes de salvar e compartilhar."}</p> : null}
            {billingSource && ["sale_payment", "recurring_payment"].includes(billingSource.sourceType) && template.id === "pagamento-confirmado" ? <p className="merchant-billing-prefill-notice" role="note">O valor e a data vêm do pagamento registrado. Só marque como confirmado depois de conferir o recebimento no banco; o Cadernô não consulta sua conta nem envia a mensagem automaticamente.</p> : null}
            <div className="template-editor-layout">
              <form className="template-form template-editor-form" onSubmit={submit}>
                <p className="template-editor-guidance">Campos com * são necessários para salvar. Logo e redes sociais são opcionais. A mensagem fica salva como rascunho; publicar e compartilhar o link exige acesso Premium ativo.</p>
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
