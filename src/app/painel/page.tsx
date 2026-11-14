"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Check, CircleAlert, PackageOpen, Phone, ShieldCheck, UserRound } from "lucide-react";
import { CustomerAreaShell } from "@/components/customer-area-shell";
import { CustomerProfileForm } from "@/components/customer-profile-form";
import { ApiError, api } from "@/lib/api-client";
import type { AccountAccessItem, CustomerPortalSummary, MerchantLedgerOverview, MerchantRecurringOverview } from "@/lib/api-contracts";
import { formatDate, pluralLabel } from "@/lib/format-date";

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

  const loadPortal = useCallback(async (signal?: AbortSignal, isActive: () => boolean = () => true) => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getCustomerPortal({ signal: signal ?? AbortSignal.timeout(15_000) });
      if (!isActive()) return;
      if (!data.user.profileComplete) {
        router.replace("/primeiro-acesso?returnTo=%2Fpainel");
        return;
      }
      setPortal(data);
      loadCommercialOverview();
    } catch (cause) {
      if (!isActive()) return;
      if (cause instanceof ApiError && cause.status === 401) {
        router.replace("/entrar?returnTo=%2Fpainel");
      } else {
        setError(cause instanceof ApiError && cause.code === "NETWORK_ERROR"
          ? "A conexão demorou mais que o esperado. Confira a internet e tente novamente."
          : cause instanceof ApiError ? cause.message : "Não foi possível carregar sua área.");
      }
    } finally {
      if (isActive()) setLoading(false);
    }
  }, [loadCommercialOverview, router]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    const initialLoad = window.setTimeout(() => { void loadPortal(controller.signal, () => active); }, 0);
    return () => { active = false; window.clearTimeout(timeout); window.clearTimeout(initialLoad); controller.abort(); };
  }, [loadPortal]);

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
  const messageAccessByDraftId = useMemo(() => new Map(messageAccess.map((item) => [item.draftId, item])), [messageAccess]);
  const drafts = portal?.drafts ?? [];
  const needsFirstCustomer = ledgerOverview?.customerCount === 0;
  const primaryHref = needsFirstCustomer ? "/clientes" : "/cadernetas";
  const primaryLabel = needsFirstCustomer ? "Cadastrar primeiro cliente" : "Registrar uma venda";

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

  if (error && !portal) {
    return <CustomerAreaShell><section className="customer-area-load-error" role="alert"><CircleAlert aria-hidden="true" size={22} /><h1>Não foi possível abrir sua área</h1><p>{error}</p><button className="button button--primary" disabled={loading} onClick={() => void loadPortal()} type="button">{loading ? "Tentando…" : "Tentar novamente"}</button></section></CustomerAreaShell>;
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
  const dueTodayCount = (ledgerOverview?.dueToday.length ?? 0) + (recurringOverview?.dueToday.length ?? 0);

  return (
    <CustomerAreaShell access={platformAccess} email={user?.email}>
      <div className="customer-dashboard">
        <section className="customer-dashboard__intro">
          <div>
            <span className="customer-area-eyebrow"><UserRound aria-hidden="true" size={14} /> Área do cliente</span>
            <h1>Olá, {firstName}. Organize seu negócio por aqui.</h1>
            <p>O Cadernô organiza seus clientes, vendas e cobranças em um só lugar. {needsFirstCustomer ? "Comece cadastrando seu primeiro cliente." : "Registre uma venda ou acompanhe sua rotina."}</p>
          </div>
          <Link className="button button--primary" href={primaryHref}>{primaryLabel}<ArrowRight aria-hidden="true" size={17} /></Link>
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
          <div className="merchant-overview__heading"><div><span className="customer-area-eyebrow">Rotina comercial</span><h2 id="merchant-overview-title">Acompanhe seus compromissos</h2><p>Clientes, vendas e cobranças que precisam da sua atenção.</p></div><details className="merchant-overview__quick-links"><summary>Outras opções</summary><div><Link href="/clientes">Novo cliente</Link><Link href="/catalogo">Novo produto ou serviço</Link><Link href="/cadernetas">Registrar venda</Link><Link href="/cadernetas">Abrir caderneta</Link><Link href="/recorrencias">Nova recorrência</Link><Link href="/templates">Criar mensagem</Link></div></details></div>
          <div className="merchant-overview__metrics">
            <Link href="/clientes"><strong>{ledgerOverview?.customerCount ?? "—"}</strong><span>{pluralLabel(ledgerOverview?.customerCount ?? 0, "cliente", "clientes")}</span></Link>
            <Link href="/cadernetas"><strong>{ledgerOverview?.saleCount ?? "—"}</strong><span>{pluralLabel(ledgerOverview?.saleCount ?? 0, "venda registrada", "vendas registradas")}</span></Link>
            <Link href="/cadernetas"><strong>{dueTodayCount}</strong><span>{pluralLabel(dueTodayCount, "vence hoje", "vencem hoje")}</span></Link>
            <Link href="/cadernetas"><strong>{(ledgerOverview?.overdue.length ?? 0) + (recurringOverview?.overdue.length ?? 0)}</strong><span>em atraso</span></Link>
            <Link href="/recorrencias"><strong>{recurringOverview?.activePlanCount ?? "—"}</strong><span>{pluralLabel(recurringOverview?.activePlanCount ?? 0, "recorrência ativa", "recorrências ativas")}</span></Link>
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
              <div><h2>Suas mensagens</h2><p>Rascunhos salvos, links e acessos premium da sua conta.</p></div>
              <span className="customer-panel-count">{drafts.length}</span>
              <Link className="text-button" href="/mensagens">Ver mensagens salvas</Link>
            </div>
            {drafts.length === 0 ? (
              <div className="customer-empty-state">
                <span><PackageOpen aria-hidden="true" size={22} /></span>
                <h3>Sua primeira mensagem começa aqui</h3>
                <p>{platformAccess?.active ? "Escolha um modelo e personalize sua mensagem." : "Explore os modelos e veja as opções para liberar os recursos premium."}</p>
                <Link className="button button--secondary" href="/templates">Ver modelos <ArrowRight aria-hidden="true" size={15} /></Link>
              </div>
            ) : (
              <div className="customer-message-list">
                {drafts.map((draft) => {
                  const item = messageAccessByDraftId.get(draft.id);
                  const canShare = item?.accessStatus === "active" && item.purchaseStatus === "paid";
                  const publicUrl = publicLinks[draft.id];
                  return (
                    <article className="customer-message-card" key={draft.id}>
                      <div><h3>{draft.templateName}</h3><p>Salva em {formatDate(draft.updatedAt)} · {canShare ? item?.expiresAt ? `Acesso até ${formatDate(item.expiresAt)}` : "Acesso ativo" : "Rascunho salvo"}</p></div>
                      <span className={`customer-message-card__status${canShare ? " is-active" : ""}`}>{canShare ? "Ativa" : "Rascunho"}</span>
                      <Link className="button button--secondary" href={`/mensagens/${encodeURIComponent(draft.id)}`}>Editar mensagem</Link>
                      {canShare ? publicUrl ? (
                          <div className="customer-message-card__share"><a className="share-result__url" href={publicUrl}>{publicUrl}</a><a className="button button--secondary" href={`https://wa.me/?text=${encodeURIComponent(publicUrl)}`} rel="noreferrer" target="_blank">Compartilhar no WhatsApp</a></div>
                      ) : (
                        <button className="button button--primary" disabled={publishingDraftId === draft.id} onClick={() => void createPublicLink(draft.id)} type="button">{publishingDraftId === draft.id ? "Preparando link…" : "Criar link da mensagem"}</button>
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
                <div><dt>Data de nascimento</dt><dd><CalendarDays aria-hidden="true" size={14} />{user.birthDate ? formatDate(user.birthDate) : "—"}</dd></div>
              </dl>
            ) : null}
          </section>
        </div>
        <p className="customer-dashboard__privacy"><ShieldCheck aria-hidden="true" size={15} /> Esta é uma área privada conectada à conta {user?.email}.</p>
      </div>
    </CustomerAreaShell>
  );
}
