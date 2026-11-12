"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Archive, Check, CopyPlus, Eye, FilePlus2, Layers3, Send } from "lucide-react";
import { MessagePhonePreview } from "@/components/message-phone-preview";
import { TemplateFields } from "@/components/template-fields";
import { ApiError, api } from "@/lib/api-client";
import { templateDefinitionSchema, type AdminTemplate, type TemplateDefinition } from "@/lib/api-contracts";

type PreviewValue = string | number | boolean;

const starterDefinition: TemplateDefinition = {
  catalog: { segment: "both", category: "Agradecimento", homeCategory: "relacionamento" },
  fields: [
    { id: "businessName", type: "text", label: "Nome do negócio", required: false, maxLength: 80 },
    { id: "title", type: "text", label: "Título", required: true, maxLength: 120 },
    { id: "message", type: "textarea", label: "Mensagem", required: false, maxLength: 500 },
  ],
  visual: {
    layout: "card",
    background: "#f7f1e8",
    surface: "#ffffff",
    accent: "#8b6245",
    heading: "#30271f",
    text: "#2f2a27",
    muted: "#705a49",
    headingFont: "sans",
    bodyFont: "sans",
    frame: "none",
  },
  card: {
    illustration: "wave",
    heading: "{{title}}",
    message: "{{message}}",
    footer: "heart",
    brand: { businessNameFieldId: "businessName" },
  },
  exampleData: {
    businessName: "Seu negócio",
    title: "Uma mensagem especial",
    message: "Escreva aqui uma mensagem para seu cliente.",
  },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { dateStyle: "medium" });
}

function formSignature(input: { id: string; name: string; description: string; definition: string }) {
  return JSON.stringify([input.id.trim(), input.name.trim(), input.description.trim() || null, input.definition]);
}

function initialPreviewValues(definition: TemplateDefinition): Record<string, PreviewValue> {
  return Object.fromEntries(definition.fields.map((field) => {
    const example = definition.exampleData?.[field.id];
    const value = typeof example === "string" || typeof example === "number" || typeof example === "boolean"
      ? example
      : field.type === "boolean" ? false : field.type === "number" ? "" : "";
    return [field.id, value];
  }));
}

function errorMessage(cause: unknown) {
  if (cause instanceof ApiError) {
    if (cause.code === "TEMPLATE_DEFINITION_INVALID") {
      return "O template precisa ter campos válidos, categoria, visual completo e cartão de prévia. Revise a definição e tente novamente.";
    }
    if (cause.status >= 500) return `O servidor retornou erro ${cause.status}. Tente novamente.`;
    return cause.message;
  }
  return "Não foi possível concluir a operação.";
}

export function AdminTemplateManager({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [templates, setTemplates] = useState<AdminTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [archivingId, setArchivingId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [draftVersion, setDraftVersion] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [definition, setDefinition] = useState(() => JSON.stringify(starterDefinition, null, 2));
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [validatedSignature, setValidatedSignature] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, PreviewValue>>({});
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadTemplates = useCallback(async () => {
    setError("");
    try {
      setTemplates(await api.getAdminTemplates());
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        onUnauthorized();
        return;
      }
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => void loadTemplates(), 0);
    return () => window.clearTimeout(loadTimer);
  }, [loadTemplates]);

  const currentSignature = formSignature({ id: templateId, name, description, definition });
  const isSaved = savedSignature === currentSignature && draftVersion !== null;
  const isValidated = validatedSignature === currentSignature;
  const editorDefinition = useMemo(() => {
    try {
      const parsed: unknown = JSON.parse(definition);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
      const result = templateDefinitionSchema.safeParse(parsed);
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }, [definition]);

  function startFrom(template: AdminTemplate, copy: boolean) {
    setError("");
    setNotice("");
    setValidatedSignature(null);
    setPreviewOpen(false);
    setImagePreviews({});
    const nextName = copy ? `${template.name} (cópia)`.slice(0, 120) : template.name;
    const nextDescription = template.description ?? "";
    const nextDefinition = JSON.stringify(template.definition, null, 2);
    let nextId = template.id;
    if (copy) {
      const rootId = `${template.id.slice(0, 88)}-copia`;
      nextId = rootId;
      let suffix = 2;
      while (templates.some((item) => item.id === nextId)) {
        nextId = `${rootId.slice(0, 96 - String(suffix).length)}-${suffix}`;
        suffix += 1;
      }
    }
    setTemplateId(nextId);
    setName(nextName);
    setDescription(nextDescription);
    setDefinition(nextDefinition);
    if (!copy && template.publicationStatus === "draft") {
      setDraftVersion(template.version);
      setSavedSignature(formSignature({ id: nextId, name: nextName, description: nextDescription, definition: nextDefinition }));
    } else {
      setDraftVersion(null);
      setSavedSignature(null);
    }
  }

  function startBlank() {
    setTemplateId("");
    setDraftVersion(null);
    setName("");
    setDescription("");
    setDefinition(JSON.stringify(starterDefinition, null, 2));
    setSavedSignature(null);
    setValidatedSignature(null);
    setPreviewOpen(false);
    setPreviewValues({});
    setImagePreviews({});
    setError("");
    setNotice("");
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const form = { id: templateId.trim(), name: name.trim(), description, definition };
    const signature = formSignature(form);
    try {
      let parsedDefinition: unknown;
      try {
        parsedDefinition = JSON.parse(definition);
      } catch {
        setError("O JSON do template tem um erro de sintaxe. Corrija e salve o rascunho novamente.");
        return;
      }
      if (typeof parsedDefinition !== "object" || parsedDefinition === null || Array.isArray(parsedDefinition)) {
        setError("A definição do template precisa ser um objeto JSON.");
        return;
      }
      const input = {
        id: form.id,
        name: form.name,
        description: description.trim() || null,
        definition: parsedDefinition as Record<string, unknown>,
      };
      const draft = draftVersion === null
        ? await api.createAdminTemplateDraft(input)
        : await api.updateAdminTemplateDraft({ ...input, version: draftVersion });
      setDraftVersion(draft.version);
      setSavedSignature(signature);
      setNotice(`Rascunho ${draft.id} · versão ${draft.version} salvo. Valide e confira a prévia antes de publicar.`);
      await loadTemplates();
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        onUnauthorized();
      } else {
        setError(errorMessage(cause));
      }
    } finally {
      setSaving(false);
    }
  }

  async function validateAndPreview() {
    setValidating(true);
    setError("");
    setNotice("");
    try {
      if (!editorDefinition) {
        setError("A definição não segue o formato do template. Revise o JSON e tente novamente.");
        return;
      }
      await api.validateAdminTemplateDefinition(editorDefinition as Record<string, unknown>);
      setPreviewValues(initialPreviewValues(editorDefinition));
      setImagePreviews({});
      setValidatedSignature(currentSignature);
      setPreviewOpen(true);
      setNotice("Validação concluída. Confira o formulário e o cartão como aparecerão para o cliente.");
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        onUnauthorized();
      } else {
        setError(errorMessage(cause));
      }
    } finally {
      setValidating(false);
    }
  }

  async function publishDraft() {
    if (draftVersion === null || !isSaved || !isValidated) return;
    setPublishing(true);
    setError("");
    setNotice("");
    try {
      const published = await api.publishAdminTemplateDraft(templateId, draftVersion);
      setNotice(`Publicado: ${published.name}, versão ${published.version}. Já está visível no catálogo.`);
      setDraftVersion(null);
      setSavedSignature(null);
      setValidatedSignature(null);
      setPreviewOpen(false);
      await loadTemplates();
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        onUnauthorized();
      } else {
        setError(errorMessage(cause));
      }
    } finally {
      setPublishing(false);
    }
  }

  async function archive(template: AdminTemplate) {
    if (!window.confirm(`Retirar “${template.name}” do catálogo? Os rascunhos existentes continuam preservados.`)) return;
    setArchivingId(template.id);
    setError("");
    setNotice("");
    try {
      await api.archiveAdminTemplate(template.id);
      setNotice(`“${template.name}” foi retirado do catálogo.`);
      await loadTemplates();
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        onUnauthorized();
      } else {
        setError(errorMessage(cause));
      }
    } finally {
      setArchivingId("");
    }
  }

  const publishedCount = templates.filter((template) => template.publicationStatus === "published").length;
  const draftCount = templates.filter((template) => template.publicationStatus === "draft").length;
  const canPublish = draftVersion !== null && isSaved && isValidated && previewOpen && editorDefinition !== null;

  return (
    <section aria-labelledby="admin-templates-title" className="admin-template-manager">
      <header className="admin-template-manager__heading">
        <div>
          <span className="admin-eyebrow"><Layers3 aria-hidden="true" size={15} /> Catálogo de modelos</span>
          <h2 id="admin-templates-title">Criar e publicar templates</h2>
          <p>Salve como rascunho, valide o formulário e o cartão na prévia e só então publique para os clientes em <strong>/templates</strong>.</p>
        </div>
        <button className="button button--secondary" disabled={saving || validating || publishing} onClick={startBlank} type="button"><FilePlus2 aria-hidden="true" size={16} /> Novo template</button>
      </header>

      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {notice ? <p className="form-notice admin-template-manager__notice" role="status">{notice}</p> : null}

      <div className="admin-template-manager__layout">
        <section className="admin-template-list" aria-label="Templates e versões existentes">
          <div className="admin-template-list__heading"><h3>Modelos existentes</h3><span>{loading ? "Carregando…" : `${publishedCount} publicados · ${draftCount} rascunhos`}</span></div>
          {loading ? <p className="admin-empty">Carregando catálogo…</p> : null}
          {!loading && templates.length === 0 ? <p className="admin-empty">Ainda não há templates. Use o modelo inicial no editor ao lado ou abaixo para publicar o primeiro.</p> : null}
          {templates.map((template) => {
            const isDraft = template.publicationStatus === "draft";
            const statusLabel = isDraft ? "Rascunho" : template.publicationStatus === "published" ? "Publicado" : "Arquivado";
            return (
              <article className="admin-template-row" key={`${template.id}-${template.version}`}>
                <div className="admin-template-row__title">
                  <div><strong>{template.name}</strong><small>{template.id} · v{template.version} · {formatDate(template.createdAt)}</small></div>
                  <span className={`admin-template-status${template.publicationStatus === "published" ? " is-active" : ""}${isDraft ? " is-draft" : ""}`}>{statusLabel}</span>
                </div>
                <div className="admin-template-row__actions">
                  <button className="text-button" disabled={saving || validating || publishing} onClick={() => startFrom(template, false)} type="button">{isDraft ? "Continuar rascunho" : "Nova versão"}</button>
                  <button className="text-button" disabled={saving || validating || publishing} onClick={() => startFrom(template, true)} type="button"><CopyPlus aria-hidden="true" size={14} /> Fazer cópia</button>
                  {template.publicationStatus === "published" ? <button className="text-button admin-template-row__archive" disabled={archivingId === template.id || saving || validating || publishing} onClick={() => void archive(template)} type="button"><Archive aria-hidden="true" size={14} /> {archivingId === template.id ? "Retirando…" : "Retirar"}</button> : null}
                </div>
              </article>
            );
          })}
        </section>

        <form className="admin-template-editor" onSubmit={(event) => void saveDraft(event)}>
          <div className="admin-template-editor__heading">
            <div><span className="admin-eyebrow">Editor do catálogo</span><h3>{draftVersion === null ? "Novo rascunho" : `Rascunho · versão ${draftVersion}`}</h3></div>
            <span>{draftVersion !== null && isSaved ? "Salvo" : "Não salvo"}</span>
          </div>
          <div className="admin-template-editor__metadata">
            <div className="form-field">
              <label htmlFor="admin-template-id">Identificador</label>
              <input autoCapitalize="none" autoComplete="off" id="admin-template-id" maxLength={100} pattern="[a-z0-9][a-z0-9_-]{0,99}" placeholder="ex.: boas-vindas-novos-clientes" required value={templateId} onChange={(event) => setTemplateId(event.target.value)} />
              <p className="form-field__help">Use letras minúsculas, números e hífens. O mesmo identificador cria uma nova versão.</p>
            </div>
            <div className="form-field">
              <label htmlFor="admin-template-name">Nome do template</label>
              <input id="admin-template-name" maxLength={120} required value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="form-field">
              <label htmlFor="admin-template-description">Descrição para os clientes</label>
              <input id="admin-template-description" maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} />
            </div>
          </div>
          <div className="form-field admin-template-json-field">
            <label htmlFor="admin-template-definition">Definição visual e campos</label>
            <textarea autoCapitalize="off" autoComplete="off" id="admin-template-definition" spellCheck={false} value={definition} onChange={(event) => setDefinition(event.target.value)} />
            <p className="form-field__help">Inclua <code>catalog</code>, <code>fields</code>, <code>visual</code> e <code>card</code>. A validação verifica os vínculos e os campos obrigatórios.</p>
          </div>
          <div className="admin-template-editor__actions">
            <button className="button button--secondary" disabled={saving} type="submit"><FilePlus2 aria-hidden="true" size={16} /> {saving ? "Salvando…" : "Salvar rascunho"}</button>
            <button className="button button--primary" disabled={validating} onClick={() => void validateAndPreview()} type="button"><Eye aria-hidden="true" size={16} /> {validating ? "Validando…" : "Prévia e validar"}</button>
          </div>

          {previewOpen && editorDefinition ? (
            <section className="admin-template-preview" aria-label="Prévia do template para o cliente">
              <header className="admin-template-preview__heading">
                <div><span className="admin-eyebrow"><Check aria-hidden="true" size={14} /> Validação aprovada</span><h4>Confira antes de publicar</h4></div>
                {!isSaved ? <span className="admin-template-preview__warning">Salve as alterações antes de publicar</span> : null}
              </header>
              <div className="admin-template-preview__layout">
                <div className="admin-template-preview__form">
                  <h5>Formulário do cliente</h5>
                  <TemplateFields
                    fields={editorDefinition.fields}
                    imagePreviews={imagePreviews}
                    localOnlyImages
                    onChange={(fieldId, value) => setPreviewValues((current) => ({ ...current, [fieldId]: value }))}
                    onImagePreviewChange={(fieldId, preview) => setImagePreviews((current) => {
                      const next = { ...current };
                      if (preview) next[fieldId] = preview;
                      else delete next[fieldId];
                      return next;
                    })}
                    values={previewValues}
                  />
                </div>
                <MessagePhonePreview
                  data={previewValues}
                  definition={editorDefinition}
                  imagePreviews={imagePreviews}
                  requireActionDestinationInPreview
                  title={name || "Seu template"}
                />
              </div>
              {!isValidated ? <p className="admin-template-preview__warning">O conteúdo mudou desde a validação. Valide a prévia novamente antes de publicar.</p> : null}
              <button className="button button--primary admin-template-publish" disabled={!canPublish || publishing} onClick={() => void publishDraft()} type="button"><Send aria-hidden="true" size={16} /> {publishing ? "Publicando…" : "Publicar esta versão"}</button>
            </section>
          ) : null}
        </form>
      </div>
    </section>
  );
}
