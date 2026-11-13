"use client";

import { useId, useRef, useState } from "react";
import { Download, QrCode } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

type SharePublicLinkQrProps = {
  publicUrl: string;
  isPixCharge: boolean;
};

function isSafePublishedUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const isLocalHttp = url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    return (url.protocol === "https:" || isLocalHttp)
      && !url.username
      && !url.password
      && /^\/p\/[A-Za-z0-9_-]+$/.test(url.pathname);
  } catch {
    return false;
  }
}

export function SharePublicLinkQr({ publicUrl, isPixCharge }: SharePublicLinkQrProps) {
  const panelId = useId();
  const qrRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  if (!isSafePublishedUrl(publicUrl)) return null;

  function downloadQr() {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) {
      setFeedback("O QR Code ainda está sendo preparado. Tente novamente.");
      return;
    }

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = isPixCharge ? "qr-para-abrir-cobranca.png" : "qr-para-abrir-mensagem.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setFeedback("QR Code baixado como imagem PNG.");
  }

  const title = isPixCharge ? "QR para abrir a cobrança" : "QR para abrir a mensagem";

  return (
    <div className="share-public-link-qr">
      <button
        aria-controls={isOpen ? panelId : undefined}
        aria-expanded={isOpen}
        className="button button--secondary"
        onClick={() => {
          setIsOpen((current) => !current);
          setFeedback("");
        }}
        type="button"
      >
        <QrCode aria-hidden="true" size={16} /> {isOpen ? "Fechar QR Code" : "Ver QR Code do link"}
      </button>
      {isOpen ? (
        <section aria-labelledby={`${panelId}-title`} className="share-public-link-qr__panel" id={panelId}>
          <div aria-label={title} className="share-public-link-qr__image" ref={qrRef} role="img">
            <QRCodeCanvas level="H" marginSize={4} size={220} title={title} value={publicUrl} />
          </div>
          <div className="share-public-link-qr__copy">
            <h3 id={`${panelId}-title`}>{title}</h3>
            <p>
              {isPixCharge
                ? "Este QR abre a página da cobrança; não inicia o pagamento. Confira o recebedor e o valor no app do banco antes de pagar."
                : "Este QR abre o link público da mensagem."}
            </p>
            <button className="button button--secondary" onClick={downloadQr} type="button">
              <Download aria-hidden="true" size={15} /> Baixar imagem PNG
            </button>
            {feedback ? <span className="share-public-link-qr__feedback" role="status">{feedback}</span> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
