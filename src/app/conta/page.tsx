"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ApiError, api } from "@/lib/api-client";
import type { AccountAccessItem } from "@/lib/api-contracts";

export default function AccountPage() {
  const router = useRouter();
  const [accessItems, setAccessItems] = useState<AccountAccessItem[]>([]);
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [publicLinks, setPublicLinks] = useState<Record<string, string>>({});
  const [publishingDraftId, setPublishingDraftId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAccount = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setAccessItems(await api.getAccountAccess());
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        router.replace("/entrar?returnTo=%2Fconta");
        return;
      }
      setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar sua conta.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let active = true;
    void api.getAccountAccess().then((items) => {
      if (active) {
        setAccessItems(items);
        setError("");
      }
    }).catch((cause: unknown) => {
      if (!active) return;
      if (cause instanceof ApiError && cause.status === 401) {
        router.replace("/entrar?returnTo=%2Fconta");
      } else {
        setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar sua conta.");
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    let active = true;
    void api.getAdminAccess().then((allowed) => {
      if (active) setCanManageUsers(allowed);
    }).catch(() => {
      if (active) setCanManageUsers(false);
    });
    return () => { active = false; };
  }, []);

  async function createPublicLink(draftId: string) {
    setPublishingDraftId(draftId);
    setError("");
    try {
      const publication = await api.publishDraft(draftId);
      setPublicLinks((current) => ({ ...current, [draftId]: publication.publicUrl }));
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        router.replace("/entrar?returnTo=%2Fconta");
      } else {
        setError(cause instanceof ApiError ? cause.message : "Não foi possível criar o link.");
      }
    } finally {
      setPublishingDraftId("");
    }
  }

  const uniqueItems = [...accessItems.reduce((items, item) => {
    const current = items.get(item.draftId);
    const itemIsActive = item.accessStatus === "active" && item.purchaseStatus === "paid";
    const currentIsActive = current?.accessStatus === "active" && current.purchaseStatus === "paid";
    if (!current || (itemIsActive && !currentIsActive)) items.set(item.draftId, item);
    return items;
  }, new Map<string, AccountAccessItem>()).values()];

  return (
    <main className="subpage-shell">
      <SiteHeader />
      <section className="subpage-content subpage-content--narrow account-content">
        <div className="page-heading page-heading--stacked">
          <h1>Minha conta</h1>
          <p>Suas compras e os links das mensagens ficam reunidos aqui. Entre com o mesmo e-mail usado no checkout.</p>
          {canManageUsers ? <Link className="account-admin-link" href="/admin">Abrir painel do criador <span aria-hidden="true">→</span></Link> : null}
          {canManageUsers ? <p className="account-admin-test-notice" role="status">Acesso premium de teste ativo nesta sessão administrativa. Esse acesso não cria compra nem licença.</p> : null}
        </div>

        {loading ? <p className="page-message" role="status">Carregando suas compras…</p> : null}
        {error ? <div className="page-message page-message--error" role="alert"><p>{error}</p><button className="text-button" onClick={() => void loadAccount()} type="button">Tentar novamente</button></div> : null}
        {!loading && !error && uniqueItems.length === 0 ? (
          <div className="account-empty">
            <h2>{canManageUsers ? "Acesso de teste pronto" : "Ainda não há mensagens na sua conta"}</h2>
            <p>{canManageUsers ? "Você pode testar todos os recursos premium pela sua sessão administrativa. Compras e licenças reais continuam sendo exibidas somente após confirmação da Cakto." : "Se você já comprou, entre usando o mesmo e-mail informado no checkout. Após a confirmação, a compra aparece aqui."}</p>
            {canManageUsers ? (
              <Link className="button button--primary" href="/templates">Testar os modelos</Link>
            ) : (
              <>
                <Link className="button button--primary" href="/entrar?returnTo=%2Fconta">Entrar com meu e-mail</Link>
                <Link className="text-link" href="/templates">Conhecer os modelos <span aria-hidden="true">→</span></Link>
              </>
            )}
          </div>
        ) : null}
        {uniqueItems.length > 0 ? (
          <div aria-label="Mensagens da sua conta" className="account-access-list">
            {uniqueItems.map((item) => {
              const canShare = item.accessStatus === "active" && item.purchaseStatus === "paid";
              const accessLabel = canShare
                ? item.expiresAt ? `Acesso até ${new Date(item.expiresAt).toLocaleDateString("pt-BR")}` : "Acesso vitalício"
                : `Acesso indisponível · compra em ${new Date(item.grantedAt).toLocaleDateString("pt-BR")}`;
              const publicUrl = publicLinks[item.draftId];
              return (
                <article className="account-access-card" key={item.draftId}>
                  <div className="account-access-card__heading">
                    <div>
                      <h2>Mensagem personalizada</h2>
                      <p>{accessLabel}</p>
                    </div>
                    <span className={canShare ? "account-access-card__status is-active" : "account-access-card__status"}>
                      {canShare ? "Ativa" : "Encerrada"}
                    </span>
                  </div>
                  {canShare ? (
                    publicUrl ? (
                      <div className="account-access-card__link">
                        <a className="share-result__url" href={publicUrl}>{publicUrl}</a>
                        <a className="button button--secondary" href={`https://wa.me/?text=${encodeURIComponent(publicUrl)}`} rel="noreferrer" target="_blank">Compartilhar no WhatsApp</a>
                      </div>
                    ) : (
                      <button className="button button--primary" disabled={publishingDraftId === item.draftId} onClick={() => void createPublicLink(item.draftId)} type="button">
                        {publishingDraftId === item.draftId ? "Preparando link…" : "Criar link da mensagem"}
                      </button>
                    )
                  ) : <p className="account-access-card__notice">Esta compra não tem acesso ativo. Se você acredita que isso é um erro, entre em contato com o suporte.</p>}
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}
