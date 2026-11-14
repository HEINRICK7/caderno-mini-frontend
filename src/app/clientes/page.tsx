"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, CircleAlert, Plus, Save, Search, UserRound, X } from "lucide-react";

import { CustomerAreaShell, CustomerWorkspaceLoading } from "@/components/customer-area-shell";
import { ApiError, api } from "@/lib/api-client";
import type { CustomerPortalSummary, MerchantCustomer } from "@/lib/api-contracts";

type CustomerForm = {
  name: string;
  whatsapp: string;
  email: string;
  address: string;
  notes: string;
  status: "active" | "archived";
};

const emptyForm: CustomerForm = { name: "", whatsapp: "", email: "", address: "", notes: "", status: "active" };

function customerToForm(customer: MerchantCustomer): CustomerForm {
  return {
    name: customer.name,
    whatsapp: customer.whatsapp ?? "",
    email: customer.email ?? "",
    address: customer.address ?? "",
    notes: customer.notes ?? "",
    status: customer.status,
  };
}

export default function MerchantCustomersPage() {
  const router = useRouter();
  const [portal, setPortal] = useState<CustomerPortalSummary | null>(null);
  const [customers, setCustomers] = useState<MerchantCustomer[]>([]);
  const [selected, setSelected] = useState<MerchantCustomer | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "all">("active");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const account = await api.getCustomerPortal();
      if (!account.user.profileComplete) {
        router.replace("/primeiro-acesso?returnTo=%2Fclientes");
        return;
      }
      const records = await api.getMerchantCustomers({ query: appliedSearch, status: statusFilter });
      setPortal(account);
      setCustomers(records);
      setError("");
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        router.replace("/entrar?returnTo=%2Fclientes");
      } else {
        setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar os clientes.");
      }
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, router, statusFilter]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  function startNewCustomer() {
    setSelected(null);
    setForm(emptyForm);
    setNotice("");
  }

  async function saveCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const payload = {
      name: form.name,
      whatsapp: form.whatsapp,
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      address: form.address,
      notes: form.notes,
      status: form.status,
    };
    try {
      const saved = selected
        ? await api.updateMerchantCustomer(selected.id, payload)
        : await api.createMerchantCustomer(payload);
      setSelected(saved);
      setForm(customerToForm(saved));
      setNotice(selected ? "Cliente atualizado." : "Cliente cadastrado.");
      await load();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível salvar o cliente.");
    } finally {
      setSaving(false);
    }
  }

  function editCustomer(customer: MerchantCustomer) {
    setSelected(customer);
    setForm(customerToForm(customer));
    setNotice("");
  }

  if (loading && !portal) return <CustomerWorkspaceLoading label="Carregando seus clientes…" />;

  return (
    <CustomerAreaShell access={portal?.platformAccess} email={portal?.user.email}>
      <section className="subpage-content merchant-directory-page">
        <div className="template-editor-heading merchant-directory-heading">
          <span className="customer-area-eyebrow"><UserRound aria-hidden="true" size={14} /> Organização comercial</span>
          <h1>Clientes</h1>
          <p>Guarde os contatos dos seus clientes para organizar vendas e preparar mensagens depois.</p>
          <button className="button button--primary" onClick={startNewCustomer} type="button">
            <Plus aria-hidden="true" size={17} /> Cadastrar cliente
          </button>
        </div>

        {error ? <div className="customer-area-error" role="alert"><CircleAlert aria-hidden="true" size={18} />{error}</div> : null}

        <div className="merchant-directory-layout">
          <section aria-label="Lista de clientes" className="customer-dashboard-panel merchant-directory-list-panel">
            <div className="customer-dashboard-panel__heading">
              <div><h2>Seus clientes</h2><p>{customers.length} {customers.length === 1 ? "cadastro" : "cadastros"}</p></div>
              <label className="merchant-directory-filter">
                <span className="visually-hidden">Exibir situação</span>
                <select onChange={(event) => setStatusFilter(event.target.value as "active" | "all")} value={statusFilter}>
                  <option value="active">Ativos</option>
                  <option value="all">Todos</option>
                </select>
              </label>
            </div>

            <form className="merchant-directory-search" onSubmit={(event) => { event.preventDefault(); setAppliedSearch(searchInput); }}>
              <label className="visually-hidden" htmlFor="customer-search">Buscar por nome, WhatsApp ou e-mail</label>
              <Search aria-hidden="true" size={17} />
              <input id="customer-search" onChange={(event) => setSearchInput(event.target.value)} placeholder="Buscar por nome, WhatsApp ou e-mail" value={searchInput} />
              <button className="button button--secondary" type="submit">Buscar</button>
            </form>

            {loading ? <p className="merchant-directory-empty" role="status">Atualizando clientes…</p> : customers.length ? (
              <ul className="merchant-directory-list">
                {customers.map((customer) => (
                  <li key={customer.id}>
                    <button aria-current={selected?.id === customer.id ? "true" : undefined} className="merchant-directory-record" onClick={() => editCustomer(customer)} type="button">
                      <span className="merchant-directory-record__icon"><UserRound aria-hidden="true" size={18} /></span>
                      <span className="merchant-directory-record__copy">
                        <strong>{customer.name}</strong>
                        <small>{customer.whatsapp || customer.email || "Sem telefone ou e-mail"}</small>
                      </span>
                      <span className={`merchant-directory-status${customer.status === "archived" ? " is-archived" : ""}`}>
                        {customer.status === "active" ? "Ativo" : "Arquivado"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="merchant-directory-empty">
                <span><UserRound aria-hidden="true" size={21} /></span>
                <strong>{appliedSearch ? "Nenhum cliente encontrado" : "Sua lista começa aqui"}</strong>
                <p>{appliedSearch ? "Tente buscar por outro nome ou contato." : "Cadastre seus clientes para encontrar as informações com facilidade."}</p>
              </div>
            )}
          </section>

          <section aria-label={selected ? "Editar cliente" : "Cadastrar cliente"} className="customer-dashboard-panel merchant-directory-form-panel">
            <div className="customer-dashboard-panel__heading">
              <div><h2>{selected ? "Editar cliente" : "Novo cliente"}</h2><p>Nome é o único campo obrigatório.</p></div>
              {selected ? <button aria-label="Fechar edição" className="merchant-directory-close" onClick={startNewCustomer} type="button"><X aria-hidden="true" size={18} /></button> : null}
            </div>
            <form className="merchant-directory-form" onSubmit={(event) => void saveCustomer(event)}>
              <label className="form-field"><span>Nome completo *</span><input autoComplete="name" maxLength={120} onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} /></label>
              <label className="form-field"><span>WhatsApp</span><input autoComplete="tel" inputMode="tel" maxLength={24} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} placeholder="(85) 99999-9999" value={form.whatsapp} /></label>
              <label className="form-field"><span>E-mail</span><input autoComplete="email" maxLength={254} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" value={form.email} /></label>
              <label className="form-field"><span>Endereço</span><input autoComplete="street-address" maxLength={300} onChange={(event) => setForm({ ...form, address: event.target.value })} value={form.address} /></label>
              <label className="form-field"><span>Observações</span><textarea maxLength={2_000} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} value={form.notes} /></label>
              <label className="form-field"><span>Situação</span><select onChange={(event) => setForm({ ...form, status: event.target.value as CustomerForm["status"] })} value={form.status}><option value="active">Ativo</option><option value="archived">Arquivado</option></select></label>
              {notice ? <p className="merchant-directory-notice" role="status">{notice}</p> : null}
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <div className="merchant-directory-form__actions">
                <button className="button button--primary" disabled={saving} type="submit"><Save aria-hidden="true" size={16} />{saving ? "Salvando…" : selected ? "Salvar alterações" : "Salvar cliente"}</button>
                {selected ? <button className="button button--secondary" disabled={saving} onClick={() => setForm({ ...form, status: form.status === "active" ? "archived" : "active" })} type="button"><Archive aria-hidden="true" size={16} />{form.status === "active" ? "Arquivar" : "Reativar"}</button> : null}
              </div>
            </form>
          </section>
        </div>
      </section>
    </CustomerAreaShell>
  );
}
