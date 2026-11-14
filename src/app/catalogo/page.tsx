"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, CircleAlert, PackageOpen, Plus, Save, Search, X } from "lucide-react";

import { CustomerAreaShell, CustomerWorkspaceLoading } from "@/components/customer-area-shell";
import { ApiError, api } from "@/lib/api-client";
import type { CustomerPortalSummary, MerchantCatalogItem } from "@/lib/api-contracts";

type CatalogForm = {
  kind: "product" | "service";
  name: string;
  description: string;
  price: string;
  isFree: boolean;
  status: "active" | "archived";
};

const emptyForm: CatalogForm = { kind: "product", name: "", description: "", price: "", isFree: false, status: "active" };

function toBRLInputFromMinor(value: number) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100);
}

function toMinorUnits(value: string) {
  const digits = value.replace(/\D/g, "");
  return Number(digits || 0);
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);
}

function itemToForm(item: MerchantCatalogItem): CatalogForm {
  return {
    kind: item.kind,
    name: item.name,
    description: item.description ?? "",
    price: item.priceMinor === 0 ? "0,00" : toBRLInputFromMinor(item.priceMinor),
    isFree: item.priceMinor === 0,
    status: item.status,
  };
}

export default function MerchantCatalogPage() {
  const router = useRouter();
  const [portal, setPortal] = useState<CustomerPortalSummary | null>(null);
  const [items, setItems] = useState<MerchantCatalogItem[]>([]);
  const [selected, setSelected] = useState<MerchantCatalogItem | null>(null);
  const [form, setForm] = useState<CatalogForm>(emptyForm);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | "product" | "service">("all");
  const [statusFilter, setStatusFilter] = useState<"active" | "all">("active");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const account = await api.getCustomerPortal();
      if (!account.user.profileComplete) {
        router.replace("/primeiro-acesso?returnTo=%2Fcatalogo");
        return;
      }
      const records = await api.getMerchantCatalogItems({
        query: appliedSearch,
        ...(kindFilter !== "all" ? { kind: kindFilter } : {}),
        status: statusFilter,
      });
      setPortal(account);
      setItems(records);
      setError("");
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        router.replace("/entrar?returnTo=%2Fcatalogo");
      } else {
        setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar produtos e serviços.");
      }
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, kindFilter, router, statusFilter]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  function startNewItem() {
    setSelected(null);
    setForm(emptyForm);
    setNotice("");
    setError("");
    setPriceError("");
  }

  function editItem(item: MerchantCatalogItem) {
    setSelected(item);
    setForm(itemToForm(item));
    setNotice("");
    setError("");
    setPriceError("");
  }

  async function saveItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const priceMinor = form.isFree ? 0 : toMinorUnits(form.price);
    if (!form.isFree && (!form.price.trim() || priceMinor <= 0)) {
      setPriceError("Informe um preço maior que R$ 0,00 ou marque “Item gratuito”.");
      document.getElementById("catalog-price")?.focus();
      return;
    }
    setSaving(true);
    setError("");
    setPriceError("");
    setNotice("");
    const payload = {
      kind: form.kind,
      name: form.name,
      description: form.description,
      priceMinor,
      status: form.status,
    };
    try {
      const saved = selected
        ? await api.updateMerchantCatalogItem(selected.id, payload)
        : await api.createMerchantCatalogItem(payload);
      setSelected(saved);
      setForm(itemToForm(saved));
      setNotice(selected ? "Item atualizado." : "Item cadastrado.");
      await load();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível salvar o item.");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !portal) return <CustomerWorkspaceLoading label="Carregando seu catálogo…" />;

  return (
    <CustomerAreaShell access={portal?.platformAccess} email={portal?.user.email}>
      <section className="subpage-content merchant-directory-page">
        <div className="template-editor-heading merchant-directory-heading">
          <span className="customer-area-eyebrow"><PackageOpen aria-hidden="true" size={14} /> Organização comercial</span>
          <h1>Produtos e serviços</h1>
          <p>Salve os itens que você oferece e reutilize seus nomes e preços ao organizar vendas.</p>
          <button className="button button--primary" onClick={startNewItem} type="button"><Plus aria-hidden="true" size={17} /> Cadastrar item</button>
        </div>

        {error ? <div className="customer-area-error" role="alert"><CircleAlert aria-hidden="true" size={18} />{error}</div> : null}

        <div className="merchant-directory-layout">
          <section aria-label="Lista de produtos e serviços" className="customer-dashboard-panel merchant-directory-list-panel">
            <div className="customer-dashboard-panel__heading">
              <div><h2>Seu catálogo</h2><p>{items.length} {items.length === 1 ? "item" : "itens"}</p></div>
              <label className="merchant-directory-filter"><span className="visually-hidden">Filtrar tipo</span><select onChange={(event) => setKindFilter(event.target.value as typeof kindFilter)} value={kindFilter}><option value="all">Todos os tipos</option><option value="product">Produtos</option><option value="service">Serviços</option></select></label>
            </div>

            <form className="merchant-directory-search" onSubmit={(event) => { event.preventDefault(); setAppliedSearch(searchInput); }}>
              <label className="visually-hidden" htmlFor="catalog-search">Buscar item</label>
              <Search aria-hidden="true" size={17} />
              <input id="catalog-search" onChange={(event) => setSearchInput(event.target.value)} placeholder="Buscar produto ou serviço" value={searchInput} />
              <button className="button button--secondary" type="submit">Buscar</button>
            </form>
            <label className="merchant-directory-archived-filter"><input checked={statusFilter === "all"} onChange={(event) => setStatusFilter(event.target.checked ? "all" : "active")} type="checkbox" /> Incluir itens arquivados</label>

            {loading ? <p className="merchant-directory-empty" role="status">Atualizando catálogo…</p> : items.length ? (
              <ul className="merchant-directory-list">
                {items.map((item) => (
                  <li key={item.id}>
                    <button aria-current={selected?.id === item.id ? "true" : undefined} className="merchant-directory-record" onClick={() => editItem(item)} type="button">
                      <span className="merchant-directory-record__icon"><PackageOpen aria-hidden="true" size={18} /></span>
                      <span className="merchant-directory-record__copy">
                        <strong>{item.name}</strong>
                        <small>{item.kind === "product" ? "Produto" : "Serviço"} · {formatBRL(item.priceMinor)}</small>
                      </span>
                      <span className={`merchant-directory-status${item.status === "archived" ? " is-archived" : ""}`}>
                        {item.status === "active" ? "Ativo" : "Arquivado"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="merchant-directory-empty">
                <span><PackageOpen aria-hidden="true" size={21} /></span>
                <strong>{appliedSearch ? "Nenhum item encontrado" : "Seu catálogo começa aqui"}</strong>
                <p>{appliedSearch ? "Tente buscar por outro nome." : "Cadastre seus produtos e serviços para usar os dados novamente depois."}</p>
              </div>
            )}
          </section>

          <section aria-label={selected ? "Editar item" : "Cadastrar item"} className="customer-dashboard-panel merchant-directory-form-panel">
          <div className="customer-dashboard-panel__heading">
              <div><h2>{selected ? "Editar item" : "Novo item"}</h2><p>Informe um preço maior que zero. Para cadastrar sem cobrar, marque “Item gratuito”.</p></div>
              {selected ? <button aria-label="Fechar edição" className="merchant-directory-close" onClick={startNewItem} type="button"><X aria-hidden="true" size={18} /></button> : null}
            </div>
            <form className="merchant-directory-form" onSubmit={(event) => void saveItem(event)}>
              <label className="form-field"><span>Tipo *</span><select onChange={(event) => setForm({ ...form, kind: event.target.value as CatalogForm["kind"] })} value={form.kind}><option value="product">Produto</option><option value="service">Serviço</option></select></label>
              <label className="form-field"><span>Nome *</span><input maxLength={120} onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} /></label>
              <label className="form-field"><span>Descrição</span><textarea maxLength={1_000} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} value={form.description} /></label>
              <label className="form-field"><span>Preço padrão (R$) *</span><div className="merchant-directory-currency"><span>R$</span><input aria-describedby={priceError ? "catalog-price-error" : "catalog-price-help"} aria-invalid={Boolean(priceError)} aria-label="Preço padrão em reais" disabled={form.isFree} id="catalog-price" inputMode="decimal" onChange={(event) => { const raw = event.target.value; setPriceError(""); setForm({ ...form, price: raw.trim() ? toBRLInputFromMinor(toMinorUnits(raw)) : "" }); }} required={!form.isFree} value={form.price} /></div><small id="catalog-price-help">O valor zero só é salvo quando “Item gratuito” estiver marcado.</small>{priceError ? <small className="form-field__error" id="catalog-price-error" role="alert">{priceError}</small> : null}</label>
              <label className="form-field form-field--checkbox"><input checked={form.isFree} onChange={(event) => { setPriceError(""); setForm({ ...form, isFree: event.target.checked, price: event.target.checked ? "0,00" : "" }); }} type="checkbox" /><span>Item gratuito (R$ 0,00)</span></label>
              <label className="form-field"><span>Situação</span><select onChange={(event) => setForm({ ...form, status: event.target.value as CatalogForm["status"] })} value={form.status}><option value="active">Ativo</option><option value="archived">Arquivado</option></select></label>
              {notice ? <p className="merchant-directory-notice" role="status">{notice}</p> : null}
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <div className="merchant-directory-form__actions">
                <button className="button button--primary" disabled={saving} type="submit"><Save aria-hidden="true" size={16} />{saving ? "Salvando…" : selected ? "Salvar alterações" : "Salvar item"}</button>
                {selected ? <button className="button button--secondary" disabled={saving} onClick={() => setForm({ ...form, status: form.status === "active" ? "archived" : "active" })} type="button"><Archive aria-hidden="true" size={16} />{form.status === "active" ? "Arquivar" : "Reativar"}</button> : null}
              </div>
            </form>
          </section>
        </div>
      </section>
    </CustomerAreaShell>
  );
}
