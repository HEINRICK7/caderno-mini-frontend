"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Check, CircleAlert, FilePlus2, PackageOpen, Phone, ShieldCheck, UserRound } from "lucide-react";
import { CustomerAreaShell } from "@/components/customer-area-shell";
import { CustomerProfileForm } from "@/components/customer-profile-form";
import { ApiError, api } from "@/lib/api-client";
import type { AccountAccessItem, CustomerPortalSummary, MerchantLedgerOverview, MerchantRecurringOverview } from "@/lib/api-contracts";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);
}

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [portal, setPortal] = useState<CustomerPortalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [publicLinks, setPublicLinks] = useState<Record<string, string>>({});
  const [publishingDraftId, setPublishingDraftId] = useState("");
  const [ledgerOverview, setLedgerOverview] = useState<MerchantLedgerOverview | null>(null);
  const [recurringOverview, setRecurringOverview] = useState<MerchantRecurringOverview | null>(null);

  const loadCommercialOverview = useCallback(() => {
    void Promise.all([api.getMerchantLedgerOverview(), api.getMerchantRecurringOverview()]).then(([ledger, recurring]) => {
      setLedgerOverview(ledger); setRecurringOverview(recurring);
    }).catch(() => undefined);
  }, []);

  const loadPortal = useCallback(async () => {
    try {
      const data = await api.getCustomerPortal();
      if (!data.user.profileComplete) {
        router.replace("/primeiro-acesso?returnTo=%2Fpainel");
        return;
      }
      setPortal(data);
      loadCommercialOverview();
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        router.replace("/entrar?returnTo=%2Fpainel");
      } else {
        setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar sua área.");
      }
    } finally {
      setLoading(false);
    }
  }, [loadCommercialOverview, router]);

  useEffect(() => {
    let active = true;
    void api.getCustomerPortal().then((data) => {
      if (!active) return;
      if (!data.user.profileComplete) {
        router.replace("/primeiro-acesso?returnTo=%2Fpainel");
        return;
      }
      setPortal(data);
      loadCommercialOverview();
    }).catch((cause: unknown) => {
      if (!active) return;
      if (cause instanceof ApiError && cause.status === 401) {
        router.replace("/entrar?returnTo=%2Fpainel");
      } else {
        setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar sua área.");
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [loadCommercialOverview, router]);

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
  const attentionItems = [
    ...(ledgerOverview?.overdue ?? []).map((item) => ({ name: item.customer.name, customerId: item.installment.customerId, description: item.saleItems.map((line) => line.name).join(", "), dueDate: item.installment.dueDate, amount: item.installment.balanceMinor, state: "Atrasada", sourceType: "sale_installment" as const, sourceId: item.installment.id, templateId: "parcela-atrasada" })),
    ...(ledgerOverview?.dueToday ?? []).map((item) => ({ name: item.customer.name, customerId: item.installment.customerId, description: item.saleItems.map((line) => line.name).join(", "), dueDate: item.installment.dueDate, amount: item.installment.balanceMinor, state: "Vence hoje", sourceType: "sale_installment" as const, sourceId: item.installment.id, templateId: "parcela-hoje" })),
    ...(ledgerOverview?.upcoming ?? []).map((item) => ({ name: item.customer.name, customerId: item.installment.customerId, description: item.saleItems.map((line) => line.name).join(", "), dueDate: item.installment.dueDate, amount: item.installment.balanceMinor, state: "Próximo", sourceType: "sale_installment" as const, sourceId: item.installment.id, templateId: "parcela-proxima" })),
    ...(recurringOverview?.overdue ?? []).map((item) => ({ name: item.customer.name, customerId: item.customerId, description: item.description, dueDate: item.dueDate, amount: item.balanceMinor, state: "Atrasada", sourceType: "recurring_charge" as const, sourceId: item.id, templateId: "cobranca-pix" })),
    ...(recurringOverview?.dueToday ?? []).map((item) => ({ name: item.customer.name, customerId: item.customerId, description: item.description, dueDate: item.dueDate, amount: item.balanceMinor, state: "Vence hoje", sourceType: "recurring_charge" as const, sourceId: item.id, templateId: "cobranca-pix" })),
    ...(recurringOverview?.upcoming ?? []).map((item) => ({ name: item.customer.name, customerId: item.customerId, description: item.description, dueDate: item.dueDate, amount: item.balanceMinor, state: "Próximo", sourceType: "recurring_charge" as const, sourceId: item.id, templateId: "cobranca-pix" })),
  ].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 6);

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

        {error ? <div className="customer-area-error" role="alert"><CircleAlert aria-hidden="true" size={18} />{error}<button className="text-button" onClick={() => { setLoading(true); setError(""); void loadPortal(); }} type="button">Tentar novamente</button></div> : null}

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

        <section className="merchant-overview" aria-labelledby="merchant-overview-title">
          <div className="merchant-overview__heading"><div><span className="customer-area-eyebrow">Rotina comercial</span><h2 id="merchant-overview-title">Acompanhe seus compromissos</h2><p>Clientes, vendas e cobranças que precisam da sua atenção.</p></div><div className="merchant-overview__quick-links"><Link href="/clientes">Novo cliente</Link><Link href="/catalogo">Novo produto ou serviço</Link><Link href="/cadernetas">Registrar venda</Link><Link href="/cadernetas">Abrir caderneta</Link><Link href="/recorrencias">Nova recorrência</Link><Link href="/templates">Criar mensagem</Link></div></div>
          <div className="merchant-overview__metrics">
            <Link href="/clientes"><strong>{ledgerOverview?.customerCount ?? "—"}</strong><span>clientes</span></Link>
            <Link href="/cadernetas"><strong>{ledgerOverview?.saleCount ?? "—"}</strong><span>vendas registradas</span></Link>
            <Link href="/cadernetas"><strong>{(ledgerOverview?.dueToday.length ?? 0) + (recurringOverview?.dueToday.length ?? 0)}</strong><span>vencem hoje</span></Link>
            <Link href="/cadernetas"><strong>{(ledgerOverview?.overdue.length ?? 0) + (recurringOverview?.overdue.length ?? 0)}</strong><span>em atraso</span></Link>
            <Link href="/recorrencias"><strong>{recurringOverview?.activePlanCount ?? "—"}</strong><span>recorrências ativas</span></Link>
          </div>
          <div className="merchant-overview__lists">
            <section><div><h3>Compromissos para acompanhar</h3><Link href="/cadernetas">Ver cadernetas</Link></div>{attentionItems.length ? <ul>
              {attentionItems.map((item, index) => <li key={`${item.name}-${item.dueDate}-${index}`}><span><strong>{item.name} · {item.state}</strong><small>{item.description || "Cobrança"} · {formatDate(item.dueDate)}</small></span><b>{formatAmount(item.amount)}</b><div className="merchant-overview__item-actions"><Link href={`/cadernetas?customerId=${encodeURIComponent(item.customerId)}`}>Caderneta</Link><Link href={`/templates/${item.templateId}?${item.sourceType === "sale_installment" ? "installmentId" : "recurringChargeId"}=${encodeURIComponent(item.sourceId)}`}>Criar mensagem</Link></div></li>)}
            </ul> : <p>Nenhum compromisso próximo ou atrasado.</p>}</section>
            <section><div><h3>Pagamentos registrados</h3><Link href="/cadernetas">Abrir cadernetas</Link></div>{ledgerOverview?.recentPayments.length ? <ul>{ledgerOverview.recentPayments.slice(0, 4).map((payment) => <li key={payment.id}><span><strong>{formatAmount(payment.amountMinor)}</strong><small>{payment.method === "pix" ? "Pix" : payment.method === "cash" ? "Dinheiro" : payment.method === "bank_transfer" ? "Transferência" : "Outro"} · {formatDate(payment.paidAt)}</small></span><Check aria-label="Registrado" size={16} /></li>)}</ul> : <p>Os pagamentos que você registrar aparecem aqui.</p>}</section>
          </div>
        </section>

        <div className="customer-dashboard__grid">
          <section className="customer-dashboard-panel customer-messages-panel">
            <div className="customer-dashboard-panel__heading">
              <div><h2>Suas mensagens</h2><p>Links e compras vinculados a esta conta.</p></div>
              <span className="customer-panel-count">{messageAccess.length}</span>
              <Link className="text-button" href="/mensagens">Ver mensagens salvas</Link>
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
