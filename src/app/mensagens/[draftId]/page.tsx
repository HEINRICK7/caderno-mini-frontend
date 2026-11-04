"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, Clock3, Copy, Link2, Mail, MessageCircle, Save, Share2, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { TemplateFields } from "@/components/template-fields";
import { MessagePhonePreview } from "@/components/message-phone-preview";
import { ApiError, api } from "@/lib/api-client";
import { useCheckoutPlan } from "@/hooks/use-checkout-plan";
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
  const [demoNotice, setDemoNotice] = useState("");
  const [demoCopied, setDemoCopied] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("");
  const demoLinkAnchorRef = useRef<HTMLAnchorElement>(null);
  const checkoutPlan = useCheckoutPlan();

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
        router.push(`/entrar?returnTo=${encodeURIComponent(`/mensagens/${draft.id}?plan=${plan}`)}`);
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
    setDemoNotice("");
    setCopyFeedback("");
    setDemoLink("");
    try {
      const data = formData();
      await api.validateTemplate(template.id, data);
      const updated = await api.saveDraft(draft.id, data);
      setDraft(updated);
      const publication = await api.createDemoPublication(draft.id);
      setDemoLink(publication.publicUrl);
      setDemoExpiresAt(publication.expiresAt);
      setDemoNotice(publication.created
        ? "Demonstração criada. Escolha um canal para enviar o link."
        : "Este é o link de demonstração já criado para esta categoria.");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível gerar o link de demonstração.");
    } finally {
      setCreatingDemoLink(false);
    }
  }

  async function copyDemoLink() {
    if (!demoLink) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(demoLink);
      setDemoCopied(true);
      setCopyFeedback("Link copiado. Agora é só colar na conversa ou publicação.");
      window.setTimeout(() => {
        setDemoCopied(false);
        setCopyFeedback("");
      }, 2200);
    } catch {
      const link = demoLinkAnchorRef.current;
      if (link) {
        link.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(link);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      setCopyFeedback("Selecione o link acima e copie para compartilhar.");
    }
  }

  async function shareDemoLink() {
    if (!demoLink) return;
    if (!navigator.share) {
      await copyDemoLink();
      return;
    }
    try {
      await navigator.share({
        title: "Demonstração do Caderno Express",
        text: "Confira minha demonstração:",
        url: demoLink,
      });
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      await copyDemoLink();
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
              <p>
                {checkoutPlan
                  ? `Você selecionou o plano ${checkoutPlan === "annual" ? "anual (R$ 33,50)" : "vitalício (R$ 67,00)"}. Continue pelo botão correspondente para abrir o checkout seguro.`
                  : "Preencha os detalhes e veja a prévia do seu cartão."}
              </p>
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
                  <button className="button button--secondary template-editor-save" disabled={saving || checkingOut || creatingDemoLink || imageUploadBlocked} type="submit">
                    <Save aria-hidden="true" size={17} />
                    {saving ? "Salvando…" : "Salvar alterações"}
                  </button>
                  {template.definition.catalog?.homeCategory ? (
                    <section className="template-demo-panel" aria-labelledby="template-demo-title">
                      <div className="template-action-heading">
                        <span className="template-action-heading__eyebrow">Prévia gratuita</span>
                        <h2 id="template-demo-title">Mostre sua mensagem antes de publicar</h2>
                        <p>Gere um link temporário para conferir e compartilhar esta versão. A demonstração não libera recursos premium.</p>
                      </div>
                      <button
                        className="button button--secondary template-demo-generate"
                        disabled={saving || checkingOut || creatingDemoLink || imageUploadBlocked}
                        onClick={() => void createDemoLink()}
                        type="button"
                      >
                        <Link2 aria-hidden="true" size={17} />
                        {creatingDemoLink ? "Gerando link…" : "Gerar link gratuito de demonstração"}
                      </button>
                      {demoLink ? (
                        <section className="template-demo-result" aria-label="Link de demonstração pronto">
                          <div className="template-demo-result__summary">
                            <span className="template-demo-result__status"><Check aria-hidden="true" size={14} /> Link pronto</span>
                            <p>{demoNotice || "Envie este link para mostrar sua mensagem."}</p>
                            <span className="template-demo-result__expiry"><Clock3 aria-hidden="true" size={14} /> Válido até {new Date(demoExpiresAt).toLocaleDateString("pt-BR")}</span>
                          </div>
                          <div className="template-demo-link-field">
                            <a className="template-demo-link-field__url" href={demoLink} ref={demoLinkAnchorRef}>{demoLink}</a>
                            <button className="button button--secondary" onClick={() => void copyDemoLink()} type="button">
                              {demoCopied ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
                              {demoCopied ? "Copiado" : "Copiar link"}
                            </button>
                          </div>
                          <div className="template-demo-channels" role="group" aria-label="Canais para compartilhar o link">
                            <a className="button button--share template-demo-channel" href={`https://wa.me/?text=${encodeURIComponent(`Confira minha demonstração do Caderno Express: ${demoLink}`)}`} rel="noreferrer" target="_blank">
                              <MessageCircle aria-hidden="true" size={17} /> WhatsApp
                            </a>
                            <a className="button button--share template-demo-channel" href={`mailto:?subject=${encodeURIComponent("Veja minha demonstração do Caderno Express")}&body=${encodeURIComponent(`Confira minha demonstração: ${demoLink}`)}`}>
                              <Mail aria-hidden="true" size={17} /> E-mail
                            </a>
                            <button className="button button--share template-demo-channel" onClick={() => void shareDemoLink()} type="button">
                              <Share2 aria-hidden="true" size={17} /> Mais canais
                            </button>
                          </div>
                          {copyFeedback ? <p className="template-demo-result__feedback" role="status">{copyFeedback}</p> : null}
                        </section>
                      ) : (
                        <p className="template-demo-footnote"><ShieldCheck aria-hidden="true" size={15} /> Um link por categoria neste navegador, válido por 7 dias.</p>
                      )}
                    </section>
                  ) : null}
                  <section className="template-premium-panel" aria-labelledby="template-premium-title">
                    <div className="template-action-heading">
                      <span className="template-action-heading__eyebrow">Acesso premium</span>
                      <h2 id="template-premium-title">Publique e compartilhe o link definitivo</h2>
                      <p>Escolha seu plano para liberar a versão completa da mensagem.</p>
                    </div>
                    <div className="template-premium-options">
                      <button className="button button--primary form-submit" disabled={saving || checkingOut || creatingDemoLink || imageUploadBlocked} onClick={() => void continueToCheckout("annual")} type="button">
                        {checkingOut ? "Aguarde…" : checkoutPlan === "annual" ? "Continuar com anual · R$ 33,50" : "Anual · R$ 33,50"}
                      </button>
                      <button className="button button--primary form-submit" disabled={saving || checkingOut || creatingDemoLink || imageUploadBlocked} onClick={() => void continueToCheckout("lifetime")} type="button">
                        {checkingOut ? "Aguarde…" : checkoutPlan === "lifetime" ? "Continuar com vitalício · R$ 67,00" : "Vitalício · R$ 67,00"}
                      </button>
                    </div>
                  </section>
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
