"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowRight, ArrowUpRight, CircleAlert, LayoutDashboard, Layers3, LoaderCircle, LogOut, Search, ShieldCheck, UserPlus, UserRound, Users, type LucideIcon } from "lucide-react";
import { AdminHeader } from "@/components/admin-header";
import { AdminTemplateManager } from "@/components/admin-template-manager";
import { BrandMark } from "@/components/brand-mark";
import { ApiError, api } from "@/lib/api-client";
import type { AdminUserDetail, AdminUserSummary } from "@/lib/api-contracts";

type AdminSection = "overview" | "customers" | "templates";

const adminNavigation: { id: AdminSection; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "customers", label: "Clientes", icon: Users },
  { id: "templates", label: "Modelos", icon: Layers3 },
];

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

function planLabel(plan: "annual" | "lifetime" | null) {
  if (plan === "annual") return "Anual · 12 meses";
  if (plan === "lifetime") return "Vitalício";
  return "Plano não informado";
}

function paymentMethodLabel(method: "pix" | "bank_transfer" | "cash" | "other" | null) {
  return ({
    pix: "Pix direto",
    bank_transfer: "Transferência/depósito",
    cash: "Dinheiro",
    other: "Outro meio",
  } as const)[method ?? "other"];
}

function amountLabel(amountMinor: number | null, currency: string | null) {
  if (amountMinor === null) return "Valor não informado";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency ?? "BRL",
  }).format(amountMinor / 100);
}

function parseAmountMinor(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(amount) && amount > 0 && amount <= 100_000_000 ? amount : null;
}

function adminErrorMessage(cause: unknown, fallback: string) {
  if (!(cause instanceof ApiError)) return fallback;
  if (cause.status >= 500) return `${fallback} O servidor retornou erro ${cause.status}. Tente novamente.`;
  return cause.message;
}

function AdminLogin({ onAuthenticated }: { onAuthenticated: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      onAuthenticated(await api.signInAdmin(email, password));
      setPassword("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível entrar no painel.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="subpage-shell">
      <AdminHeader />
      <section className="subpage-content admin-auth-content">
        <div className="admin-auth-layout">
          <header className="admin-auth-intro">
            <span className="admin-eyebrow"><ShieldCheck aria-hidden="true" size={15} /> Área administrativa</span>
            <h1>Seu espaço de gestão.</h1>
            <p>Acompanhe clientes e publique os modelos do Cadernô Express em um painel protegido.</p>
            <div className="admin-auth-note"><ShieldCheck aria-hidden="true" size={17} /><span>Esta entrada é exclusiva para quem administra o Cadernô. Clientes acessam seus cartões pela Minha conta.</span></div>
          </header>
          <section aria-labelledby="admin-login-title" className="admin-auth-card">
            <div className="admin-auth-card__icon"><ShieldCheck aria-hidden="true" size={20} /></div>
            <h2 id="admin-login-title">Entrar no painel</h2>
            <p>Use suas credenciais administrativas para continuar.</p>
            <form className="template-form admin-login-form" onSubmit={submit}>
              <div className="form-field">
                <label htmlFor="admin-email">E-mail do administrador</label>
                <input autoComplete="username" id="admin-email" name="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div className="form-field">
                <label htmlFor="admin-password">Senha</label>
                <input autoComplete="current-password" id="admin-password" minLength={12} name="password" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <button className="button button--primary form-submit" disabled={submitting} type="submit">
                {submitting ? "Entrando…" : "Entrar como administrador"}
              </button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}

function AdminManualSaleForm({
  userId,
  onRecorded,
  onUnauthorized,
}: {
  userId: string;
  onRecorded: () => void;
  onUnauthorized: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [plan, setPlan] = useState<"annual" | "lifetime">("annual");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "bank_transfer" | "cash" | "other">("pix");
  const [paymentReference, setPaymentReference] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const amountMinor = parseAmountMinor(amount);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (amountMinor === null || !confirmed) return;
    setSaving(true);
    setError("");
    try {
      await api.registerAdminPlatformSale({
        userId,
        plan,
        amountMinor,
        paymentMethod,
        ...(paymentReference.trim() ? { paymentReference: paymentReference.trim() } : {}),
      });
      setSaved(true);
      setConfirmed(false);
      onRecorded();
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        onUnauthorized();
      } else {
        setError(adminErrorMessage(cause, "Não foi possível registrar a venda manual."));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="admin-manual-sale-title" className="admin-manual-sale">
      <div className="admin-manual-sale__heading">
        <div>
          <h3 id="admin-manual-sale-title">Venda direta · liberar acesso à plataforma</h3>
          <p>Registre o pagamento recebido e ative a licença para esta conta. Não precisa escolher uma mensagem.</p>
        </div>
        <button className="button button--secondary" onClick={() => { setSaved(false); setError(""); setOpen((value) => !value); }} type="button">
          {open ? "Fechar" : "Liberar acesso"}
        </button>
      </div>
      {saved ? <p className="page-message admin-manual-sale__saved" role="status">Venda registrada. A licença da plataforma está ativa. O cliente precisa abrir o link enviado ao e-mail para entrar.</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {open ? (
        <form className="template-form admin-manual-sale-form" onSubmit={(event) => void submit(event)}>
          <div className="form-field">
            <label htmlFor="admin-sale-plan">Plano</label>
            <select id="admin-sale-plan" onChange={(event) => setPlan(event.target.value as "annual" | "lifetime")} value={plan}>
              <option value="annual">Plataforma anual · 12 meses</option>
              <option value="lifetime">Plataforma vitalícia</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="admin-sale-amount">Valor recebido (R$)</label>
            <input autoComplete="off" id="admin-sale-amount" inputMode="decimal" onChange={(event) => setAmount(event.target.value)} placeholder="Ex.: 49,90" required type="text" value={amount} />
            {amount && amountMinor === null ? <small className="form-field__error">Informe um valor válido, com até duas casas decimais.</small> : null}
          </div>
          <div className="form-field">
            <label htmlFor="admin-sale-method">Forma de pagamento</label>
            <select id="admin-sale-method" onChange={(event) => setPaymentMethod(event.target.value as typeof paymentMethod)} value={paymentMethod}>
              <option value="pix">Pix direto</option>
              <option value="bank_transfer">Transferência ou depósito</option>
              <option value="cash">Dinheiro</option>
              <option value="other">Outro meio</option>
            </select>
          </div>
          <div className="form-field admin-manual-sale-form__reference">
            <label htmlFor="admin-sale-reference">Referência do pagamento <span>(opcional)</span></label>
            <input autoComplete="off" id="admin-sale-reference" maxLength={160} onChange={(event) => setPaymentReference(event.target.value)} placeholder="ID da transação ou observação curta" type="text" value={paymentReference} />
          </div>
          <label className="admin-manual-sale-form__confirmation">
            <input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" />
            <span>Confirmo que recebi o pagamento. Isso libera os recursos premium para a conta deste cliente.</span>
          </label>
          <div className="admin-manual-sale-form__actions">
            <button className="button button--primary" disabled={saving || !amountMinor || !confirmed} type="submit">
              {saving ? "Registrando…" : "Registrar venda e liberar plataforma"}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function AdminCustomerAccessLink({ userId, accountStatus, activeSessions, onUnauthorized }: {
  userId: string;
  accountStatus: AdminUserDetail["user"]["accountStatus"];
  activeSessions: number;
  onUnauthorized: () => void;
}) {
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function sendLink() {
    setSending(true);
    setNotice("");
    setError("");
    try {
      setNotice(await api.sendAdminCustomerAccessLink(userId));
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) onUnauthorized();
      else setError(adminErrorMessage(cause, "Não foi possível enviar o link de entrada."));
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="admin-customer-login" aria-label="Entrada do cliente">
      <div>
        <h3>{activeSessions > 0 ? "Cliente com sessão ativa" : "Aguardando o primeiro acesso do cliente"}</h3>
        <p>{activeSessions > 0 ? `${activeSessions} sessão(ões) ativa(s).` : "Cadastrar a conta não conecta o cliente automaticamente. Ele precisa abrir o link enviado ao e-mail para entrar."}</p>
        {notice ? <p className="admin-customer-login__notice" role="status">{notice}</p> : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
      </div>
      <button className="button button--secondary" disabled={sending || accountStatus !== "active"} onClick={() => void sendLink()} type="button">
        {sending ? "Enviando…" : "Enviar link de entrada"}
      </button>
    </section>
  );
}

export default function AdminPage() {
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionCheck, setSessionCheck] = useState(0);
  const handleUnauthorized = useCallback(() => setAdminEmail(null), []);

  useEffect(() => {
    let active = true;
    void api.getAdminSession().then((email) => {
      if (active) {
        setAdminEmail(email);
        setSessionError(null);
      }
    }).catch((cause: unknown) => {
      if (!active) return;
      if (cause instanceof ApiError && cause.status === 401) {
        setAdminEmail(null);
        setSessionError(null);
      } else {
        setSessionError(cause instanceof ApiError ? cause.message : "Não foi possível verificar sua sessão.");
      }
    }).finally(() => {
      if (active) setCheckingSession(false);
    });
    return () => { active = false; };
  }, [sessionCheck]);

  if (checkingSession) {
    return (
      <main className="subpage-shell">
        <AdminHeader />
        <section className="subpage-content subpage-content--narrow admin-auth-content">
          <div className="admin-checking" role="status">
            <span className="admin-checking__icon"><LoaderCircle aria-hidden="true" size={22} /></span>
            <div><span className="admin-eyebrow">Acesso protegido</span><h1>Verificando seu acesso</h1><p>Estamos confirmando sua sessão administrativa.</p></div>
          </div>
        </section>
      </main>
    );
  }

  if (sessionError) {
    return (
      <main className="subpage-shell">
        <AdminHeader />
        <section className="subpage-content subpage-content--narrow admin-auth-content">
          <div className="admin-session-error" role="alert">
            <span className="admin-session-error__icon"><CircleAlert aria-hidden="true" size={23} /></span>
            <div className="admin-session-error__copy"><span className="admin-eyebrow">Acesso administrativo</span><h1>Não foi possível abrir o painel.</h1><p>{sessionError}</p></div>
            <button className="button button--secondary" onClick={() => {
              setCheckingSession(true);
              setSessionCheck((current) => current + 1);
            }} type="button">Tentar novamente</button>
          </div>
        </section>
      </main>
    );
  }

  if (!adminEmail) return <AdminLogin onAuthenticated={setAdminEmail} />;
  return <AdminDashboard adminEmail={adminEmail} onUnauthorized={handleUnauthorized} />;
}

function AdminDashboard({ adminEmail, onUnauthorized }: { adminEmail: string; onUnauthorized: () => void }) {
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [searchVersion, setSearchVersion] = useState(0);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [signOutError, setSignOutError] = useState("");
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [createCustomerEmail, setCreateCustomerEmail] = useState("");
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [createCustomerError, setCreateCustomerError] = useState("");
  const [createCustomerNotice, setCreateCustomerNotice] = useState<{ email: string; accessLinkSent: boolean } | null>(null);

  const loadUsers = useCallback(async (requestedOffset = 0, append = false) => {
    try {
      const result = await api.getAdminUsers(search, requestedOffset);
      setUsers((current) => append ? [...current, ...result.users] : result.users);
      setTotal(result.total);
      setOffset(requestedOffset + result.users.length);
      if (!append) setSelectedId((current) => result.users.some((user) => user.id === current) ? current : result.users[0]?.id ?? "");
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        onUnauthorized();
        return;
      }
      setError(adminErrorMessage(cause, "Não foi possível carregar os clientes."));
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized, search]);

  useEffect(() => {
    if (activeSection !== "customers") return;
    let active = true;
    void api.getAdminUsers(search).then((result) => {
      if (!active) return;
      setUsers(result.users);
      setTotal(result.total);
      setOffset(result.users.length);
      setError("");
      setSelectedId((current) => result.users.some((user) => user.id === current) ? current : result.users[0]?.id ?? "");
    }).catch((cause: unknown) => {
      if (!active) return;
      if (cause instanceof ApiError && cause.status === 401) {
        onUnauthorized();
      } else {
        setError(adminErrorMessage(cause, "Não foi possível carregar os clientes."));
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [activeSection, onUnauthorized, search, searchVersion]);

  useEffect(() => {
    if (activeSection !== "customers" || !selectedId) return;
    let active = true;
    void api.getAdminUser(selectedId).then((userDetail) => {
      if (active) setDetail(userDetail);
    }).catch((cause: unknown) => {
      if (!active) return;
      if (cause instanceof ApiError && cause.status === 401) {
        onUnauthorized();
      } else {
        setError(adminErrorMessage(cause, "Não foi possível abrir os dados deste cliente."));
      }
    });
    return () => { active = false; };
  }, [activeSection, onUnauthorized, selectedId]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setUsers([]);
    setTotal(0);
    setOffset(0);
    setSelectedId("");
    setDetail(null);
    setSearch(query.trim());
    setSearchVersion((current) => current + 1);
  }

  async function submitCreateCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingCustomer(true);
    setCreateCustomerError("");
    try {
      const created = await api.createAdminCustomer(createCustomerEmail.trim());
      setCreateCustomerNotice({ email: created.user.email, accessLinkSent: created.accessLinkSent });
      setCreateCustomerOpen(false);
      setCreateCustomerEmail("");
      setQuery(created.user.email);
      setSearch(created.user.email);
      setSearchVersion((current) => current + 1);
      setSelectedId(created.user.id);
      setDetail(null);
      setUsers([]);
      setTotal(0);
      setOffset(0);
      setLoading(true);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        onUnauthorized();
      } else {
        setCreateCustomerError(adminErrorMessage(cause, "Não foi possível cadastrar o cliente."));
      }
    } finally {
      setCreatingCustomer(false);
    }
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
        onUnauthorized();
      } else {
        setError(adminErrorMessage(cause, "Não foi possível alterar o estado da conta."));
      }
    } finally {
      setSavingStatus(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    setSignOutError("");
    try {
      await api.signOutAdmin();
      onUnauthorized();
    } catch (cause) {
      setSignOutError(adminErrorMessage(cause, "Não foi possível encerrar a sessão."));
    } finally {
      setSigningOut(false);
    }
  }

  async function refreshSelectedCustomer() {
    if (!selectedId) return;
    try {
      const refreshedDetail = await api.getAdminUser(selectedId);
      setDetail(refreshedDetail);
      const refreshedUsers = await api.getAdminUsers(search);
      setUsers(refreshedUsers.users);
      setTotal(refreshedUsers.total);
      setOffset(refreshedUsers.users.length);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        onUnauthorized();
      } else {
        setError(adminErrorMessage(cause, "A venda foi registrada, mas não foi possível atualizar os dados do cliente."));
      }
    }
  }

  function goToSection(section: AdminSection) {
    setError("");
    if (section === activeSection) return;
    if (section === "customers") setLoading(true);
    setActiveSection(section);
  }

  const sectionContent: Record<AdminSection, { title: string; description: string }> = {
    overview: { title: "Visão geral", description: "Escolha uma área para continuar a gestão do Cadernô Express." },
    customers: { title: "Clientes", description: "Cadastre clientes, encontre suas contas e registre pagamentos feitos diretamente." },
    templates: { title: "Modelos", description: "Crie rascunhos, confira a prévia e publique versões do catálogo." },
  };

  return (
    <main className="admin-console">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <BrandMark ariaLabel="Cadernô Express — painel administrativo" href="/admin" />
        </div>

        <span className="admin-sidebar__label">Painel do criador</span>
        <nav aria-label="Seções administrativas" className="admin-sidebar__nav">
          {adminNavigation.map(({ id, label, icon: Icon }) => (
            <button
              aria-current={activeSection === id ? "page" : undefined}
              className={`admin-sidebar__nav-item${activeSection === id ? " is-active" : ""}`}
              key={id}
              onClick={() => goToSection(id)}
              type="button"
            >
              <Icon aria-hidden="true" size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar__utility">
          <span className="admin-sidebar__label">Experiência do cliente</span>
          <Link className="admin-sidebar__link" href="/templates">Abrir catálogo <ArrowUpRight aria-hidden="true" size={15} /></Link>
          <Link className="admin-sidebar__link" href="/conta">Minha conta <ArrowUpRight aria-hidden="true" size={15} /></Link>
        </div>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__identity">
            <span className="admin-sidebar__identity-icon"><ShieldCheck aria-hidden="true" size={17} /></span>
            <span><strong>Administrador</strong><small>{adminEmail}</small></span>
          </div>
          <button className="admin-sidebar__logout" disabled={signingOut} onClick={() => void signOut()} type="button">
            <LogOut aria-hidden="true" size={16} /> {signingOut ? "Encerrando…" : "Encerrar sessão"}
          </button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-main__header">
          <span className="admin-main__context"><ShieldCheck aria-hidden="true" size={15} /> Área administrativa</span>
          <h1>{sectionContent[activeSection].title}</h1>
          <p>{sectionContent[activeSection].description}</p>
        </header>

        {signOutError ? <div className="page-message page-message--error admin-global-error" role="alert"><p>{signOutError}</p></div> : null}

        {activeSection === "overview" ? (
          <div className="admin-overview">
            <div aria-label="Áreas do painel" className="admin-overview__cards">
              <button className="admin-overview-card" onClick={() => goToSection("customers")} type="button">
                <span className="admin-overview-card__icon"><Users aria-hidden="true" size={20} /></span>
                <span className="admin-overview-card__copy"><strong>Clientes</strong><small>Contas, compras, licenças e sessões</small></span>
                <ArrowRight aria-hidden="true" className="admin-overview-card__arrow" size={18} />
              </button>
              <button className="admin-overview-card" onClick={() => goToSection("templates")} type="button">
                <span className="admin-overview-card__icon"><Layers3 aria-hidden="true" size={20} /></span>
                <span className="admin-overview-card__copy"><strong>Modelos</strong><small>Rascunhos, prévias e publicação do catálogo</small></span>
                <ArrowRight aria-hidden="true" className="admin-overview-card__arrow" size={18} />
              </button>
            </div>

            <section aria-label="Testar experiência do cliente" className="admin-test-panel">
              <div className="admin-test-panel__copy">
                <span className="admin-eyebrow"><ShieldCheck aria-hidden="true" size={15} /> Acesso de teste</span>
                <h2>Veja o produto como cliente</h2>
                <p>Sua sessão administrativa permite criar e exportar mensagens sem uma compra. Esse uso não registra vendas nem cria licenças.</p>
              </div>
              <div className="admin-test-panel__actions">
                <Link className="button button--primary" href="/templates">Abrir catálogo <ArrowRight aria-hidden="true" size={16} /></Link>
                <Link className="button button--secondary" href="/conta">Ver minha conta</Link>
              </div>
            </section>
          </div>
        ) : null}

        {activeSection === "templates" ? (
          <section aria-label="Gerenciar modelos" className="admin-section">
            <AdminTemplateManager onUnauthorized={onUnauthorized} />
          </section>
        ) : null}

        {activeSection === "customers" ? (
          <section aria-label="Gerenciar clientes" className="admin-section admin-customer-section">
            {error ? <div className="page-message page-message--error admin-global-error" role="alert"><p>{error}</p><button className="text-button" onClick={() => { setLoading(true); setError(""); void loadUsers(); }} type="button">Tentar novamente</button></div> : null}
            <div className="admin-customer-toolbar">
              <div><h2>Como liberar o acesso do cliente</h2><p>Selecione uma conta na lista, registre o pagamento que você já recebeu e libere a plataforma. O cliente entra pelo link enviado ao e-mail.</p></div>
              <button className="button button--primary" onClick={() => { setCreateCustomerError(""); setCreateCustomerNotice(null); setCreateCustomerOpen((open) => !open); }} type="button">
                <UserPlus aria-hidden="true" size={17} /> {createCustomerOpen ? "Fechar cadastro" : "Cadastrar cliente"}
              </button>
            </div>
            {createCustomerNotice ? (
              <div className="admin-customer-notice" role="status">
                <div>
                  <strong>Cliente cadastrado: {createCustomerNotice.email}</strong>
                  <p>{createCustomerNotice.accessLinkSent ? "O servidor de e-mail aceitou o link de entrada, mas isso não confirma a entrega. Peça ao cliente verificar a caixa de entrada, Spam e Promoções. Depois de confirmar o pagamento, selecione a conta e registre a venda para liberar o acesso." : "A conta foi criada, mas o servidor de e-mail não aceitou o envio. Selecione a conta e tente enviar o link novamente; depois de confirmar o pagamento, registre a venda."}</p>
                </div>
                <button aria-label="Fechar aviso" className="text-button" onClick={() => setCreateCustomerNotice(null)} type="button">Fechar</button>
              </div>
            ) : null}
            {createCustomerOpen ? (
              <form className="admin-create-customer" onSubmit={(event) => void submitCreateCustomer(event)}>
                <div className="form-field">
                  <label htmlFor="admin-customer-email">E-mail do cliente</label>
                  <input autoComplete="email" id="admin-customer-email" maxLength={254} onChange={(event) => setCreateCustomerEmail(event.target.value)} placeholder="cliente@exemplo.com" required type="email" value={createCustomerEmail} />
            <small>Vamos criar a conta e enviar ao cliente o link para entrar no Cadernô.</small>
                </div>
                {createCustomerError ? <p className="form-error" role="alert">{createCustomerError}</p> : null}
                <button className="button button--primary" disabled={creatingCustomer} type="submit">{creatingCustomer ? "Cadastrando…" : "Cadastrar e enviar acesso"}</button>
              </form>
            ) : null}
            <div className="admin-metrics" aria-label="Resumo de contas">
              <article><Users aria-hidden="true" size={18} /><strong>{loading ? "—" : total}</strong><span>clientes na busca</span></article>
              <article><ShieldCheck aria-hidden="true" size={18} /><strong>{users.filter((user) => user.accountStatus === "active").length}</strong><span>ativos na lista</span></article>
              <article><UserRound aria-hidden="true" size={18} /><strong>{users.reduce((sum, user) => sum + user.activeLicenses, 0)}</strong><span>licenças ativas na lista</span></article>
            </div>

            <div className="admin-workspace">
              <section className="admin-user-list" aria-label="Clientes">
                <form className="admin-search" onSubmit={submitSearch}>
                  <label className="visually-hidden" htmlFor="admin-search">Buscar por e-mail</label>
                  <Search aria-hidden="true" size={17} />
                  <input id="admin-search" minLength={2} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por e-mail" type="search" value={query} />
                  <button className="button button--secondary" type="submit">Buscar</button>
                </form>
                {loading ? <p className="page-message" role="status">Carregando clientes…</p> : null}
                {!loading && users.length === 0 ? <p className="admin-empty">{search ? "Nenhum cliente encontrado com esse e-mail. Use Cadastrar cliente para criar uma conta." : "Ainda não há clientes. Use Cadastrar cliente para começar."}</p> : null}
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
                    <AdminCustomerAccessLink
                      accountStatus={detail.user.accountStatus}
                      activeSessions={detail.user.activeSessions}
                      onUnauthorized={onUnauthorized}
                      userId={detail.user.id}
                    />
                    <div className="admin-detail-section admin-customer-profile">
                      <h3>Perfil do cliente</h3>
                      {detail.user.name ? (
                        <dl>
                          <div><dt>Nome</dt><dd>{detail.user.name}</dd></div>
                          <div><dt>WhatsApp</dt><dd>{detail.user.whatsapp}</dd></div>
                          <div><dt>Data de nascimento</dt><dd>{detail.user.birthDate ? dateLabel(`${detail.user.birthDate}T12:00:00.000Z`) : "—"}</dd></div>
                        </dl>
                      ) : <p className="admin-empty">O cliente ainda não concluiu o primeiro acesso.</p>}
                    </div>
                    <div className="admin-detail-stats">
                      <div><strong>{detail.user.activeSessions}</strong><span>sessões ativas</span></div>
                      <div><strong>{detail.user.purchaseCount}</strong><span>compras registradas</span></div>
                      <div><strong>{detail.user.activeLicenses}</strong><span>licenças ativas</span></div>
                      <div><strong>{detail.user.draftCount}</strong><span>mensagens salvas</span></div>
                    </div>
                    <div className="admin-detail-section">
                      <h3>Compras e licenças</h3>
                      {detail.purchases.length ? detail.purchases.map((purchase) => {
                        const details = [
                          purchase.saleSource === "manual" ? paymentMethodLabel(purchase.paymentMethod) : "Checkout online",
                          purchase.accessPlan ? planLabel(purchase.accessPlan) : null,
                          amountLabel(purchase.amountMinor, purchase.currency),
                          purchase.paymentReference ? `Ref. ${purchase.paymentReference}` : null,
                        ].filter(Boolean).join(" · ");
                        return (
                          <article className="admin-purchase-row" key={purchase.purchaseId}>
                            <div>
                              <strong>{purchase.templateName}</strong>
                              <small>Pedido {purchase.purchaseId.slice(0, 8)} · {dateLabel(purchase.createdAt)}</small>
                              <small>{details}</small>
                            </div>
                            <div className="admin-purchase-row__status"><span>{purchaseStatusLabel(purchase.purchaseStatus)}</span><small>{purchase.accessStatus === "active" && purchase.purchaseStatus === "paid" ? "Acesso ativo" : purchase.accessStatus === "revoked" ? "Acesso revogado" : "Sem acesso ativo"}</small></div>
                          </article>
                        );
                      }) : <p className="admin-empty">Ainda não há compras vinculadas a esta conta.</p>}
                    </div>
                    <div className="admin-detail-section admin-platform-sales">
                      <h3>Licença da plataforma</h3>
                      {detail.platformSales.length ? detail.platformSales.map((sale) => (
                        <article className="admin-purchase-row" key={sale.saleId}>
                          <div>
                            <strong>{sale.accessPlan === "annual" ? "Acesso anual · 12 meses" : "Acesso vitalício"}</strong>
                            <small>{amountLabel(sale.amountMinor, sale.currency)} · {paymentMethodLabel(sale.paymentMethod)} · {dateLabel(sale.createdAt)}</small>
                            <small>{sale.accessStatus === "active" ? sale.expiresAt ? `Ativo até ${dateLabel(sale.expiresAt)}` : "Acesso ativo sem expiração" : sale.accessStatus === "expired" ? "Acesso expirado" : "Acesso revogado"}{sale.paymentReference ? ` · Ref. ${sale.paymentReference}` : ""}</small>
                          </div>
                          <span className={`admin-status admin-status--${sale.accessStatus === "active" ? "active" : "suspended"}`}>{sale.accessStatus === "active" ? "Ativa" : sale.accessStatus === "expired" ? "Expirada" : "Revogada"}</span>
                        </article>
                      )) : <p className="admin-empty">Esta conta ainda não tem acesso premium. Registre uma venda abaixo para liberar a plataforma toda.</p>}
                    </div>
                    <AdminManualSaleForm
                      key={selectedId}
                      onRecorded={() => { void refreshSelectedCustomer(); }}
                      onUnauthorized={onUnauthorized}
                      userId={detail.user.id}
                    />
                    <div className="admin-account-actions">
                      <div><h3>Gerenciar conta</h3><p>{detail.user.accountStatus === "active" ? "Suspender encerra as sessões e impede novos acessos até a reativação." : "Reativar permite que o cliente entre novamente com um link enviado ao próprio e-mail."}</p></div>
                      <button className={detail.user.accountStatus === "active" ? "button button--danger" : "button button--primary"} disabled={savingStatus} onClick={() => void toggleAccountStatus()} type="button">
                        {savingStatus ? "Salvando…" : detail.user.accountStatus === "active" ? "Suspender conta" : "Reativar conta"}
                      </button>
                    </div>
                    {detail.recentActions.length ? <div className="admin-detail-section admin-audit"><h3>Histórico administrativo</h3>{detail.recentActions.map((action, index) => {
                      const label = action.action === "account_suspended"
                        ? "Conta suspensa"
                        : action.action === "account_reactivated"
                          ? "Conta reativada"
                          : action.action === "customer_created"
                            ? "Cliente cadastrado"
                          : action.action === "manual_platform_sale_recorded"
                            ? "Acesso à plataforma liberado"
                            : "Pagamento manual registrado";
                      return <p key={`${action.createdAt}-${index}`}>{label} por {action.actorEmail}{action.purchaseId ? ` · venda ${action.purchaseId.slice(0, 8)}` : ""} · {dateLabel(action.createdAt)}</p>;
                    })}</div> : null}
                  </>
                ) : null}
              </section>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
