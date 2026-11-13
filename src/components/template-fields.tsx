import { Fragment, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { QrCode } from "lucide-react";
import { api } from "../lib/api-client";
import { MAX_TEMPLATE_IMAGE_BYTES, type TemplateField } from "@/lib/api-contracts";

type FieldValue = string | number | boolean;

type TemplateFieldsProps = {
  fields: TemplateField[];
  values: Record<string, FieldValue>;
  onChange: (id: string, value: FieldValue) => void;
  onUploadStateChange?: (uploading: boolean) => void;
  imagePreviews?: Record<string, string>;
  onImagePreviewChange?: (id: string, preview: string | null) => void;
  localOnlyImages?: boolean;
  pixQrGeneratorHref?: string;
};

export function TemplateFields({
  fields,
  values,
  onChange,
  onUploadStateChange,
  imagePreviews,
  onImagePreviewChange,
  localOnlyImages = false,
  pixQrGeneratorHref,
}: TemplateFieldsProps) {
  const [currencyInputs, setCurrencyInputs] = useState<Record<string, string>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const anyUploadActive = Object.values(uploading).some(Boolean);
  const hasUploadErrors = Object.values(uploadErrors).some(Boolean);
  useEffect(() => {
    onUploadStateChange?.(anyUploadActive || hasUploadErrors);
  }, [anyUploadActive, hasUploadErrors, onUploadStateChange]);
  const setFieldUploading = (fieldId: string, active: boolean) => {
    setUploading((current) => ({ ...current, [fieldId]: active }));
  };
  return fields.map((field, index) => {
    if (field.editable === false) return null;
    const previousField = fields[index - 1];
    const sectionHeading = field.section && field.section !== previousField?.section ? field.section : null;
    const label = field.id === "pixCopyPaste" ? "Código Pix copia e cola" : field.label ?? field.id;
    const value = values[field.id] ?? (field.type === "boolean" ? false : "");
    const describedBy = field.helpText ? `${field.id}-help` : undefined;
    const shared = {
      id: field.id,
      required: field.type === "boolean" || field.type === "image" ? undefined : field.required,
      "aria-describedby": describedBy,
    };

    let input;
    switch (field.type) {
      case "textarea":
        input = (
          <div className="form-field__textarea-wrap">
            <textarea {...shared} maxLength={field.maxLength} placeholder={field.placeholder} value={String(value)} onChange={(event) => onChange(field.id, event.target.value)} />
            {field.maxLength ? <span aria-live="polite" className="form-field__counter">{String(value).length}/{field.maxLength}</span> : null}
          </div>
        );
        break;
      case "select":
        input = (
          <select {...shared} value={String(value)} onChange={(event) => onChange(field.id, event.target.value)}>
            <option value="" disabled>Selecione</option>
            {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        );
        break;
      case "boolean":
        input = <input {...shared} checked={Boolean(value)} type="checkbox" onChange={(event) => onChange(field.id, event.target.checked)} />;
        break;
      case "number":
        input = (
          field.format === "currency" ? (
            <input
              {...shared}
              inputMode="decimal"
              placeholder={field.placeholder}
              type="text"
              value={currencyInputs[field.id] ?? (typeof value === "number" ? formatCurrencyInput(value) : "")}
              onBlur={() => setCurrencyInputs((current) => ({
                ...current,
                [field.id]: typeof values[field.id] === "number" ? formatCurrencyInput(values[field.id] as number) : "",
              }))}
              onChange={(event) => {
                const raw = event.target.value;
                setCurrencyInputs((current) => ({ ...current, [field.id]: raw }));
                if (raw.trim() === "") {
                  onChange(field.id, "");
                  return;
                }
                if (/^[\d.,]+$/.test(raw)) {
                  const normalized = raw.includes(",") ? raw.replaceAll(".", "").replace(",", ".") : raw;
                  const amount = Number(normalized);
                  if (Number.isFinite(amount)) onChange(field.id, amount);
                }
              }}
            />
          ) : (
            <input
              {...shared}
              min={field.id === "installmentNumber" || field.id === "installmentTotal" ? 1 : undefined}
              placeholder={field.placeholder}
              step={field.id === "installmentNumber" || field.id === "installmentTotal" ? 1 : undefined}
              type="number"
              value={String(value)}
              onChange={(event) => onChange(field.id, event.target.value === "" ? "" : Number(event.target.value))}
            />
          )
        );
        break;
      case "url":
        input = <input {...shared} maxLength={field.maxLength} placeholder={field.placeholder} type="url" value={String(value)} onChange={(event) => onChange(field.id, event.target.value)} />;
        break;
      case "color":
        input = <input {...shared} maxLength={7} pattern="^#[0-9a-fA-F]{6}$" type="text" value={String(value)} onChange={(event) => onChange(field.id, event.target.value)} />;
        break;
      case "date":
        input = <input {...shared} type="date" value={String(value)} onChange={(event) => onChange(field.id, event.target.value)} />;
        break;
      case "image": {
        const maxBytes = field.maxBytes ?? MAX_TEMPLATE_IMAGE_BYTES;
        const imageValue = typeof value === "string" && isImageAssetId(value) ? value : "";
        const localPreview = imagePreviews?.[field.id];
        const previewSrc = localPreview || (imageValue ? `/api/v1/assets/${imageValue}/content` : "");
        input = (
          <div className="form-field__image-upload">
            <input
              {...shared}
              accept="image/png,image/jpeg,image/webp"
              disabled={anyUploadActive}
              type="file"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = "";
                if (!file) return;
                if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
                  onImagePreviewChange?.(field.id, null);
                  setUploadErrors((current) => ({ ...current, [field.id]: "Escolha um arquivo PNG, JPEG ou WebP." }));
                  return;
                }
                if (file.size > maxBytes) {
                  onImagePreviewChange?.(field.id, null);
                  setUploadErrors((current) => ({ ...current, [field.id]: "A imagem deve ter até " + formatFileSize(maxBytes) + "." }));
                  return;
                }
                onChange(field.id, "");
                onImagePreviewChange?.(field.id, null);
                setUploadErrors((current) => { const next = { ...current }; delete next[field.id]; return next; });
                setFieldUploading(field.id, true);
                const reader = new FileReader();
                reader.onload = async () => {
                  if (typeof reader.result !== "string" || !imageDataUriMatchesMime(reader.result, file.type)) {
                    onImagePreviewChange?.(field.id, null);
                    setUploadErrors((current) => ({ ...current, [field.id]: "Não foi possível ler essa imagem." }));
                    setFieldUploading(field.id, false);
                    return;
                  }
                  onImagePreviewChange?.(field.id, reader.result);
                  if (localOnlyImages) {
                    setFieldUploading(field.id, false);
                    return;
                  }
                  try {
                    const uploaded = await api.uploadImage(reader.result);
                    setUploadErrors((current) => { const next = { ...current }; delete next[field.id]; return next; });
                    onImagePreviewChange?.(field.id, null);
                    onChange(field.id, uploaded.id);
                  } catch (error) {
                    setUploadErrors((current) => ({
                      ...current,
                      [field.id]: error instanceof Error ? error.message : "Não foi possível enviar essa imagem.",
                    }));
                  } finally {
                    setFieldUploading(field.id, false);
                  }
                };
                reader.onerror = () => {
                  onImagePreviewChange?.(field.id, null);
                  setUploadErrors((current) => ({ ...current, [field.id]: "Não foi possível ler essa imagem." }));
                  setFieldUploading(field.id, false);
                };
                reader.readAsDataURL(file);
              }}
            />
            {previewSrc ? (
              <div className="form-field__image-preview">
                <Image alt={"Prévia de " + label.toLowerCase()} height={52} src={previewSrc} unoptimized width={52} />
                <button type="button" disabled={anyUploadActive} onClick={() => {
                  onChange(field.id, "");
                  onImagePreviewChange?.(field.id, null);
                  setUploadErrors((current) => { const next = { ...current }; delete next[field.id]; return next; });
                }}>Remover imagem</button>
              </div>
            ) : null}
            {uploading[field.id] ? <p className="form-field__help" role="status">Enviando imagem…</p> : null}
            {uploadErrors[field.id] ? <p className="form-field__error" role="alert">{uploadErrors[field.id]}</p> : null}
          </div>
        );
        break;
      }
      default:
        input = <input {...shared} maxLength={field.maxLength} placeholder={field.placeholder} type="text" value={String(value)} onChange={(event) => onChange(field.id, event.target.value)} />;
    }

    return (
      <Fragment key={field.id}>
      {sectionHeading ? <h2 className="form-section-heading">{sectionHeading}</h2> : null}
      <div className={`form-field form-field--${field.width ?? "full"}${field.type === "boolean" ? " form-field--checkbox" : ""}`}>
        {field.type === "boolean" ? (
          <label htmlFor={field.id}>{input}<span>{label}{field.required ? " *" : ""}</span></label>
        ) : (
          <>
            <label htmlFor={field.id}>{label}{field.required ? " *" : ""}</label>
            {field.type === "number" && field.format === "currency" ? <div className="form-field__currency"><span aria-hidden="true">R$</span>{input}</div> : input}
          </>
        )}
        {field.helpText && <p className="form-field__help" id={describedBy}>{field.helpText}</p>}
        {field.id === "pixCopyPaste" && pixQrGeneratorHref ? (
          <Link className="pix-qr-generator-link" href={pixQrGeneratorHref}><QrCode aria-hidden="true" size={16} /> Gerar QR Code Pix para este modelo</Link>
        ) : null}
        {field.id === "pixCopyPaste" && value ? <p className="form-field__help" role="status">QR Code atualizado na prévia. O botão do cartão copia este mesmo código.</p> : null}
      </div>
      </Fragment>
    );
  });
}

function imageDataUriMatchesMime(value: string, mime: string): boolean {
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || value.slice(0, value.indexOf(";")) !== `data:${mime}`) return false;
  const bytes = atob(match[2]);
  if (mime === "image/png") return bytes.slice(0, 8) === String.fromCharCode(137, 80, 78, 71, 13, 10, 26, 10);
  if (mime === "image/jpeg") return bytes.charCodeAt(0) === 0xff && bytes.charCodeAt(1) === 0xd8 && bytes.charCodeAt(2) === 0xff;
  return bytes.slice(0, 4) === "RIFF" && bytes.slice(8, 12) === "WEBP";
}

function isImageAssetId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function formatCurrencyInput(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatFileSize(bytes: number): string {
  const megabytes = bytes / (1024 * 1024);
  if (Number.isInteger(megabytes)) return megabytes + " MB";
  return Math.ceil(bytes / 1024) + " KB";
}
