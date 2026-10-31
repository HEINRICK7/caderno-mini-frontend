import type { CSSProperties } from "react";
import type { TemplateDefinition } from "@/lib/api-contracts";

type MessageTemplateCardProps = {
  definition: TemplateDefinition;
  data: Record<string, unknown>;
  title?: string;
  description?: string | null;
};

export function MessageTemplateCard({ definition, data, title, description }: MessageTemplateCardProps) {
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

  return (
      <article className={`message-template message-template--${definition.card.illustration} ${visualClasses}`} style={style}>
      <div aria-hidden="true" className="message-template__art">
        <CardIllustration illustration={definition.card.illustration} />
      </div>
      <div className="message-template__copy">
        <h1>{heading}</h1>
        {message ? <p>{message}</p> : null}
        <span aria-hidden="true" className="message-template__heart">♡</span>
      </div>
    </article>
  );
}

function interpolate(template: string, definition: TemplateDefinition, data: Record<string, unknown>): string {
  return template.replace(/\{\{([A-Za-z][A-Za-z0-9_]{0,63})\}\}/g, (_match, fieldId: string) => {
    const value = data[fieldId];
    if (typeof value === "string" || typeof value === "number") return String(value);
    return definition.fields.find((field) => field.id === fieldId)?.placeholder ?? "";
  });
}

function displayValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "Sim" : "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value) ?? "";
}

function CardIllustration({ illustration }: { illustration: NonNullable<TemplateDefinition["card"]>["illustration"] }) {
  if (illustration === "wave") {
    return (
      <svg className="message-template__illustration" viewBox="0 0 240 190" role="presentation">
        <path d="M45 138c-14-8-19-22-11-34l13-19 7-35c2-10 17-9 18 2l1 20 6-45c2-11 18-9 18 2l-1 43 7-48c2-11 18-8 18 3l-4 49 9-37c3-10 18-5 15 6l-9 53c-3 19-12 34-25 45l-7 9-49-14-6 0Z" fill="url(#hand-fill)" stroke="#e58527" strokeWidth="4" strokeLinejoin="round" />
        <path d="m39 131 14-25 12 7-13 29Zm98-67 10 5-7 14-10-4Z" fill="#ffc267" opacity=".9" />
        <path d="m176 54 6-12m5 26 12-5m-26 56 11 7" fill="none" stroke="#ffbf5c" strokeLinecap="round" strokeWidth="8" />
        <defs><linearGradient id="hand-fill" x1="48" x2="148" y1="51" y2="151" gradientUnits="userSpaceOnUse"><stop stopColor="#ffc45c" /><stop offset="1" stopColor="#ff8f27" /></linearGradient></defs>
      </svg>
    );
  }

  if (illustration === "shopping-bag-heart") {
    return (
      <svg className="message-template__illustration" viewBox="0 0 240 190" role="presentation">
        <path d="m54 68 8 87c1 9 8 16 17 16h82c9 0 16-7 17-16l8-87H54Z" fill="url(#bag-fill)" stroke="#1764d8" strokeWidth="5" strokeLinejoin="round" />
        <path d="M91 74V55c0-18 13-32 29-32s29 14 29 32v19" fill="none" stroke="#1764d8" strokeWidth="13" strokeLinecap="round" />
        <path d="M91 74V55c0-18 13-32 29-32s29 14 29 32v19" fill="none" stroke="#5ba5ff" strokeWidth="5" strokeLinecap="round" />
        <path d="M120 136c-4-4-24-18-24-31 0-13 16-18 24-6 8-12 24-7 24 6 0 13-20 27-24 31Z" fill="#fff" />
        <path d="m38 79 4-10m-8 24-9 1m172-22 7-8m-1 25 10 3" fill="none" stroke="#69adff" strokeLinecap="round" strokeWidth="7" />
        <circle cx="181" cy="48" r="8" fill="#9bcaff" /><circle cx="63" cy="47" r="6" fill="#9bcaff" />
        <defs><linearGradient id="bag-fill" x1="56" x2="181" y1="64" y2="162" gradientUnits="userSpaceOnUse"><stop stopColor="#4da3ff" /><stop offset="1" stopColor="#0864e9" /></linearGradient></defs>
      </svg>
    );
  }

  return (
    <svg className="message-template__illustration" viewBox="0 0 240 190" role="presentation">
      <path d="m54 83 66-40 66 40-66 39-66-39Z" fill="#cf91ff" stroke="#8e43df" strokeWidth="5" strokeLinejoin="round" />
      <path d="M70 91v54l50 31 50-31V91l-50 31-50-31Z" fill="url(#gift-fill)" stroke="#8e43df" strokeWidth="5" strokeLinejoin="round" />
      <path d="m108 113 24-14 5 76-24-3-5-59Z" fill="#f3cbff" />
      <path d="M116 48c-22-4-31-28-12-32 16-3 21 17 16 31-2-21 10-39 26-30 15 9 1 28-30 31Z" fill="#a857ed" stroke="#8536d1" strokeWidth="4" strokeLinejoin="round" />
      <path d="m31 67-6-10m187 43 11-4m-25-62 7-9" fill="none" stroke="#bf7bf4" strokeLinecap="round" strokeWidth="8" />
      <defs><linearGradient id="gift-fill" x1="74" x2="166" y1="97" y2="164" gradientUnits="userSpaceOnUse"><stop stopColor="#bd6cf1" /><stop offset="1" stopColor="#8135dc" /></linearGradient></defs>
    </svg>
  );
}
