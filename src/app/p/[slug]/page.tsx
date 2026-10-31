"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { CSSProperties } from "react";
import { ApiError, api } from "@/lib/api-client";
import type { PublicPublication, Template } from "@/lib/api-contracts";

export default function PublicMessagePage() {
  const { slug } = useParams<{ slug: string }>();
  const [publication, setPublication] = useState<PublicPublication | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const message = await api.getPublicPublication(slug);
      const sourceTemplate = await api.getTemplate(message.templateId);
      setPublication(message);
      setTemplate(sourceTemplate);
      setError("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível abrir esta mensagem.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    let active = true;
    void api.getPublicPublication(slug).then(async (message) => ({
      publication: message,
      template: await api.getTemplate(message.templateId),
    })).then(({ publication: message, template: sourceTemplate }) => {
      if (!active) return;
      setPublication(message);
      setTemplate(sourceTemplate);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof ApiError ? cause.message : "Não foi possível abrir esta mensagem.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [slug]);

  const visual = template?.definition.visual;
  const cardStyle = {
    "--message-background": visual?.background ?? "#fffdfa",
    "--message-surface": visual?.surface ?? "#ffffff",
    "--message-accent": visual?.accent ?? "#168a80",
    "--message-heading": visual?.heading ?? "#10264f",
    "--message-text": visual?.text ?? "#334c76",
    "--message-muted": visual?.muted ?? "#687895",
  } as CSSProperties;
  const values = template
    ? template.definition.fields.flatMap((field) => {
        const value = publication?.data[field.id];
        if (value === undefined || value === null || value === "" || value === false) return [];
        return [[field.label ?? field.id, String(value)] as const];
      })
    : [];

  return (
    <main className="public-message-shell">
      {loading ? <p className="page-message" role="status">Carregando mensagem…</p> : null}
      {!loading && error ? (
        <div className="public-message-error" role="alert">
          <p>{error}</p>
          <button className="text-button" onClick={() => { setLoading(true); setError(""); void load(); }} type="button">Tentar novamente</button>
        </div>
      ) : null}
      {!loading && publication && template ? (
        <article className={`public-message-card layout--${visual?.layout ?? "card"} frame--${visual?.frame ?? "none"} font--${visual?.headingFont ?? "sans"} body-font--${visual?.bodyFont ?? "sans"}`} style={cardStyle}>
          <div className="public-message-card__inner">
            <p className="public-message-card__brand">Cadernô Express</p>
            <h1>{publication.templateName}</h1>
            {publication.templateDescription ? <p className="public-message-card__description">{publication.templateDescription}</p> : null}
            <dl>
              {values.map(([label, value]) => (
                <div className="public-message-card__field" key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </article>
      ) : null}
    </main>
  );
}
