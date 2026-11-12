"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CircleAlert, Clock3, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { trackMetaEvent } from "@/components/meta-pixel";
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

function trackPurchaseConversion(status: PurchaseStatus, trackedPurchaseIds: Set<string>) {
  if (status.status !== "paid" || status.accessStatus !== "active" || !status.amountMinor || status.currency !== "BRL") return;
  if (trackedPurchaseIds.has(status.purchaseId)) return;

  const storageKey = `meta-purchase:${status.purchaseId}`;
  try {
    if (window.localStorage.getItem(storageKey) === "1") {
      trackedPurchaseIds.add(status.purchaseId);
      return;
    }
  } catch {
    // Keep an in-memory guard when browser storage is unavailable.
  }

  if (!trackMetaEvent("Purchase", { value: status.amountMinor / 100, currency: status.currency })) return;

  trackedPurchaseIds.add(status.purchaseId);
  try {
    window.localStorage.setItem(storageKey, "1");
  } catch {
    // The in-memory guard still prevents duplicates during this page session.
  }
}

export default function PurchasePage() {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const router = useRouter();
  const publishing = useRef(false);
  const publishedUrl = useRef("");
  const trackedPurchaseIds = useRef(new Set<string>());
  const [purchase, setPurchase] = useState<PurchaseStatus | null>(null);
  const [publicUrl, setPublicUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const status = await api.getPurchase(purchaseId);
      setPurchase(status);
      setError("");
      trackPurchaseConversion(status, trackedPurchaseIds.current);
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
        trackPurchaseConversion(status, trackedPurchaseIds.current);
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

  const shareablePublicUrl = purchase?.accessStatus === "active" ? publicUrl : "";
  const whatsappUrl = shareablePublicUrl
    ? `https://wa.me/?text=${encodeURIComponent(shareablePublicUrl)}`
    : "";

  return (
    <main className="subpage-shell">
      <SiteHeader />
      <section className="subpage-content subpage-content--narrow purchase-content">
        <div className="page-heading page-heading--stacked purchase-heading">
          <span className="purchase-eyebrow">
            {shareablePublicUrl ? <ShieldCheck aria-hidden="true" size={15} /> : <Clock3 aria-hidden="true" size={15} />}
            {shareablePublicUrl ? "Tudo pronto para compartilhar" : "Acompanhamento seguro"}
          </span>
          <h1>{shareablePublicUrl ? "Seu cartão está pronto." : "Acompanhe sua compra."}</h1>
          {purchase ? <p aria-live="polite" className={`purchase-status purchase-status--${purchase.status}`}>{statusLabels[purchase.status]}</p> : null}
          {purchase?.status === "pending" ? <span className="purchase-hint">A confirmação pode levar alguns instantes. Atualizamos esta tela automaticamente.</span> : null}
        </div>
        {loading && !purchase ? <div className="purchase-state purchase-state--loading" role="status"><span className="purchase-state__icon"><Clock3 aria-hidden="true" size={20} /></span><div><h2>Consultando sua compra</h2><p>Estamos verificando a confirmação com segurança.</p></div></div> : null}
        {error ? <div className="purchase-state purchase-state--error" role="alert"><span className="purchase-state__icon"><CircleAlert aria-hidden="true" size={20} /></span><div><h2>Não conseguimos atualizar agora</h2><p>{error}</p></div></div> : null}
        {shareablePublicUrl ? (
          <div className="share-result purchase-share-result">
            <div className="purchase-share-result__copy"><strong>Compartilhe com seu cliente</strong><span>O link abre o cartão personalizado em qualquer celular.</span></div>
            <a className="share-result__url" href={shareablePublicUrl}>{shareablePublicUrl}</a>
            <a className="button button--primary form-submit" href={whatsappUrl} rel="noreferrer" target="_blank">Compartilhar no WhatsApp</a>
          </div>
        ) : null}
        {purchase && purchase.accessStatus !== "active" ? (
          <button className="button button--secondary purchase-refresh" disabled={loading} onClick={() => { setLoading(true); void refresh(); }} type="button">{loading ? "Verificando…" : "Verificar situação"}</button>
        ) : null}
        {error ? <button className="text-button purchase-retry" disabled={loading} onClick={() => { setLoading(true); void refresh(); }} type="button">Tentar novamente</button> : null}
        <Link className="back-link purchase-back-link" href="/templates">Voltar aos modelos <span aria-hidden="true">→</span></Link>
      </section>
    </main>
  );
}
