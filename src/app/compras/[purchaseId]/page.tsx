"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ApiError, api } from "@/lib/api-client";
import type { PurchaseStatus } from "@/lib/api-contracts";

const statusLabels: Record<PurchaseStatus["status"], string> = {
  pending: "Aguardando confirmação",
  paid: "Pagamento confirmado",
  refunded: "Compra reembolsada",
  chargedback: "Compra contestada",
  canceled: "Compra cancelada",
  refused: "Pagamento não aprovado",
};

export default function PurchasePage() {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const router = useRouter();
  const publishing = useRef(false);
  const publishedUrl = useRef("");
  const [purchase, setPurchase] = useState<PurchaseStatus | null>(null);
  const [publicUrl, setPublicUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const status = await api.getPurchase(purchaseId);
      setPurchase(status);
      setError("");
      if (status.accessStatus === "active" && !publishing.current && !publishedUrl.current) {
        publishing.current = true;
        try {
          const publication = await api.publishDraft(status.draftId);
          publishedUrl.current = publication.publicUrl;
          setPublicUrl(publication.publicUrl);
        } finally {
          publishing.current = false;
        }
      }
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        router.replace(`/entrar?returnTo=${encodeURIComponent(`/compras/${purchaseId}`)}`);
      } else {
        setError(cause instanceof ApiError ? cause.message : "Não foi possível consultar a compra.");
      }
    } finally {
      setLoading(false);
    }
  }, [purchaseId, router]);

  useEffect(() => {
    let active = true;
    const poll = () => {
      void api.getPurchase(purchaseId).then(async (status) => {
        if (!active) return;
        setPurchase(status);
        setError("");
        if (status.accessStatus === "active" && !publishing.current && !publishedUrl.current) {
          publishing.current = true;
          try {
            const publication = await api.publishDraft(status.draftId);
            if (active) {
              publishedUrl.current = publication.publicUrl;
              setPublicUrl(publication.publicUrl);
            }
          } finally {
            publishing.current = false;
          }
        }
      }).catch((cause: unknown) => {
        if (!active) return;
        if (cause instanceof ApiError && cause.status === 401) {
          router.replace(`/entrar?returnTo=${encodeURIComponent(`/compras/${purchaseId}`)}`);
        } else {
          setError(cause instanceof ApiError ? cause.message : "Não foi possível consultar a compra.");
        }
      }).finally(() => {
        if (active) setLoading(false);
      });
    };
    void Promise.resolve().then(poll);
    const interval = window.setInterval(poll, 5000);
    return () => { active = false; window.clearInterval(interval); };
  }, [purchaseId, router]);

  const whatsappUrl = publicUrl
    ? `https://wa.me/?text=${encodeURIComponent(publicUrl)}`
    : "";

  return (
    <main className="subpage-shell">
      <SiteHeader />
      <section className="subpage-content subpage-content--narrow">
        <div className="page-heading page-heading--stacked">
          <h1>{publicUrl ? "Link pronto" : "Acompanhar compra"}</h1>
          {purchase ? <p>{statusLabels[purchase.status]}</p> : null}
        </div>
        {loading && !purchase ? <p className="page-message" role="status">Consultando compra…</p> : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        {publicUrl ? (
          <div className="share-result">
            <a className="share-result__url" href={publicUrl}>{publicUrl}</a>
            <a className="button button--primary form-submit" href={whatsappUrl} rel="noreferrer" target="_blank">Compartilhar no WhatsApp</a>
          </div>
        ) : null}
        {purchase && purchase.accessStatus !== "active" ? (
          <button className="button button--secondary form-submit" onClick={() => { setLoading(true); void refresh(); }} type="button">Verificar situação</button>
        ) : null}
        {error ? <button className="text-button" onClick={() => { setLoading(true); void refresh(); }} type="button">Tentar novamente</button> : null}
        <Link className="back-link" href="/templates">Voltar aos modelos</Link>
      </section>
    </main>
  );
}
