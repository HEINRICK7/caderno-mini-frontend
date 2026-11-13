"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Check, CircleAlert, FilePlus2, PackageOpen, Phone, ShieldCheck, UserRound } from "lucide-react";
import { CustomerAreaShell } from "@/components/customer-area-shell";
import { CustomerProfileForm } from "@/components/customer-profile-form";
import { ApiError, api } from "@/lib/api-client";
import type { AccountAccessItem, CustomerPortalSummary } from "@/lib/api-contracts";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [portal, setPortal] = useState<CustomerPortalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [publicLinks, setPublicLinks] = useState<Record<string, string>>({});
  const [publishingDraftId, setPublishingDraftId] = useState("");

  const loadPortal = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getCustomerPortal();
      if (!data.user.profileComplete) {
        router.replace("/primeiro-acesso?returnTo=%2Fpainel");
        return;
      }
      setPortal(data);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        router.replace("/entrar?returnTo=%2Fpainel");
      } else {
        setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar sua área.");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void loadPortal(); }, [loadPortal]);

  const messageAccess = useMemo(() => {
    const unique = new Map<string, AccountAccessItem>();
    for (const item of portal?.accountAccess ?? []) {
      const current = unique.get(item.draftId);
      const active = item.accessStatus === "active" && item.purchaseStatus === "paid";
      const currentActive = current?.accessStatus === "active" && current.purchaseStatus === "paid";
      if (!current || (active && !currentActive)) unique.set(item.draftId, item);
    }
    return [...unique.values()];
  }, [portal?.accountAccess]);

  async function createPublicLink(draftId: string) {
    setPublishingDraftId(draftId);
    setError("");
    try {
      const publication = await api.publishDraft(draftId);
      setPublicLinks((current) => ({ ...current, [draftId]: publication.publicUrl }));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível criar o link da mensagem.");
    } finally {
      setPublishingDraftId("");
    }
  }

  if (loading && !portal) {
    return <CustomerAreaShell><div className="customer-area-loading customer-area-loading--large" role="status">Abrindo sua área privada…</div></CustomerAreaShell>;
  }

  const user = portal?.user;
  const platformAccess = portal?.platformAccess;
  const firstName = user?.name?.trim().split(/\s+/)[0] || "cliente";

  return (
    <CustomerAreaShell access={platformAccess} email={user?.email}>
      <div className="customer-dashboard">
        <section className="customer-dashboard__intro">
          <div>
            <span className="customer-area-eyebrow"><UserRound aria-hidden="true" size={14} /> Área do cliente</span>
            <h1>Olá, {firstName}.</h1>
            <p>Seu acesso, suas mensagens e seus dados estão reunidos aqui.</p>
          </div>
          <Link className="button button--primary" href="/templates"><FilePlus2 aria-hidden="true" size={17} /> Criar mensagem</Link>
        </section>

        {error ? <div className="customer-area-error" role="alert"><CircleAlert aria-hidden="true" size={18} />{error}<button className="text-button" onClick={() => void loadPortal()} type="button">Tentar novamente</button></div> : null}

        <section className={`customer-license-card${platformAccess?.active ? " is-active" : ""}`} aria-label="Sua licença">
          <span className="customer-license-card__icon">{platformAccess?.active ? <Check aria-hidden="true" size={20} /> : <ShieldCheck aria-hidden="true" size={20} />}</span>
          <div className="customer-license-card__copy">
            <span className="customer-area-eyebrow">Acesso à plataforma</span>
            <h2>{platformAccess?.active ? "Sua licença está ativa" : "Sua área está pronta"}</h2>
            <p>{platformAccess?.active
              ? `${platformAccess.accessPlan === "lifetime" ? "Acesso vitalício" : "Acesso anual"}${platformAccess.expiresAt ? ` · ativo até ${formatDate(platformAccess.expiresAt)}` : " · sem data de encerramento"}.`
              : "Você pode explorar os modelos. Escolha um plano para liberar criação, publicação e exportação premium."}</p>
          </div>
          <span className={`customer-license-card__status${platformAccess?.active ? " is-active" : ""}`}>{platformAccess?.active ? "Ativa" : "Prévia"}</span>
        </section>

        <div className="customer-dashboard__grid">
          <section className="customer-dashboard-panel customer-messages-panel">
            <div className="customer-dashboard-panel__heading">
              <div><h2>Suas mensagens</h2><p>Links e compras vinculados a esta conta.</p></div>
              <span className="customer-panel-count">{messageAccess.length}</span>
            </div>
            {messageAccess.length === 0 ? (
              <div className="customer-empty-state">
                <span><PackageOpen aria-hidden="true" size={22} /></span>
                <h3>Sua primeira mensagem começa aqui</h3>
                <p>{platformAccess?.active ? "Escolha um modelo e personalize sua mensagem." : "Explore os modelos e veja as opções para liberar os recursos premium."}</p>
                <Link className="button button--secondary" href="/templates">Ver modelos <ArrowRight aria-hidden="true" size={15} /></Link>
              </div>
            ) : (
              <div className="customer-message-list">
                {messageAccess.map((item) => {
                  const canShare = item.accessStatus === "active" && item.purchaseStatus === "paid";
                  const publicUrl = publicLinks[item.draftId];
                  return (
                    <article className="customer-message-card" key={item.draftId}>
                      <div><h3>Mensagem personalizada</h3><p>{canShare ? item.expiresAt ? `Acesso até ${formatDate(item.expiresAt)}` : "Acesso ativo" : "Acesso indisponível"}</p></div>
                      <span className={`customer-message-card__status${canShare ? " is-active" : ""}`}>{canShare ? "Ativa" : "Encerrada"}</span>
                      {canShare ? publicUrl ? (
                        <div className="customer-message-card__share"><a className="share-result__url" href={publicUrl}>{publicUrl}</a><a className="button button--secondary" href={`https://wa.me/?text=${encodeURIComponent(publicUrl)}`} rel="noreferrer" target="_blank">Compartilhar no WhatsApp</a></div>
                      ) : (
                        <button className="button button--primary" disabled={publishingDraftId === item.draftId} onClick={() => void createPublicLink(item.draftId)} type="button">{publishingDraftId === item.draftId ? "Preparando link…" : "Criar link da mensagem"}</button>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="customer-dashboard-panel customer-profile-summary">
            <div className="customer-dashboard-panel__heading">
              <div><h2>Seus dados</h2><p>Informações da conta conectada.</p></div>
              {!editingProfile ? <button className="text-button" onClick={() => setEditingProfile(true)} type="button">Editar</button> : null}
            </div>
            {user ? editingProfile ? (
              <>
                <CustomerProfileForm initialProfile={user} onSaved={(updated) => { setPortal((current) => current ? { ...current, user: updated } : current); setEditingProfile(false); }} submitLabel="Salvar alterações" />
                <button className="text-button customer-profile-summary__cancel" onClick={() => setEditingProfile(false)} type="button">Cancelar</button>
              </>
            ) : (
              <dl className="customer-profile-details">
                <div><dt>Nome</dt><dd>{user.name}</dd></div>
                <div><dt>E-mail conectado</dt><dd>{user.email}</dd></div>
                <div><dt>WhatsApp</dt><dd><Phone aria-hidden="true" size={14} />{user.whatsapp}</dd></div>
                <div><dt>Data de nascimento</dt><dd><CalendarDays aria-hidden="true" size={14} />{user.birthDate ? new Date(`${user.birthDate}T12:00:00`).toLocaleDateString("pt-BR") : "—"}</dd></div>
              </dl>
            ) : null}
          </section>
        </div>
        <p className="customer-dashboard__privacy"><ShieldCheck aria-hidden="true" size={15} /> Esta é uma área privada conectada à conta {user?.email}.</p>
      </div>
    </CustomerAreaShell>
  );
}
