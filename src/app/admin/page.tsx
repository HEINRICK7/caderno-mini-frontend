"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, ShieldCheck, UserRound, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ApiError, api } from "@/lib/api-client";
import type { AdminUserDetail, AdminUserSummary } from "@/lib/api-contracts";

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { dateStyle: "medium" });
}

function purchaseStatusLabel(status: string) {
  return ({
    pending: "Aguardando pagamento",
    paid: "Paga",
    refunded: "Reembolsada",
    chargedback: "Contestada",
    canceled: "Cancelada",
    refused: "Recusada",
  } as Record<string, string>)[status] ?? status;
}

export default function AdminPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async (requestedOffset = 0, append = false) => {
    try {
      const result = await api.getAdminUsers(search, requestedOffset);
      setUsers((current) => append ? [...current, ...result.users] : result.users);
      setTotal(result.total);
      setOffset(requestedOffset + result.users.length);
      setForbidden(false);
      if (!append) setSelectedId((current) => result.users.some((user) => user.id === current) ? current : result.users[0]?.id ?? "");
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        router.replace("/entrar?returnTo=%2Fadmin");
        return;
      }
      if (cause instanceof ApiError && cause.status === 403) {
        setForbidden(true);
      } else {
        setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar os clientes.");
      }
    } finally {
      setLoading(false);
    }
  }, [router, search]);

  useEffect(() => {
    let active = true;
    void api.getAdminUsers(search).then((result) => {
      if (!active) return;
      setUsers(result.users);
      setTotal(result.total);
      setOffset(result.users.length);
      setForbidden(false);
      setError("");
      setSelectedId((current) => result.users.some((user) => user.id === current) ? current : result.users[0]?.id ?? "");
    }).catch((cause: unknown) => {
      if (!active) return;
      if (cause instanceof ApiError && cause.status === 401) {
        router.replace("/entrar?returnTo=%2Fadmin");
      } else if (cause instanceof ApiError && cause.status === 403) {
        setForbidden(true);
      } else {
        setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar os clientes.");
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [router, search]);

  useEffect(() => {
    if (!selectedId || forbidden) return;
    let active = true;
    void api.getAdminUser(selectedId).then((userDetail) => {
      if (active) setDetail(userDetail);
    }).catch((cause: unknown) => {
      if (!active) return;
      if (cause instanceof ApiError && cause.status === 401) {
        router.replace("/entrar?returnTo=%2Fadmin");
      } else {
        setError(cause instanceof ApiError ? cause.message : "Não foi possível abrir os dados deste cliente.");
      }
    });
    return () => { active = false; };
  }, [forbidden, router, selectedId]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSearch(query.trim());
    setOffset(0);
  }

  async function loadMoreUsers() {
    setLoading(true);
    setError("");
    await loadUsers(offset, true);
  }

  async function toggleAccountStatus() {
    if (!detail) return;
    const nextStatus = detail.user.accountStatus === "active" ? "suspended" : "active";
    if (nextStatus === "suspended" && !window.confirm(`Suspender ${detail.user.email}? As sessões ativas serão encerradas e a conta não poderá entrar até ser reativada.`)) return;
    setSavingStatus(true);
    setLoading(true);
    setError("");
    try {
      await api.setAdminUserStatus(detail.user.id, nextStatus);
      await loadUsers();
      setDetail(await api.getAdminUser(detail.user.id));
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        router.replace("/entrar?returnTo=%2Fadmin");
      } else {
        setError(cause instanceof ApiError ? cause.message : "Não foi possível alterar o estado da conta.");
      }
    } finally {
      setSavingStatus(false);
    }
  }

  return (
    <main className="subpage-shell">
      <SiteHeader />
      <section className="subpage-content admin-content">
        <div className="page-heading page-heading--stacked admin-heading">
          <span className="admin-eyebrow"><ShieldCheck aria-hidden="true" size={15} /> Painel do criador</span>
          <h1>Clientes e acesso</h1>
          <p>Consulte contas, compras e sessões. A Cakto continua sendo a autoridade sobre pagamentos e licenças.</p>
        </div>

        {forbidden ? (
          <div className="account-empty admin-forbidden">
            <h2>Esta conta não tem acesso de administração</h2>
            <p>Entre com o e-mail do criador cadastrado no servidor em <code>SUPERADMIN_EMAILS</code>.</p>
            <Link className="button button--secondary" href="/conta">Voltar para Minha conta</Link>
          </div>
        ) : null}

        {!forbidden ? (
          <>
            <section aria-label="Testar experiência do cliente" className="admin-test-panel">
              <div className="admin-test-panel__copy">
                <span className="admin-eyebrow"><ShieldCheck aria-hidden="true" size={15} /> Experiência do cliente</span>
                <h2>Teste os modelos e links grátis</h2>
                <p>Abra um modelo, personalize a mensagem e gere um link de teste. Para validar uma compra paga, use uma venda de teste configurada na Cakto; este painel nunca cria licença fictícia.</p>
              </div>
              <div className="admin-test-panel__actions">
                <Link className="button button--primary" href="/templates">Testar os 16 modelos <ArrowRight aria-hidden="true" size={16} /></Link>
                <Link className="button button--secondary" href="/conta">Ver minha conta</Link>
              </div>
            </section>

            <div className="admin-metrics" aria-label="Resumo de contas">
              <article><Users aria-hidden="true" size={18} /><strong>{loading ? "—" : total}</strong><span>clientes encontrados</span></article>
              <article><ShieldCheck aria-hidden="true" size={18} /><strong>{users.filter((user) => user.accountStatus === "active").length}</strong><span>ativos nesta página</span></article>
              <article><UserRound aria-hidden="true" size={18} /><strong>{users.reduce((sum, user) => sum + user.activeLicenses, 0)}</strong><span>licenças ativas nesta página</span></article>
            </div>

            {error ? <div className="page-message page-message--error" role="alert"><p>{error}</p><button className="text-button" onClick={() => { setLoading(true); setError(""); void loadUsers(); }} type="button">Tentar novamente</button></div> : null}

            <div className="admin-workspace">
              <section className="admin-user-list" aria-label="Clientes">
                <form className="admin-search" onSubmit={submitSearch}>
                  <label className="visually-hidden" htmlFor="admin-search">Buscar por e-mail</label>
                  <Search aria-hidden="true" size={17} />
                  <input id="admin-search" minLength={2} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por e-mail" type="search" value={query} />
                  <button className="button button--secondary" type="submit">Buscar</button>
                </form>
                {loading ? <p className="page-message" role="status">Carregando clientes…</p> : null}
                {!loading && users.length === 0 ? <p className="admin-empty">Nenhum cliente encontrado.</p> : null}
                {users.map((user) => (
                  <button
                    aria-current={selectedId === user.id ? "true" : undefined}
                    className={`admin-user-row${selectedId === user.id ? " is-selected" : ""}`}
                    key={user.id}
                    onClick={() => setSelectedId(user.id)}
                    type="button"
                  >
                    <span className="admin-user-row__avatar"><UserRound aria-hidden="true" size={17} /></span>
                    <span className="admin-user-row__identity"><strong>{user.email}</strong><small>{user.purchaseCount} compras · {user.activeLicenses} licenças ativas</small></span>
                    <span className={`admin-status admin-status--${user.accountStatus}`}>{user.accountStatus === "active" ? "Ativa" : "Suspensa"}</span>
                  </button>
                ))}
                {!loading && offset < total ? <button className="button button--secondary admin-load-more" onClick={() => void loadMoreUsers()} type="button">Carregar mais clientes</button> : null}
              </section>

              <section className="admin-user-detail" aria-label="Detalhes do cliente" aria-live="polite">
                {selectedId && detail?.user.id !== selectedId ? <p className="page-message" role="status">Carregando conta…</p> : null}
                {!selectedId && !loading ? <p className="admin-empty">Selecione um cliente para ver os detalhes.</p> : null}
                {detail && detail.user.id === selectedId ? (
                  <>
                    <div className="admin-detail-heading">
                      <div><span className="admin-eyebrow">Conta do cliente</span><h2>{detail.user.email}</h2><p>Cliente desde {dateLabel(detail.user.createdAt)}</p></div>
                      <span className={`admin-status admin-status--${detail.user.accountStatus}`}>{detail.user.accountStatus === "active" ? "Ativa" : "Suspensa"}</span>
                    </div>
                    <div className="admin-detail-stats">
                      <div><strong>{detail.user.activeSessions}</strong><span>sessões ativas</span></div>
                      <div><strong>{detail.user.purchaseCount}</strong><span>compras registradas</span></div>
                      <div><strong>{detail.user.activeLicenses}</strong><span>licenças ativas</span></div>
                      <div><strong>{detail.user.draftCount}</strong><span>mensagens salvas</span></div>
                    </div>
                    <div className="admin-detail-section">
                      <h3>Compras e licenças</h3>
                      {detail.purchases.length ? detail.purchases.map((purchase) => (
                        <article className="admin-purchase-row" key={purchase.purchaseId}>
                          <div><strong>{purchase.templateId}</strong><small>Pedido {purchase.purchaseId.slice(0, 8)} · {dateLabel(purchase.createdAt)}</small></div>
                          <div className="admin-purchase-row__status"><span>{purchaseStatusLabel(purchase.purchaseStatus)}</span><small>{purchase.accessStatus === "active" && purchase.purchaseStatus === "paid" ? "Acesso ativo" : purchase.accessStatus === "revoked" ? "Acesso revogado" : "Sem acesso ativo"}</small></div>
                        </article>
                      )) : <p className="admin-empty">Ainda não há compras vinculadas a esta conta.</p>}
                    </div>
                    <div className="admin-account-actions">
                      <div><h3>Gerenciar conta</h3><p>{detail.user.accountStatus === "active" ? "Suspender encerra as sessões e impede novos acessos até a reativação." : "Reativar permite que o cliente entre novamente com um link enviado ao próprio e-mail."}</p></div>
                      <button className={detail.user.accountStatus === "active" ? "button button--danger" : "button button--primary"} disabled={savingStatus} onClick={() => void toggleAccountStatus()} type="button">
                        {savingStatus ? "Salvando…" : detail.user.accountStatus === "active" ? "Suspender conta" : "Reativar conta"}
                      </button>
                    </div>
                    {detail.recentActions.length ? <div className="admin-detail-section admin-audit"><h3>Histórico administrativo</h3>{detail.recentActions.map((action, index) => <p key={`${action.createdAt}-${index}`}>{action.action === "account_suspended" ? "Conta suspensa" : "Conta reativada"} por {action.actorEmail} · {dateLabel(action.createdAt)}</p>)}</div> : null}
                  </>
                ) : null}
              </section>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
