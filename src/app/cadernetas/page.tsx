"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, CalendarDays, CircleAlert, Plus, ReceiptText, UserRound } from "lucide-react";

import { CustomerAreaShell, CustomerWorkspaceLoading } from "@/components/customer-area-shell";
import { ApiError, api } from "@/lib/api-client";
import type { CustomerPortalSummary, MerchantCatalogItem, MerchantChargeMessage, MerchantCustomer, MerchantCustomerLedger } from "@/lib/api-contracts";
import { formatDate } from "@/lib/format-date";

function toMinor(value: string) { return Number(value.replace(/\D/g, "") || 0); }
function formatAmount(value: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100); }
function formatInput(value: number) { return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100); }

export default function MerchantLedgersPage() {
  const router = useRouter();
  const [portal, setPortal] = useState<CustomerPortalSummary | null>(null);
  const [customers, setCustomers] = useState<MerchantCustomer[]>([]);
  const [catalog, setCatalog] = useState<MerchantCatalogItem[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [ledger, setLedger] = useState<MerchantCustomerLedger | null>(null);
  const [chargeMessages, setChargeMessages] = useState<MerchantChargeMessage[]>([]);
  const [catalogItemId, setCatalogItemId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemKind, setItemKind] = useState<"product" | "service" | "other">("product");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("0,00");
  const [condition, setCondition] = useState<"" | "cash" | "single_due" | "installments">("");
  const [downPayment, setDownPayment] = useState("0,00");
  const [installmentCount, setInstallmentCount] = useState("2");
  const [firstDueDate, setFirstDueDate] = useState("");
  const [confirmedSaleKey, setConfirmedSaleKey] = useState("");
  const [initialPaymentMethod, setInitialPaymentMethod] = useState<"pix" | "cash" | "bank_transfer" | "other">("pix");
  const [payingId, setPayingId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cash" | "bank_transfer" | "other">("pix");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const account = await api.getCustomerPortal();
      if (!account.user.profileComplete) { router.replace("/primeiro-acesso?returnTo=%2Fcadernetas"); return; }
      const [customerRecords, catalogRecords] = await Promise.all([
        api.getMerchantCustomers({ status: "active" }), api.getMerchantCatalogItems({ status: "active" }),
      ]);
      setPortal(account);
      setCustomers(customerRecords);
      setCatalog(catalogRecords);
      const requestedCustomerId = new URLSearchParams(window.location.search).get("customerId");
      const preferredCustomerId = requestedCustomerId && customerRecords.some((customer) => customer.id === requestedCustomerId)
        ? requestedCustomerId
        : customerRecords[0]?.id || "";
      setCustomerId((current) => current || preferredCustomerId);
      setError("");
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) router.replace("/entrar?returnTo=%2Fcadernetas");
      else setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar as cadernetas.");
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    if (!customerId) return;
    let active = true;
    void Promise.all([api.getMerchantCustomerLedger(customerId), api.getMerchantChargeMessages(customerId)]).then(([value, messages]) => {
      if (active) { setLedger(value); setChargeMessages(messages); }
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof ApiError ? cause.message : "Não foi possível abrir a caderneta.");
    });
    return () => { active = false; };
  }, [customerId]);

  const totalMinor = useMemo(() => toMinor(unitPrice) * Number(quantity || 0), [quantity, unitPrice]);
  const selectedItem = catalog.find((item) => item.id === catalogItemId);
  const isCreditSale = condition === "single_due" || condition === "installments";
  const saleConfirmationKey = JSON.stringify([condition, customerId, totalMinor, firstDueDate, installmentCount, toMinor(downPayment)]);
  const saleConfirmed = condition === "cash" || confirmedSaleKey === saleConfirmationKey;

  function chooseCatalogItem(id: string) {
    setCatalogItemId(id);
    const item = catalog.find((candidate) => candidate.id === id);
    setItemName(item?.name ?? "");
    setItemKind(item?.kind ?? "product");
    setUnitPrice(item ? formatInput(item.priceMinor) : "0,00");
  }

  async function submitSale(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customerId) return;
    if (!condition) {
      setError("Escolha a condição de pagamento antes de registrar a venda.");
      return;
    }
    if (isCreditSale && (!firstDueDate || !saleConfirmed)) {
      setError("Confira o vencimento e confirme que esta venda ficará a prazo antes de registrar.");
      return;
    }
    setSaving(true); setError(""); setNotice("");
    const minorPrice = toMinor(unitPrice);
    const payload = {
      customerId,
      items: [selectedItem
        ? { catalogItemId: selectedItem.id, quantity: Number(quantity), unitPriceMinor: minorPrice }
        : { name: itemName, kind: itemKind, quantity: Number(quantity), unitPriceMinor: minorPrice }],
      condition,
      ...(condition !== "cash" && toMinor(downPayment) > 0 ? { downPaymentMinor: toMinor(downPayment), initialPaymentMethod } : {}),
      ...(condition === "installments" ? { installmentCount: Number(installmentCount) } : {}),
      ...(condition !== "cash" ? { firstDueDate } : {}),
      ...(toMinor(downPayment) > 0 ? { initialPaymentMethod } : {}),
    };
    try {
      await api.createMerchantSale(payload);
      const updated = await api.getMerchantCustomerLedger(customerId);
      setLedger(updated);
      setNotice("Venda registrada na caderneta.");
      setCatalogItemId(""); setItemName(""); setUnitPrice("0,00"); setQuantity("1"); setDownPayment("0,00");
      setCondition(""); setFirstDueDate(""); setConfirmedSaleKey(""); setInstallmentCount("2");
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Não foi possível registrar a venda."); }
    finally { setSaving(false); }
  }

  async function submitPayment(event: React.FormEvent<HTMLFormElement>, installmentId: string) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      await api.recordMerchantInstallmentPayment(installmentId, { amountMinor: toMinor(paymentAmount), method: paymentMethod });
      if (customerId) setLedger(await api.getMerchantCustomerLedger(customerId));
      setNotice("Pagamento registrado."); setPayingId(""); setPaymentAmount("");
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Não foi possível registrar o pagamento."); }
    finally { setSaving(false); }
  }

  if (loading && !portal) return <CustomerWorkspaceLoading label="Abrindo suas cadernetas…" />;

  return (
    <CustomerAreaShell access={portal?.platformAccess} email={portal?.user.email}>
      <section className="subpage-content merchant-ledger-page">
        <div className="template-editor-heading merchant-ledger-heading">
          <span className="customer-area-eyebrow"><BookOpenCheck aria-hidden="true" size={14} /> Organização comercial</span>
          <h1>Cadernetas</h1>
          <p>Registre vendas, acompanhe vencimentos e anote pagamentos de cada cliente.</p>
        </div>
        {error ? <div className="customer-area-error" role="alert"><CircleAlert aria-hidden="true" size={18} />{error}</div> : null}
        {notice ? <p className="merchant-directory-notice" role="status">{notice}</p> : null}

        <div className="merchant-ledger-layout">
          <section className="customer-dashboard-panel merchant-ledger-sale-panel">
            <div className="customer-dashboard-panel__heading"><div><h2>Registrar venda</h2><p>Os nomes e preços ficam salvos como foram vendidos.</p></div><ReceiptText aria-hidden="true" size={20} /></div>
            {customers.length ? <form className="merchant-ledger-form" onSubmit={(event) => void submitSale(event)}>
              <label className="form-field"><span>Cliente *</span><select aria-label="Cliente *" onChange={(event) => { setCustomerId(event.target.value); if (!event.target.value) { setLedger(null); setChargeMessages([]); } }} required value={customerId}><option value="">Selecione um cliente</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
              <label className="form-field"><span>Item do catálogo</span><select aria-label="Item do catálogo" onChange={(event) => chooseCatalogItem(event.target.value)} value={catalogItemId}><option value="">Item avulso</option>{catalog.map((item) => <option key={item.id} value={item.id}>{item.name} · {formatAmount(item.priceMinor)}</option>)}</select></label>
              {!selectedItem ? <label className="form-field"><span>Nome do item *</span><input aria-label="Nome do item" maxLength={120} onChange={(event) => setItemName(event.target.value)} required value={itemName} /></label> : null}
              {!selectedItem ? <label className="form-field"><span>Tipo do item</span><select aria-label="Tipo do item" onChange={(event) => setItemKind(event.target.value as typeof itemKind)} value={itemKind}><option value="product">Produto</option><option value="service">Serviço</option><option value="other">Outro</option></select></label> : null}
              <div className="merchant-ledger-form__row">
                <label className="form-field"><span>Quantidade</span><input aria-label="Quantidade" min="1" onChange={(event) => setQuantity(event.target.value)} required type="number" value={quantity} /></label>
                <label className="form-field"><span>Preço unitário em reais</span><input aria-label="Preço unitário em reais" inputMode="decimal" onChange={(event) => setUnitPrice(event.target.value)} required value={unitPrice} /></label>
              </div>
              <div className="merchant-ledger-total"><span>Total da venda</span><strong>{formatAmount(totalMinor)}</strong></div>
              <label className="form-field"><span>Condição de pagamento *</span><select aria-label="Condição de pagamento" onChange={(event) => setCondition(event.target.value as typeof condition)} required value={condition}><option value="">Escolha uma condição</option><option value="cash">Pago integralmente</option><option value="single_due">Fiado · vencimento único</option><option value="installments">Parcelado</option></select></label>
              {isCreditSale ? <label className="form-field"><span>Entrada (R$)</span><input aria-label="Entrada (R$)" inputMode="decimal" onChange={(event) => setDownPayment(event.target.value)} value={downPayment} /></label> : null}
              {condition === "installments" ? <label className="form-field"><span>Quantidade de parcelas</span><input aria-label="Quantidade de parcelas" max="120" min="2" onChange={(event) => setInstallmentCount(event.target.value)} required type="number" value={installmentCount} /></label> : null}
              {isCreditSale ? <>
                <label className="form-field"><span>{condition === "installments" ? "Primeiro vencimento" : "Vencimento"} *</span><input aria-label="Primeiro vencimento" onChange={(event) => setFirstDueDate(event.target.value)} required type="date" value={firstDueDate} /></label>
                <div className="merchant-sale-confirmation" role="group" aria-label="Confirmação da venda a prazo">
                  <strong>Esta venda ficará {condition === "installments" ? "parcelada" : "como fiado"}.</strong>
                  <span>{formatAmount(totalMinor)} · vence {firstDueDate ? formatDate(firstDueDate) : "na data que você escolher"}{condition === "installments" ? ` · ${installmentCount} parcelas` : ""}</span>
                  <label><input checked={confirmedSaleKey === saleConfirmationKey} onChange={(event) => setConfirmedSaleKey(event.target.checked ? saleConfirmationKey : "")} type="checkbox" />Confirmo a condição e o vencimento desta venda.</label>
                </div>
              </> : null}
              {toMinor(downPayment) > 0 || condition === "cash" ? <label className="form-field"><span>Como recebeu a entrada</span><select aria-label="Como recebeu a entrada" onChange={(event) => setInitialPaymentMethod(event.target.value as typeof initialPaymentMethod)} value={initialPaymentMethod}><option value="pix">Pix</option><option value="cash">Dinheiro</option><option value="bank_transfer">Transferência</option><option value="other">Outro</option></select></label> : null}
              <button className="button button--primary" disabled={saving || !customerId || totalMinor <= 0 || !condition || !saleConfirmed || (isCreditSale && !firstDueDate)} type="submit"><Plus aria-hidden="true" size={16} />{saving ? "Registrando…" : "Registrar venda"}</button>
            </form> : <div className="merchant-directory-empty"><span><UserRound aria-hidden="true" size={20} /></span><strong>Cadastre seu primeiro cliente</strong><p>Depois, volte aqui para registrar vendas na caderneta.</p><a className="button button--secondary" href="/clientes">Abrir clientes</a></div>}
          </section>

          <section className="customer-dashboard-panel merchant-ledger-history">
            <div className="customer-dashboard-panel__heading"><div><h2>{ledger?.customer.name ?? "Histórico do cliente"}</h2><p>Compras e compromissos de pagamento</p></div><span className="customer-panel-count">{ledger?.sales.length ?? 0}</span></div>
            {ledger?.sales.length ? <div className="merchant-ledger-sales">{ledger.sales.map((sale) => <article className="merchant-ledger-sale" key={sale.id}>
              <div className="merchant-ledger-sale__heading"><div><strong>{formatAmount(sale.totalMinor)}</strong><small>{formatDate(sale.createdAt)} · {sale.condition === "cash" ? "Pago integralmente" : sale.condition === "installments" ? "Parcelado" : "Fiado"}</small></div><span>Saldo {formatAmount(sale.balanceMinor ?? sale.financedMinor)}</span></div>
              <ul>{sale.items.map((item) => <li key={item.id}><span>{item.quantity} × {item.name}</span><strong>{formatAmount(item.lineTotalMinor)}</strong></li>)}</ul>
              <a className="button button--secondary" href={`/templates/agradecimento-compra?saleId=${encodeURIComponent(sale.id)}`}>Preparar agradecimento</a>
              {sale.installments.length ? <div className="merchant-ledger-installments"><h3>Vencimentos</h3>{sale.installments.map((installment) => <div className="merchant-ledger-installment" key={installment.id}>
                <div><strong>{formatAmount(installment.amountMinor)}</strong><small><CalendarDays aria-hidden="true" size={13} /> {formatDate(installment.dueDate)} · {installment.derivedStatus === "paid" ? "Paga" : installment.derivedStatus === "partially_paid" ? "Parcialmente paga" : installment.derivedStatus === "overdue" ? "Atrasada" : installment.derivedStatus === "due_today" ? "Vence hoje" : "Pendente"}</small></div>
                {installment.balanceMinor && installment.balanceMinor > 0 ? <button className="button button--secondary" onClick={() => { setPayingId(installment.id); setPaymentAmount(formatInput(installment.balanceMinor!)); }} type="button">Registrar pagamento</button> : null}
                {installment.balanceMinor && installment.balanceMinor > 0 && installment.status === "open" ? <a className="button button--secondary" href={`/templates/${installment.derivedStatus === "overdue" ? "parcela-atrasada" : installment.derivedStatus === "due_today" ? "parcela-hoje" : "parcela-proxima"}?installmentId=${encodeURIComponent(installment.id)}`}>Preparar mensagem</a> : null}
                {payingId === installment.id ? <form className="merchant-ledger-payment-form" onSubmit={(event) => void submitPayment(event, installment.id)}><label className="form-field"><span>Valor recebido (R$)</span><input aria-label="Valor recebido (R$)" inputMode="decimal" onChange={(event) => setPaymentAmount(event.target.value)} required value={paymentAmount} /></label><label className="form-field"><span>Forma</span><select aria-label="Forma de pagamento" onChange={(event) => setPaymentMethod(event.target.value as typeof paymentMethod)} value={paymentMethod}><option value="pix">Pix</option><option value="cash">Dinheiro</option><option value="bank_transfer">Transferência</option><option value="other">Outro</option></select></label><button className="button button--primary" disabled={saving} type="submit">Salvar pagamento</button><button className="button button--secondary" onClick={() => setPayingId("")} type="button">Cancelar</button></form> : null}
              </div>)}</div> : null}
              {sale.payments.length ? <div className="merchant-ledger-payment-history"><h3>Pagamentos registrados manualmente</h3>{sale.payments.map((payment) => <div className="merchant-ledger-installment" key={payment.id}><span><strong>{formatAmount(payment.amountMinor)}</strong><small>{new Date(payment.paidAt).toLocaleDateString("pt-BR")} · Confira o recebimento no banco</small></span><a className="button button--secondary" href={`/templates/pagamento-confirmado?salePaymentId=${encodeURIComponent(payment.id)}`}>Preparar confirmação</a></div>)}</div> : null}
            </article>)}</div> : <div className="merchant-directory-empty"><span><ReceiptText aria-hidden="true" size={20} /></span><strong>{customerId ? "Ainda não há vendas nesta caderneta" : "Selecione um cliente"}</strong><p>As vendas registradas aparecerão aqui com seus valores, vencimentos e pagamentos.</p></div>}
            {chargeMessages.length ? <div className="merchant-charge-message-history"><h3>Mensagens desta caderneta</h3>{chargeMessages.map((message) => <a href={`/mensagens/${encodeURIComponent(message.draftId)}`} key={message.id}><span><strong>{message.templateName}</strong><small>{message.sourceType === "recurring_charge" ? "Cobrança recorrente" : message.sourceType === "sale" ? "Venda" : message.sourceType.includes("payment") ? "Pagamento registrado" : "Parcela"} · {new Date(message.createdAt).toLocaleDateString("pt-BR")}</small></span><span>Abrir mensagem →</span></a>)}</div> : null}
          </section>
        </div>
      </section>
    </CustomerAreaShell>
  );
}
