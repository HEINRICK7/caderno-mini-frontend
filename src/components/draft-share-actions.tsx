"use client";

import { useState } from "react";
import { Download, ExternalLink, Image as ImageIcon, MessageCircle } from "lucide-react";
import { WhatsAppPhonePreview } from "@/components/whatsapp-phone-preview";
import {
  billingWhatsAppMessages,
  billingWhatsAppShareUrl,
  DEFAULT_BILLING_MESSAGE_ID,
  renderBillingWhatsAppMessage,
  type WhatsAppShareVariables,
  whatsappShareUrl,
} from "@/lib/whatsapp-share";

type DraftShareActionsProps = {
  draftId: string;
  publicUrl: string;
  allowImage: boolean;
  businessName?: string;
  billingMessages?: boolean;
  shareVariables?: WhatsAppShareVariables;
};

export function DraftShareActions({
  draftId,
  publicUrl,
  allowImage,
  businessName = "",
  billingMessages = false,
  shareVariables = {},
}: DraftShareActionsProps) {
  const [feedback, setFeedback] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState(DEFAULT_BILLING_MESSAGE_ID);
  const imageUrl = `/api/v1/drafts/${encodeURIComponent(draftId)}/export.png`;
  const billingMessage = renderBillingWhatsAppMessage(selectedMessageId, shareVariables);
  const shareUrl = billingMessages
    ? billingWhatsAppShareUrl(publicUrl, billingMessage)
    : whatsappShareUrl(publicUrl, businessName);

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
    <section className={`draft-share-actions${billingMessages ? " draft-share-actions--billing" : ""}`} aria-label="Compartilhar mensagem">
      <div className="draft-share-actions__url">
        <span>Link publicado</span>
        <a href={publicUrl} rel="noreferrer" target="_blank">{publicUrl}</a>
      </div>
      {billingMessages ? (
        <div className="draft-share-actions__billing-layout">
          <div className="draft-share-actions__billing-controls">
            <div className="draft-share-message-picker">
              <label htmlFor={`whatsapp-message-${draftId}`}>Texto para enviar no WhatsApp</label>
              <select
                id={`whatsapp-message-${draftId}`}
                onChange={(event) => setSelectedMessageId(event.target.value)}
                value={selectedMessageId}
              >
                {billingWhatsAppMessages.map((message) => (
                  <option key={message.id} value={message.id}>{message.label}</option>
                ))}
              </select>
              <span>Nome, valor e vencimento são preenchidos com os dados da cobrança.</span>
            </div>
            <div className="draft-share-actions__buttons">
              <a className="button button--primary" href={shareUrl} rel="noreferrer" target="_blank">
                <MessageCircle aria-hidden="true" size={16} /> WhatsApp
              </a>
              <a className="button button--secondary" href={publicUrl} rel="noreferrer" target="_blank">
                <ExternalLink aria-hidden="true" size={16} /> Abrir link
              </a>
            </div>
            {feedback ? <p className="draft-share-actions__feedback" role="status">{feedback}</p> : null}
          </div>
          <WhatsAppPhonePreview
            billingMessage
            businessName={businessName}
            message={billingMessage}
            publicUrl={publicUrl}
            templateName="Cobrança Pix"
          />
        </div>
      ) : null}
      {!billingMessages ? (
        <>
          <div className="draft-share-actions__buttons">
            <a className="button button--primary" href={shareUrl} rel="noreferrer" target="_blank">
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
        </>
      ) : null}
    </section>
  );
}
