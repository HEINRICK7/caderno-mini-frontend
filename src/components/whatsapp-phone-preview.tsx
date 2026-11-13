import Image from "next/image";
import { ChevronLeft, Mic, MoreVertical, Phone, Plus } from "lucide-react";
import { shareLinkMetadata } from "@/lib/share-link-metadata";

type WhatsAppPhonePreviewProps = {
  businessName: string;
  message: string;
  publicUrl: string;
  templateName: string;
  billingMessage?: boolean;
};

function linkDetails(publicUrl: string) {
  try {
    const link = new URL(publicUrl);
    const image = new URL(link.href);
    image.pathname = `${link.pathname.replace(/\/$/, "")}/share-image`;
    image.search = "";
    image.hash = "";

    return {
      domain: link.hostname.replace(/^www\./, ""),
      image: image.href,
    };
  } catch {
    return { domain: "", image: "" };
  }
}

function initials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join("").toLocaleUpperCase("pt-BR") || "SN";
}

export function WhatsAppPhonePreview({ businessName, message, publicUrl, templateName, billingMessage = false }: WhatsAppPhonePreviewProps) {
  const { domain, image } = linkDetails(publicUrl);
  const { title, description } = shareLinkMetadata({
    businessName,
    templateName,
    purpose: billingMessage ? "pix-charge" : "message",
  });
  const contactName = businessName.trim() || "Seu negócio";

  return (
    <section aria-label="Prévia no WhatsApp" className="draft-whatsapp-preview">
      <h3>Prévia no WhatsApp</h3>
      <div aria-label="Conversa do cliente no WhatsApp" className="message-phone message-phone--whatsapp" role="region">
        <div aria-hidden="true" className="message-phone__status">
          <span>9:41</span>
          <span className="message-phone__island" />
          <span className="message-phone__indicators">
            <span className="message-phone__signal"><i /><i /><i /><i /></span>
            <span className="message-phone__wifi" />
            <span className="message-phone__battery"><i /></span>
          </span>
        </div>
        <div className="message-phone__screen whatsapp-phone__screen">
          <header className="whatsapp-phone__header">
            <ChevronLeft aria-hidden="true" size={22} />
            <span aria-hidden="true" className="whatsapp-phone__avatar">{initials(contactName)}</span>
            <span className="whatsapp-phone__contact">{contactName}</span>
            <Phone aria-hidden="true" size={17} />
            <MoreVertical aria-hidden="true" size={18} />
          </header>
          <div className="whatsapp-phone__chat">
            <span className="whatsapp-phone__date">HOJE</span>
            <article aria-label="Mensagem recebida" className="whatsapp-phone__bubble">
              <p className="whatsapp-phone__message">{message}</p>
              <a className="whatsapp-phone__url" href={publicUrl} rel="noreferrer" target="_blank">{publicUrl}</a>
              <div aria-label="Prévia do link publicado" className="whatsapp-phone__link-card">
                {image ? <Image alt="Imagem de apresentação da cobrança" height={630} loading="lazy" src={image} unoptimized width={1200} /> : null}
                <strong>{title}</strong>
                <span>{description}</span>
                <small>{domain}</small>
              </div>
              <time>9:41</time>
            </article>
          </div>
          <div aria-hidden="true" className="whatsapp-phone__composer">
            <Plus size={19} />
            <span>Mensagem</span>
            <Mic size={18} />
          </div>
        </div>
        <div aria-hidden="true" className="message-phone__home"><span /></div>
      </div>
      <p>Texto e cartão do link como aparecem para o cliente.</p>
    </section>
  );
}
