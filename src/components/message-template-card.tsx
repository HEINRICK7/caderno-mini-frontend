import type { CSSProperties } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import {
  BadgeCheck,
  Cake,
  CalendarDays,
  Check,
  ClipboardCheck,
  ChevronRight,
  Clock3,
  CreditCard,
  Facebook,
  FileText,
  Gift,
  Heart,
  Link2,
  Instagram,
  MessageCircle,
  Music2,
  MessageSquareMore,
  Package,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Youtube,
} from "lucide-react";
import type { TemplateCardAction, TemplateDefinition } from "@/lib/api-contracts";
import { calculateDiscountPercentage, formatCurrency } from "@/domain/offer-pricing";
import { CopyTextAction } from "./copy-text-action";
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

const detailIcons = {
  package: Package,
  "credit-card": CreditCard,
  calendar: CalendarDays,
  check: Check,
  link: Link2,
  qrcode: QrCode,
  chat: MessageSquareMore,
  badge: BadgeCheck,
  wallet: CreditCard,
  receipt: FileText,
  heart: Heart,
  shield: ShieldCheck,
  gift: Gift,
  cake: Cake,
  sparkles: Sparkles,
  "shopping-bag": ShoppingBag,
  clock: Clock3,
  "clipboard-check": ClipboardCheck,
};

export function MessageTemplateCard({
  definition,
  data,
  title,
  description,
  mode = "preview",
  imagePreviews,
  showBusinessNamePlaceholder = true,
}: MessageTemplateCardProps) {
  const card = definition.card;
  const visual = definition.visual;
  const style = {
    "--template-canvas": "#fff9f0",
    "--template-surface": visual?.surface ?? "#ffffff",
    "--template-accent": visual?.accent ?? "#168a80",
    "--template-ink": visual?.heading ?? "#101b29",
    "--template-copy": visual?.text ?? "#4d5868",
    "--template-muted": visual?.muted ?? "#667184",
    "--template-soft": withAlpha(visual?.accent ?? "#168a80", "1A"),
  } as CSSProperties;

  if (!card) {
    const entries = definition.fields.flatMap((field) => {
      const value = data[field.id];
      if (value === undefined || value === null || value === "" || value === false) return [];
      return [[field.label ?? field.id, displayValue(value)] as const];
    });
    return (
      <article className="message-template message-template--legacy" style={style}>
        <div className="message-template__surface">
          <h1>{title ?? "Cadernô Express"}</h1>
          {description ? <p>{description}</p> : null}
          {entries.map(([label, value]) => <p key={label}><strong>{label}</strong><br />{value}</p>)}
        </div>
      </article>
    );
  }

  const layout = card.layout ?? "standard";
  const financialStateIsValid = !card.financial || (
    data[card.financial.stateFieldId] === card.financial.expectedState &&
    (!card.financial.balanceFieldId || data[card.financial.balanceFieldId] === 0)
  );
  if (mode === "published" && !financialStateIsValid) {
    return <article aria-label="Mensagem indisponível" className="message-template message-template--unavailable" style={style}>A mensagem não pode ser exibida sem confirmação financeira.</article>;
  }

  const heading = interpolate(card.heading, data, definition, mode === "preview", card.variables);
  const highlightedText = card.highlightedText ? interpolate(card.highlightedText, data, definition, mode === "preview", card.variables) : "";
  const subtitle = card.subtitle ? interpolate(card.subtitle, data, definition, mode === "preview", card.variables) : "";
  const message = card.message ? interpolate(card.message, data, definition, mode === "preview", card.variables) : "";
  const businessName = card.brand ? readField(data, card.brand.businessNameFieldId) : "";
  const businessNameField = card.brand ? definition.fields.find((field) => field.id === card.brand?.businessNameFieldId) : undefined;
  const brandName = businessName || (showBusinessNamePlaceholder ? businessNameField?.placeholder ?? "" : "");
  const brandLogo = card.brand?.logoFieldId
    ? safeImageAssetPath(data[card.brand.logoFieldId], imagePreviews?.[card.brand.logoFieldId])
    : null;

  const resolvedDetails = (card.details ?? []).map((detail) => {
    const value = formatDetail(detail.value, detail.format, data, definition, mode === "preview", card.variables);
    const label = detail.labelFieldId ? readField(data, detail.labelFieldId) : detail.label ?? "";
    const imageSrc = detail.imageFieldId ? safeImageAssetPath(data[detail.imageFieldId], imagePreviews?.[detail.imageFieldId]) : null;
    return { ...detail, label, value, imageSrc };
  });
  const pixDetail = layout === "pix" ? resolvedDetails.find((detail) => detail.imageFieldId || detail.icon === "qrcode") : undefined;
  const details = resolvedDetails.filter((detail) => detail !== pixDetail)
    .filter((detail) => (detail.label.trim() !== "" || detail.value.trim() !== "") && (detail.value.trim() !== "" || detail.imageSrc !== null))
    .filter((detail) => layout !== "settled" || (detail.value !== "" && (detail.labelFieldId !== "settlementLabel" || detail.value === "Todas as parcelas pagas")));

  const product = card.product;
  const ProductIcon = product?.icon ? detailIcons[product.icon] : null;
  const productName = product?.nameFieldId ? readField(data, product.nameFieldId) : "";
  const productDescription = product?.descriptionFieldId ? readField(data, product.descriptionFieldId) : "";
  const productImage = product?.imageFieldId ? safeImageAssetPath(data[product.imageFieldId], imagePreviews?.[product.imageFieldId]) : null;
  const gallery = product?.galleryFieldIds?.flatMap((fieldId) => {
    const src = safeImageAssetPath(data[fieldId], imagePreviews?.[fieldId]);
    return src ? [{ fieldId, src }] : [];
  }) ?? [];
  const finalPrice = product?.priceFieldId ? readNumber(data[product.priceFieldId]) : null;
  const originalPrice = product?.originalPriceFieldId ? readNumber(data[product.originalPriceFieldId]) : null;
  const discountPercentage = originalPrice !== null && finalPrice !== null
    ? calculateDiscountPercentage(originalPrice, finalPrice)
    : null;
  const pricesSection = originalPrice !== null || finalPrice !== null ? (
    layout === "offer" ? (
      <div className="message-template__prices message-template__prices--offer">
        {originalPrice !== null ? <span className="message-template__original-price">{formatCurrency(originalPrice)}</span> : null}
        <span className="message-template__sale-line">
          {finalPrice !== null ? <strong>{formatCurrency(finalPrice)}</strong> : null}
          {discountPercentage !== null ? <span className="message-template__discount">{discountPercentage}% OFF</span> : null}
        </span>
      </div>
    ) : (
      <div className="message-template__prices">
        {originalPrice !== null ? <span className="message-template__original-price">{formatCurrency(originalPrice)}</span> : null}
        {finalPrice !== null ? <strong>{formatCurrency(finalPrice)}</strong> : null}
        {discountPercentage !== null ? <span className="message-template__discount">{discountPercentage}%</span> : null}
      </div>
    )
  ) : null;

  const configuredActions = card.actions ?? (card.action ? [card.action] : []);
  const actions = configuredActions.map((action, index) => resolveAction(action, index, data, mode));
  const visibleActions = actions.filter((action) => mode === "preview" ? action.label !== "" : action.enabled && action.label !== "");
  const socialLinks = (card.socialLinks ?? []).flatMap(({ platform, hrefFieldId }) => {
    const href = safeSocialUrl(readField(data, hrefFieldId), platform);
    return href ? [{ platform, href, label: socialLabels[platform] }] : [];
  });
  const pixQr = pixDetail?.imageSrc ?? null;
  const pixInstruction = pixDetail?.value.trim() ?? "";
  const pixCopyValue = readField(data, "pixCopyPaste");
  const pixSecurityNote = card.pixNoteFieldId ? readField(data, card.pixNoteFieldId) : "";
  const articleClassName = `message-template message-template--${layout} message-template--${card.illustration}`;
  const brandSection = card.brand && (brandName || brandLogo) ? (
    <div className="message-template__brand">
      {brandLogo ? <Image alt={brandName ? "" : "Logo da empresa"} className="message-template__brand-logo" height={34} src={brandLogo} unoptimized width={34} /> : null}
      {brandName ? <span>{brandName}</span> : null}
    </div>
  ) : null;
  const headingSection = (
    <header className="message-template__heading">
      {heading || mode === "preview" ? <h1 className="message-template__heading-title">{heading || "Seu título"}</h1> : null}
      {card.subtitlePlacement === "before-highlight" ? (
        <>
          {subtitle ? <p className={`message-template__subtitle${card.subtitleStyle === "subheading" ? " message-template__subtitle--subheading" : ""}`}>{subtitle}</p> : null}
          {highlightedText ? <p className="message-template__highlight">{highlightedText}</p> : null}
        </>
      ) : (
        <>
          {highlightedText ? <p className="message-template__highlight">{highlightedText}</p> : null}
          {subtitle ? <p className={`message-template__subtitle${card.subtitleStyle === "subheading" ? " message-template__subtitle--subheading" : ""}`}>{subtitle}</p> : null}
        </>
      )}
      {message ? <p className="message-template__message">{message}</p> : null}
    </header>
  );
  const hasProductContent = Boolean(productImage || productName || productDescription || finalPrice !== null || originalPrice !== null);
  const productSection = hasProductContent ? (
    <section aria-label="Produto ou serviço" className="message-template__product">
      {productImage ? <Image alt={productName ? `Imagem de ${productName}` : "Imagem do produto"} className="message-template__product-image" height={320} src={productImage} unoptimized width={700} /> : null}
      {ProductIcon ? (
        <div className="message-template__product-summary">
          <span aria-hidden="true" className="message-template__product-summary-icon"><ProductIcon size={28} strokeWidth={2.1} /></span>
          <div className="message-template__product-summary-copy">
            {productName ? <h2>{productName}</h2> : null}
            {productDescription ? <p>{productDescription}</p> : null}
            {pricesSection}
          </div>
        </div>
      ) : (
        <>
          {productName ? <h2>{productName}</h2> : null}
          {productDescription ? <p>{productDescription}</p> : null}
          {pricesSection}
        </>
      )}
    </section>
  ) : null;
  const gallerySection = gallery.length ? (
    <div aria-label="Imagens da coleção" className="message-template__gallery">
      {gallery.map(({ fieldId, src }) => <Image alt="Imagem de produto da coleção" className="message-template__gallery-image" height={220} key={fieldId} src={src} unoptimized width={220} />)}
    </div>
  ) : null;
  const pixSection = layout === "pix" && (mode === "preview" || pixQr || pixCopyValue) ? (
    <section aria-label="Dados do Pix" className="message-template__pix">
      <div className="message-template__pix-qr-card">
        <div className="message-template__pix-qr-frame">
          {pixQr ? (
            <Image alt="QR Code Pix" className="message-template__pix-qr" height={180} src={pixQr} unoptimized width={180} />
          ) : pixCopyValue ? (
            <QRCodeSVG aria-label="QR Code gerado com o código Pix copia e cola" className="message-template__pix-qr" value={pixCopyValue} level="M" marginSize={4} size={180} title="QR Code Pix" />
          ) : (
            <QrCode aria-hidden="true" className="message-template__pix-qr-placeholder" size={44} strokeWidth={1.5} />
          )}
        </div>
        <div className="message-template__pix-qr-caption">
          <strong>{pixCopyValue ? "Pague com Pix" : "QR Code Pix"}</strong>
          <span>{pixInstruction || "Escaneie com o aplicativo do seu banco."}</span>
        </div>
      </div>
      <div className="message-template__pix-code-card">
        <div className="message-template__pix-code-heading">
          <strong>Pix copia e cola</strong>
          <span>Use no aplicativo do seu banco</span>
        </div>
        {pixCopyValue ? (
          <code aria-label="Código Pix copia e cola" className="message-template__pix-code">{pixCopyValue}</code>
        ) : (
          <div className="message-template__pix-code-empty">Cole o código gerado pelo banco para criar o QR Code.</div>
        )}
        <span className="message-template__pix-note">
          {pixSecurityNote || "Confirme o nome do recebedor no app do banco antes de pagar."}
        </span>
      </div>
    </section>
  ) : null;
  const detailsSection = details.length ? (
    <dl className="message-template__details">
      {details.map((detail, index) => {
        const Icon = detail.icon ? detailIcons[detail.icon] : null;
        return (
          <div className={`message-template__detail${detail.format ? ` message-template__detail--${detail.format}` : ""}${detail.valueStyle ? ` message-template__detail--${detail.valueStyle}` : ""}`} key={`${detail.label}-${detail.value}-${index}`}>
            <span aria-hidden="true" className={`message-template__detail-icon${detail.imageSrc ? " message-template__detail-icon--image" : ""}`}>
              {detail.imageSrc ? <Image alt="" className="message-template__detail-image" height={58} src={detail.imageSrc} unoptimized width={58} /> : Icon ? <Icon size={24} strokeWidth={2.1} /> : null}
            </span>
            <div className="message-template__detail-copy">
              {detail.label ? <dt>{detail.label}</dt> : null}
              {detail.statusBadge ? (
                <div className="message-template__detail-value-line">
                  <dd>{detail.value}</dd>
                  <span className="message-template__detail-badge">{detail.statusBadge}</span>
                </div>
              ) : <dd>{detail.value}</dd>}
            </div>
          </div>
        );
      })}
    </dl>
  ) : null;
  const actionsSection = visibleActions.length ? (
    <div className="message-template__actions">
      {visibleActions.map((action, index) => {
        const className = `message-template__action${index > 0 ? " message-template__action--secondary" : ""}`;
        if (action.copyValue && mode === "published") {
          return <CopyTextAction className={className} key={`${action.label}-${index}`} label={action.label} showArrow={layout !== "approval"} value={action.copyValue} />;
        }
        const actionContent = <><span>{action.label}</span>{layout !== "approval" ? <ChevronRight aria-hidden="true" className="message-template__action-arrow" size={26} strokeWidth={3} /> : null}</>;
        return mode === "preview" ? (
          <div className={className} key={`${action.label}-${index}`}>{actionContent}</div>
        ) : (
          <a className={className} href={action.href!} key={`${action.label}-${index}`} rel="noreferrer" target="_blank">{actionContent}</a>
        );
      })}
    </div>
  ) : null;
  const socialLinksSection = socialLinks.length ? (
    <nav aria-label="Redes sociais do negócio" className="message-template__socials">
      {socialLinks.map(({ platform, href, label }) => {
        const Icon = socialIcons[platform];
        return (
          <a aria-label={`Abrir ${label}`} className={`message-template__social-link message-template__social-link--${platform}`} href={href} key={platform} rel="noreferrer" target="_blank" title={label}>
            <Icon aria-hidden="true" size={18} strokeWidth={2} />
            <span>{label}</span>
          </a>
        );
      })}
    </nav>
  ) : null;
  const splitHeaderLayout = layout === "product" || layout === "offer" || layout === "collection" || layout === "settled" || layout === "approval" || card.illustration === "reactivation-heart";

  return (
    <article className={articleClassName} style={style}>
      <div aria-hidden="true" className="message-template__art">
        <StatusSticker className="message-template__illustration" illustration={card.illustration} label="" />
      </div>
      {splitHeaderLayout ? (
        <>
          {brandSection}
          {headingSection}
          {layout === "settled" ? <div aria-hidden="true" className="message-template__settled-divider"><span /><Star fill="currentColor" size={18} strokeWidth={1.8} /><span /></div> : null}
          {layout === "product" || layout === "offer" ? <div className="message-template__surface message-template__surface--product">{productSection}{actionsSection}</div> : null}
          {layout === "collection" ? <>{gallerySection}{actionsSection}</> : null}
          {layout === "settled" || layout === "approval" || card.illustration === "reactivation-heart" ? <>{detailsSection}{actionsSection}</> : null}
        </>
      ) : (
        <div className="message-template__surface">
          {brandSection}
          {headingSection}
          {productSection}
          {gallerySection}
          {layout === "pix" ? <>{detailsSection}{pixSection}</> : <>{pixSection}{detailsSection}</>}
          {actionsSection}
        </div>
      )}
      {socialLinksSection}
    </article>
  );
}

type ResolvedAction = { label: string; href: string | null; copyValue: string | null; enabled: boolean };
type SocialPlatform = "instagram" | "whatsapp" | "facebook" | "tiktok" | "youtube";

const socialLabels: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
};

const socialIcons = {
  instagram: Instagram,
  whatsapp: MessageCircle,
  facebook: Facebook,
  tiktok: Music2,
  youtube: Youtube,
};

function resolveAction(action: TemplateCardAction, index: number, data: Record<string, unknown>, mode: "preview" | "published"): ResolvedAction {
  const configuredLabel = action.labelFieldId ? readField(data, action.labelFieldId) : action.label ?? "";
  const label = configuredLabel || (mode === "preview" ? (index === 0 ? "Ação principal" : `Opção ${index + 1}`) : "");
  const hrefValue = action.hrefFieldId ? readField(data, action.hrefFieldId) : "";
  const href = safeHttpUrl(hrefValue);
  const copyValue = action.copyFieldId ? readField(data, action.copyFieldId) : "";
  return { label, href, copyValue: copyValue || null, enabled: href !== null || copyValue !== "" };
}

function interpolate(template: string, data: Record<string, unknown>, definition: TemplateDefinition, usePlaceholders: boolean, variables?: Record<string, string>): string {
  const resolve = (fieldId: string) => {
    const value = readField(data, fieldId);
    const field = definition.fields.find((candidate) => candidate.id === fieldId);
    if (value) return field?.type === "date" ? formatPtBrDate(value) : value;
    return usePlaceholders && field?.required ? field.placeholder ?? "" : "";
  };
  const withFieldBindings = template.replace(/\{\{([A-Za-z][A-Za-z0-9_]{0,63})\}\}/g, (_match, fieldId: string) => resolve(fieldId));
  return withFieldBindings.replace(/(?<!\{)\{([A-Za-z_][A-Za-z0-9_]*)\}(?!\})/g, (_match, variable: string) => {
    const fieldId = variables?.[variable];
    return fieldId ? resolve(fieldId) : "";
  });
}

function formatDetail(template: string, format: "currency" | "date" | undefined, data: Record<string, unknown>, definition: TemplateDefinition, usePlaceholders: boolean, variables?: Record<string, string>): string {
  const value = interpolate(template, data, definition, usePlaceholders, variables);
  if (value === "settled") return "Todas as parcelas pagas";
  if (format === "date") return formatPtBrDate(value);
  if (format !== "currency" || value.trim() === "") return value;
  const amount = Number(value.replace(",", "."));
  return Number.isFinite(amount) ? formatCurrency(amount) : value;
}

function formatPtBrDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(`${value}T12:00:00.000Z`);
  if (!Number.isFinite(date.getTime())) return value;
  const month = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" }).format(date).replaceAll(".", "");
  return `${String(date.getUTCDate()).padStart(2, "0")} de ${month} de ${date.getUTCFullYear()}`;
}

function readField(data: Record<string, unknown>, fieldId: string): string {
  const value = data[fieldId];
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "Sim" : "";
  return "";
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function safeSocialUrl(value: string, platform: SocialPlatform): string | null {
  const allowedHosts: Record<SocialPlatform, string[]> = {
    instagram: ["instagram.com"],
    whatsapp: ["wa.me", "whatsapp.com", "api.whatsapp.com"],
    facebook: ["facebook.com", "m.facebook.com", "fb.com"],
    tiktok: ["tiktok.com", "vm.tiktok.com"],
    youtube: ["youtube.com", "youtu.be"],
  };
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return url.protocol === "https:" && url.username === "" && url.password === "" && allowedHosts[platform].includes(host)
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function safeImageAssetPath(value: unknown, localPreview?: string): string | null {
  if (typeof localPreview === "string" && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(localPreview)) return localPreview;
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) return null;
  return `/api/v1/assets/${value}/content`;
}

function displayValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "Sim" : "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value) ?? "";
}

function withAlpha(hex: string, alpha: string): string {
  return /^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${alpha}` : `#168a8012`;
}
