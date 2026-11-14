"use client";

import { useState } from "react";
import { Download, ExternalLink, Image as ImageIcon, MessageCircle } from "lucide-react";
import { WhatsAppPhonePreview } from "@/components/whatsapp-phone-preview";
import { SharePublicLinkQr } from "@/components/share-public-link-qr";
import {
  billingWhatsAppMessages,
  billingWhatsAppShareUrl,
  DEFAULT_BILLING_MESSAGE_ID,
  pixChargeShareUrl,
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
  const [preparingImage, setPreparingImage] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(DEFAULT_BILLING_MESSAGE_ID);
  const imageUrl = `/api/v1/drafts/${encodeURIComponent(draftId)}/export.png`;
  const billingMessage = renderBillingWhatsAppMessage(selectedMessageId, shareVariables);
  const whatsAppPublicUrl = billingMessages ? pixChargeShareUrl(publicUrl) : publicUrl;
  const shareUrl = billingMessages
    ? billingWhatsAppShareUrl(whatsAppPublicUrl, billingMessage)
    : whatsappShareUrl(publicUrl, businessName);

  async function prepareImage() {
    const response = await fetch(imageUrl, { credentials: "same-origin", cache: "no-store" });
    const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (!response.ok || contentType !== "image/png") {
      throw new Error("Não foi possível preparar a imagem. Tente novamente em instantes.");
    }

    const blob = await response.blob();
    if (blob.size === 0) throw new Error("A imagem gerada está vazia. Tente novamente.");
    return new File([blob], `caderno-${draftId}.png`, { type: "image/png" });
  }

  function downloadPreparedImage(image: File) {
    const objectUrl = URL.createObjectURL(image);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = image.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  async function downloadImage() {
    if (preparingImage) return;
    setPreparingImage(true);
    setFeedback("");
    try {
      const image = await prepareImage();
      downloadPreparedImage(image);
      setFeedback("Imagem baixada. Confira a pasta Downloads.");
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : "Não foi possível preparar a imagem.");
    } finally {
      setPreparingImage(false);
    }
  }

  async function shareImage() {
    if (preparingImage) return;
    setPreparingImage(true);
    setFeedback("");
    try {
      const image = await prepareImage();
      if (navigator.share && navigator.canShare?.({ files: [image] })) {
        await navigator.share({ files: [image], title: "Mensagem do Cadernô Express" });
        return;
      }

      downloadPreparedImage(image);
      setFeedback("Imagem baixada. Anexe o arquivo na conversa do WhatsApp.");
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setFeedback(cause instanceof Error ? cause.message : "Não foi possível compartilhar a imagem.");
    } finally {
      setPreparingImage(false);
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
            <SharePublicLinkQr isPixCharge={billingMessages} publicUrl={publicUrl} />
            {feedback ? <p className="draft-share-actions__feedback" role="status">{feedback}</p> : null}
          </div>
          <WhatsAppPhonePreview
            billingMessage
            businessName={businessName}
            message={billingMessage}
            publicUrl={whatsAppPublicUrl}
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
                <button className="button button--secondary" disabled={preparingImage} onClick={() => void downloadImage()} type="button">
                  <Download aria-hidden="true" size={16} /> {preparingImage ? "Preparando…" : "Baixar imagem"}
                </button>
                <button className="button button--secondary" disabled={preparingImage} onClick={() => void shareImage()} type="button">
                  <ImageIcon aria-hidden="true" size={16} /> {preparingImage ? "Preparando…" : "Enviar imagem"}
                </button>
              </>
            ) : null}
          </div>
          <SharePublicLinkQr isPixCharge={billingMessages} publicUrl={publicUrl} />
          {feedback ? <p className="draft-share-actions__feedback" role="status">{feedback}</p> : null}
        </>
      ) : null}
    </section>
  );
}
