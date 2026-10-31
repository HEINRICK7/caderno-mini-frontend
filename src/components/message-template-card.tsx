import type { CSSProperties } from "react";
import type { TemplateDefinition } from "@/lib/api-contracts";
import { StatusSticker } from "./status-sticker";

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
        <StatusSticker
          className="message-template__illustration"
          illustration={definition.card.illustration}
          label=""
        />
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

