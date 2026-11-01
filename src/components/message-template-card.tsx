import type { CSSProperties } from "react";
import Image from "next/image";
import { CalendarDays, Check, CreditCard, Link2, Package, QrCode } from "lucide-react";
import type { TemplateDefinition } from "@/lib/api-contracts";
import { StatusSticker } from "./status-sticker";

type MessageTemplateCardProps = {
  definition: TemplateDefinition;
  data: Record<string, unknown>;
  title?: string;
  description?: string | null;
  mode?: "preview" | "published";
  imagePreviews?: Record<string, string>;
  showBusinessNamePlaceholder?: boolean;
};

const detailIcons = { package: Package, "credit-card": CreditCard, calendar: CalendarDays, check: Check, link: Link2, qrcode: QrCode };

export function MessageTemplateCard({
  definition,
  data,
  title,
  description,
  mode = "preview",
  imagePreviews,
  showBusinessNamePlaceholder = true,
}: MessageTemplateCardProps) {
  const visual = definition.visual;
  const style = {
    "--card-art-background": visual?.background ?? "#fff0c3",
    "--card-surface": visual?.surface ?? "#ffffff",
    "--card-accent": visual?.accent ?? "#ff6674",
    "--card-heading": visual?.heading ?? "#10264f",
    "--card-text": visual?.text ?? "#385176",
    "--card-muted": visual?.muted ?? "#687895",
  } as CSSProperties;
  const layout = visual?.layout ?? "card";
  const frame = visual?.frame ?? "none";
  const headingFont = visual?.headingFont ?? "rounded";
  const bodyFont = visual?.bodyFont ?? "sans";
  const visualClasses = `message-template--layout-${layout} message-template--frame-${frame} message-template--heading-${headingFont} message-template--body-${bodyFont}`;

  if (!definition.card) {
    const entries = definition.fields.flatMap((field) => {
      const value = data[field.id];
      if (value === undefined || value === null || value === "" || value === false) return [];
      return [[field.label ?? field.id, displayValue(value)] as const];
    });

    return (
        <article className={`message-template message-template--legacy ${visualClasses}`} style={style}>
        <div className="message-template__legacy-copy">
          <h1>{title ?? "Cadernô Express"}</h1>
          {description ? <p>{description}</p> : null}
          {entries.map(([label, value]) => <p key={label}><strong>{label}</strong><br />{value}</p>)}
        </div>
      </article>
    );
  }

  const heading = interpolate(definition.card.heading, definition, data);
  const message = definition.card.message ? interpolate(definition.card.message, definition, data) : "";
  const details = (definition.card.details ?? []).map((detail) => ({
    ...detail,
    displayValue: formatDetail(detail.value, detail.format, definition, data, false),
    imageSrc: detail.imageFieldId
      ? safeImageAssetPath(data[detail.imageFieldId], imagePreviews?.[detail.imageFieldId])
      : null,
  })).filter((detail) => detail.displayValue.trim() !== "" || detail.imageSrc !== null);
  const actions = definition.card.actions ?? (definition.card.action ? [definition.card.action] : []);
  const visibleActions = actions.filter((action) => {
    if (mode !== "published") return true;
    const href = action.hrefFieldId ? data[action.hrefFieldId] : undefined;
    return typeof href === "string" && safeHttpUrl(href) !== null;
  });
  const brand = definition.card.brand;
  const businessName = brand ? data[brand.businessNameFieldId] : "";
  const businessNameField = brand ? definition.fields.find((field) => field.id === brand.businessNameFieldId) : undefined;
  const brandName = typeof businessName === "string" && businessName.trim()
    ? businessName
    : showBusinessNamePlaceholder ? businessNameField?.placeholder ?? "" : "";
  const brandLogo = brand?.logoFieldId
    ? safeImageAssetPath(data[brand.logoFieldId], imagePreviews?.[brand.logoFieldId])
    : null;

  return (
    <article className={`message-template message-template--${definition.card.illustration} ${visualClasses}${details.length ? " message-template--with-details" : ""}`} style={style}>
      {brand && (brandName || brandLogo) ? (
        <div className="message-template__brand">
          {brandLogo ? <Image alt={brandName ? "" : "Logo da empresa"} className="message-template__brand-logo" height={34} src={brandLogo} unoptimized width={34} /> : null}
          {brandName ? <span>{brandName}</span> : null}
        </div>
      ) : null}
      <div aria-hidden="true" className="message-template__art">
        <StatusSticker
          className="message-template__illustration"
          illustration={definition.card.illustration}
          label=""
        />
      </div>
      <div className="message-template__copy">
        <h1>{heading}</h1>
        {message ? <p>{message}</p> : null}
        {details.length > 0 ? (
          <dl className="message-template__details">
            {details.map((detail) => {
              const Icon = detail.icon ? detailIcons[detail.icon] : null;
              return (
                <div className="message-template__detail" key={`${detail.label}-${detail.value}`}>
                  <span aria-hidden="true" className={"message-template__detail-icon" + (detail.imageSrc ? " message-template__detail-icon--image" : "")}>{detail.imageSrc ? <Image alt="" className="message-template__detail-image" height={52} src={detail.imageSrc} unoptimized width={52} /> : Icon ? <Icon size={17} strokeWidth={2.3} /> : null}</span>
                  <div>
                    <dt>{detail.label}</dt>
                    <dd>{detail.displayValue}</dd>
                  </div>
                </div>
              );
            })}
          </dl>
        ) : null}
        {visibleActions.map((action) => {
          const actionHrefValue = action.hrefFieldId ? data[action.hrefFieldId] : undefined;
          const actionHref = mode === "published" && typeof actionHrefValue === "string" ? safeHttpUrl(actionHrefValue) : null;
          return mode === "preview" ? (
            <div className="message-template__action" key={action.label}>{action.label}</div>
          ) : (
            <a className="message-template__action" href={actionHref!} key={action.label} rel="noreferrer" target="_blank">{action.label}</a>
          );
        })}
        {definition.card.footer === "heart" && visibleActions.length === 0 ? <span aria-hidden="true" className="message-template__heart">♡</span> : null}
      </div>
    </article>
  );
}

function interpolate(template: string, definition: TemplateDefinition, data: Record<string, unknown>, usePlaceholders = true): string {
  return template.replace(/\{\{([A-Za-z][A-Za-z0-9_]{0,63})\}\}/g, (_match, fieldId: string) => {
    const value = data[fieldId];
    if (typeof value === "string" || typeof value === "number") return String(value);
    return usePlaceholders ? definition.fields.find((field) => field.id === fieldId)?.placeholder ?? "" : "";
  });
}

function formatDetail(template: string, format: "currency" | "date" | undefined, definition: TemplateDefinition, data: Record<string, unknown>, usePlaceholders = true): string {
  const value = interpolate(template, definition, data, usePlaceholders);
  if (format === "date" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T12:00:00.000Z`);
    if (Number.isFinite(date.getTime())) {
      return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(date);
    }
  }
  if (format !== "currency" || value.trim() === "") return value;
  const amount = Number(value.replace(",", "."));
  if (!Number.isFinite(amount)) return value;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
}

function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function safeImageAssetPath(value: unknown, localPreview?: string): string | null {
  if (typeof localPreview === "string" && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(localPreview)) {
    return localPreview;
  }
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) return null;
  return `/api/v1/assets/${value}/content`;
}

function displayValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "Sim" : "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value) ?? "";
}

