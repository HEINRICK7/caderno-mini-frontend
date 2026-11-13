"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Plus, Share2 } from "lucide-react";
import { CustomerAreaShell, CustomerWorkspaceLoading } from "@/components/customer-area-shell";
import { DraftShareActions } from "@/components/draft-share-actions";
import { ApiError, api } from "@/lib/api-client";
import type { CustomerPortalSummary } from "@/lib/api-contracts";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

export default function SavedMessagesPage() {
  const router = useRouter();
  const [portal, setPortal] = useState<CustomerPortalSummary | null>(null);
  const [publicLinks, setPublicLinks] = useState<Record<string, string>>({});
  const [publishingId, setPublishingId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await api.getCustomerPortal();
      if (!result.user.profileComplete) {
        router.replace("/primeiro-acesso?returnTo=%2Fmensagens");
        return;
      }
      setPortal(result);
      setError("");
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        router.replace("/entrar?returnTo=%2Fmensagens");
      } else {
        setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar suas mensagens.");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  async function publish(draftId: string) {
    setPublishingId(draftId);
    setError("");
    try {
      const publication = await api.publishDraft(draftId);
      setPublicLinks((current) => ({ ...current, [draftId]: publication.publicUrl }));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível publicar a mensagem.");
    } finally {
      setPublishingId("");
    }
  }

  if (loading && !portal) return <CustomerWorkspaceLoading label="Carregando suas mensagens…" />;

  return (
    <CustomerAreaShell access={portal?.platformAccess} email={portal?.user.email}>
      <section className="subpage-content saved-messages-page">
        <div className="template-editor-heading saved-messages-heading">
          <span className="customer-area-eyebrow"><FileText aria-hidden="true" size={14} /> Sua biblioteca</span>
          <h1>Minhas mensagens</h1>
          <p>Seus rascunhos ficam salvos aqui. Abra qualquer mensagem para continuar editando ou publicar e compartilhar.</p>
        </div>

        {error ? <p className="form-error" role="alert">{error}</p> : null}

        {portal?.drafts.length ? (
          <div className="saved-message-list">
            {portal.drafts.map((draft) => {
              const publicUrl = publicLinks[draft.id];
              const isPixCharge = draft.templateId === "cobranca-pix";
              return (
                <article className="saved-message-card" key={draft.id}>
                  <div className="saved-message-card__icon"><FileText aria-hidden="true" size={20} /></div>
                  <div className="saved-message-card__copy">
                    <h2>{draft.templateName}</h2>
                    <p>Atualizada em {formatDate(draft.updatedAt)}</p>
                  </div>
                  <div className="saved-message-card__actions">
                    <Link className="button button--secondary" href={`/mensagens/${encodeURIComponent(draft.id)}`}>Editar mensagem</Link>
                    {!publicUrl ? (
                      <button className="button button--primary" disabled={!portal.platformAccess.active || publishingId === draft.id} onClick={() => void publish(draft.id)} type="button">
                        <Share2 aria-hidden="true" size={16} />
                        {publishingId === draft.id ? "Publicando…" : "Publicar e compartilhar"}
                      </button>
                    ) : null}
                  </div>
                  {!portal.platformAccess.active && !publicUrl ? <p className="saved-message-card__locked">Ative sua licença para publicar e compartilhar esta mensagem.</p> : null}
                  {publicUrl ? <DraftShareActions allowImage={!isPixCharge} billingMessages={isPixCharge} businessName={draft.businessName} draftId={draft.id} publicUrl={publicUrl} shareVariables={draft.shareVariables} /> : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="customer-dashboard-panel saved-message-empty">
            <span><FileText aria-hidden="true" size={23} /></span>
            <h2>Você ainda não salvou uma mensagem</h2>
            <p>Escolha um modelo, personalize e salve. Depois ele aparece nesta lista para continuar usando.</p>
            <Link className="button button--primary" href="/templates"><Plus aria-hidden="true" size={17} /> Criar mensagem <ArrowRight aria-hidden="true" size={15} /></Link>
          </div>
        )}
      </section>
    </CustomerAreaShell>
  );
}
