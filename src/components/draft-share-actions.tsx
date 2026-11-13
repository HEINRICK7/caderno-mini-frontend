"use client";

import { useState } from "react";
import { Download, ExternalLink, Image as ImageIcon, MessageCircle } from "lucide-react";

type DraftShareActionsProps = {
  draftId: string;
  publicUrl: string;
  allowImage: boolean;
};

export function DraftShareActions({ draftId, publicUrl, allowImage }: DraftShareActionsProps) {
  const [feedback, setFeedback] = useState("");
  const imageUrl = `/api/v1/drafts/${encodeURIComponent(draftId)}/export.png`;

  async function shareImage() {
    setFeedback("");
    try {
      const response = await fetch(imageUrl, { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error("Não foi possível preparar a imagem.");
      const image = new File([await response.blob()], `caderno-${draftId}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [image] })) {
        await navigator.share({ files: [image], title: "Mensagem do Cadernô Express" });
        return;
      }

      const objectUrl = URL.createObjectURL(image);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = image.name;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setFeedback("Imagem baixada. Anexe o arquivo na conversa do WhatsApp.");
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setFeedback(cause instanceof Error ? cause.message : "Não foi possível compartilhar a imagem.");
    }
  }

  return (
    <section className="draft-share-actions" aria-label="Compartilhar mensagem">
      <div className="draft-share-actions__url">
        <span>Link publicado</span>
        <a href={publicUrl} rel="noreferrer" target="_blank">{publicUrl}</a>
      </div>
      <div className="draft-share-actions__buttons">
        <a className="button button--primary" href={`https://wa.me/?text=${encodeURIComponent(`Confira a mensagem que preparei para você: ${publicUrl}`)}`} rel="noreferrer" target="_blank">
          <MessageCircle aria-hidden="true" size={16} /> WhatsApp
        </a>
        <a className="button button--secondary" href={publicUrl} rel="noreferrer" target="_blank">
          <ExternalLink aria-hidden="true" size={16} /> Abrir link
        </a>
        {allowImage ? (
          <>
            <a className="button button--secondary" href={imageUrl} download>
              <Download aria-hidden="true" size={16} /> Baixar imagem
            </a>
            <button className="button button--secondary" onClick={() => void shareImage()} type="button">
              <ImageIcon aria-hidden="true" size={16} /> Enviar imagem
            </button>
          </>
        ) : null}
      </div>
      {feedback ? <p className="draft-share-actions__feedback" role="status">{feedback}</p> : null}
    </section>
  );
}
