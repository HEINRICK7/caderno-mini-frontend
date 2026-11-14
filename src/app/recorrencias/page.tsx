"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CircleAlert, Pause, Play, Plus, Repeat2, StopCircle } from "lucide-react";

import { CustomerAreaShell, CustomerWorkspaceLoading } from "@/components/customer-area-shell";
import { ApiError, api } from "@/lib/api-client";
import type { CustomerPortalSummary, MerchantCatalogItem, MerchantCustomer, MerchantRecurringPlan } from "@/lib/api-contracts";

function toMinor(value: string) { return Number(value.replace(/\D/g, "") || 0); }
function formatAmount(value: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100); }
function formatInput(value: number) { return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100); }
function todayInput() { return new Date().toISOString().slice(0, 10); }
function inThirtyDays() { const date = new Date(); date.setDate(date.getDate() + 30); return date.toISOString().slice(0, 10); }
function formatDate(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR"); }

export default function MerchantRecurrencesPage() {
  const router = useRouter();
  const [portal, setPortal] = useState<CustomerPortalSummary | null>(null);
  const [customers, setCustomers] = useState<MerchantCustomer[]>([]);
  const [catalog, setCatalog] = useState<MerchantCatalogItem[]>([]);
  const [plans, setPlans] = useState<MerchantRecurringPlan[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [description, setDescription] = useState("");
  const [catalogItemId, setCatalogItemId] = useState("");
  const [amount, setAmount] = useState("0,00");
  const [frequency, setFrequency] = useState<"weekly" | "fortnightly" | "monthly">("monthly");
  const [startDate, setStartDate] = useState(todayInput());
  const [dueDay, setDueDay] = useState("10");
  const [endDate, setEndDate] = useState("");
  const [totalCycles, setTotalCycles] = useState("");
  const [payingChargeId, setPayingChargeId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cash" | "bank_transfer" | "other">("pix");
  const [ratePlanId, setRatePlanId] = useState("");
  const [rateDate, setRateDate] = useState(inThirtyDays());
  const [rateAmount, setRateAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const account = await api.getCustomerPortal();
      if (!account.user.profileComplete) { router.replace("/primeiro-acesso?returnTo=%2Frecorrencias"); return; }
      const [customerRecords, catalogRecords, recurringPlans] = await Promise.all([
        api.getMerchantCustomers({ status: "active" }), api.getMerchantCatalogItems({ status: "active" }), api.getMerchantRecurringPlans("all"),
      ]);
      setPortal(account); setCustomers(customerRecords); setCatalog(catalogRecords); setPlans(recurringPlans);
      setCustomerId((current) => current || customerRecords[0]?.id || "");
      setError("");
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) router.replace("/entrar?returnTo=%2Frecorrencias");
      else setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar as cobranças recorrentes.");
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function chooseCatalogItem(id: string) {
    setCatalogItemId(id);
    const item = catalog.find((candidate) => candidate.id === id);
    if (item) { setDescription(item.name); setAmount(formatInput(item.priceMinor)); }
  }

  async function createPlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      await api.createMerchantRecurringPlan({
        customerId, description, amountMinor: toMinor(amount), frequency, startDate,
        ...(catalogItemId ? { catalogItemId } : {}),
        ...(frequency === "monthly" ? { dueDay: Number(dueDay) } : {}),
        ...(endDate ? { endDate } : {}), ...(totalCycles ? { totalCycles: Number(totalCycles) } : {}),
      });
      setNotice("Cobrança recorrente criada."); setDescription(""); setAmount("0,00"); setCatalogItemId(""); setEndDate(""); setTotalCycles("");
      await load();
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Não foi possível criar a recorrência."); }
    finally { setSaving(false); }
  }

  async function changeStatus(plan: MerchantRecurringPlan, action: "pause" | "resume" | "end") {
    if (action === "end" && !window.confirm(`Encerrar a cobrança recorrente de ${plan.description}?`)) return;
    setSaving(true); setError(""); setNotice("");
    try {
      if (action === "pause") await api.pauseMerchantRecurringPlan(plan.id);
      else if (action === "resume") await api.resumeMerchantRecurringPlan(plan.id);
      else await api.endMerchantRecurringPlan(plan.id);
      setNotice(action === "pause" ? "Recorrência pausada." : action === "resume" ? "Recorrência retomada." : "Recorrência encerrada.");
      await load();
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Não foi possível atualizar a recorrência."); }
    finally { setSaving(false); }
  }

  async function saveRate(event: React.FormEvent<HTMLFormElement>, planId: string) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      await api.changeMerchantRecurringRate(planId, { effectiveDate: rateDate, amountMinor: toMinor(rateAmount) });
      setRatePlanId(""); setNotice("Novo valor programado para as cobranças futuras."); await load();
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Não foi possível programar o novo valor."); }
    finally { setSaving(false); }
  }

  async function savePayment(event: React.FormEvent<HTMLFormElement>, chargeId: string) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      await api.recordMerchantRecurringPayment(chargeId, { amountMinor: toMinor(paymentAmount), method: paymentMethod });
      setPayingChargeId(""); setPaymentAmount(""); setNotice("Pagamento registrado manualmente."); await load();
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Não foi possível registrar o pagamento."); }
    finally { setSaving(false); }
  }

  if (loading && !portal) return <CustomerWorkspaceLoading label="Abrindo suas recorrências…" />;

  return (
    <CustomerAreaShell access={portal?.platformAccess} email={portal?.user.email}>
      <section className="subpage-content merchant-recurring-page">
        <div className="template-editor-heading merchant-recurring-heading">
          <span className="customer-area-eyebrow"><Repeat2 aria-hidden="true" size={14} /> Organização comercial</span>
          <h1>Cobranças recorrentes</h1>
          <p>Organize mensalidades e serviços contínuos. Confira os dados e compartilhe a cobrança manualmente.</p>
        </div>
        {error ? <div className="customer-area-error" role="alert"><CircleAlert aria-hidden="true" size={18} />{error}</div> : null}
        {notice ? <p className="merchant-directory-notice" role="status">{notice}</p> : null}

        <div className="merchant-recurring-layout">
          <section className="customer-dashboard-panel merchant-recurring-create">
            <div className="customer-dashboard-panel__heading"><div><h2>Nova recorrência</h2><p>As cobranças são previstas até 90 dias à frente.</p></div><Plus aria-hidden="true" size={20} /></div>
            {customers.length ? <form className="merchant-ledger-form" onSubmit={(event) => void createPlan(event)}>
              <label className="form-field"><span>Cliente *</span><select aria-label="Cliente *" onChange={(event) => setCustomerId(event.target.value)} required value={customerId}><option value="">Selecione um cliente</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
              <label className="form-field"><span>Produto ou serviço cadastrado</span><select aria-label="Produto ou serviço cadastrado" onChange={(event) => chooseCatalogItem(event.target.value)} value={catalogItemId}><option value="">Sem vínculo com o catálogo</option>{catalog.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="form-field"><span>Descrição da cobrança *</span><input aria-label="Descrição da cobrança *" maxLength={160} onChange={(event) => setDescription(event.target.value)} required value={description} /></label>
              <label className="form-field"><span>Valor em reais *</span><input aria-label="Valor em reais *" inputMode="decimal" onChange={(event) => setAmount(event.target.value)} required value={amount} /></label>
              <label className="form-field"><span>Periodicidade</span><select aria-label="Periodicidade" onChange={(event) => setFrequency(event.target.value as typeof frequency)} value={frequency}><option value="weekly">Semanal</option><option value="fortnightly">Quinzenal</option><option value="monthly">Mensal</option></select></label>
              <label className="form-field"><span>Início a partir de</span><input aria-label="Início a partir de" onChange={(event) => setStartDate(event.target.value)} required type="date" value={startDate} /></label>
              {frequency === "monthly" ? <label className="form-field"><span>Dia do vencimento</span><input aria-label="Dia do vencimento" max="31" min="1" onChange={(event) => setDueDay(event.target.value)} required type="number" value={dueDay} /></label> : null}
              <label className="form-field"><span>Data final <small>Opcional</small></span><input aria-label="Data final" onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} /></label>
              <label className="form-field"><span>Quantidade de ciclos <small>Opcional</small></span><input aria-label="Quantidade de ciclos" max="120" min="1" onChange={(event) => setTotalCycles(event.target.value)} type="number" value={totalCycles} /></label>
              <button className="button button--primary" disabled={saving || !customerId || toMinor(amount) <= 0} type="submit"><Plus aria-hidden="true" size={16} />{saving ? "Salvando…" : "Criar cobrança recorrente"}</button>
            </form> : <div className="merchant-directory-empty"><strong>Cadastre um cliente antes</strong><p>Uma recorrência sempre fica vinculada a um cliente.</p><a className="button button--secondary" href="/clientes">Abrir clientes</a></div>}
          </section>

          <section className="customer-dashboard-panel merchant-recurring-list">
            <div className="customer-dashboard-panel__heading"><div><h2>Planos e próximos vencimentos</h2><p>{plans.length} {plans.length === 1 ? "recorrência" : "recorrências"}</p></div><CalendarClock aria-hidden="true" size={20} /></div>
            {plans.length ? <div className="merchant-recurring-cards">{plans.map((plan) => <article className="merchant-recurring-card" key={plan.id}>
              <div className="merchant-recurring-card__heading"><div><span className={`merchant-recurring-status is-${plan.status}`}>{plan.status === "active" ? "Ativa" : plan.status === "paused" ? "Pausada" : "Encerrada"}</span><h3>{plan.description}</h3><p>{customers.find((customer) => customer.id === plan.customerId)?.name ?? "Cliente arquivado"} · {plan.frequency === "monthly" ? `Todo dia ${plan.dueDay}` : plan.frequency === "weekly" ? "Semanal" : "Quinzenal"}</p></div><strong>{formatAmount(plan.currentAmountMinor)}</strong></div>
              <div className="merchant-recurring-actions">
                {plan.status === "active" ? <button className="button button--secondary" disabled={saving} onClick={() => void changeStatus(plan, "pause")} type="button"><Pause aria-hidden="true" size={14} />Pausar</button> : plan.status === "paused" ? <button className="button button--secondary" disabled={saving} onClick={() => void changeStatus(plan, "resume")} type="button"><Play aria-hidden="true" size={14} />Retomar</button> : null}
                {plan.status !== "ended" ? <button className="button button--secondary" disabled={saving} onClick={() => void changeStatus(plan, "end")} type="button"><StopCircle aria-hidden="true" size={14} />Encerrar</button> : null}
                {plan.status !== "ended" ? <button className="button button--secondary" onClick={() => { setRatePlanId(ratePlanId === plan.id ? "" : plan.id); setRateAmount(formatInput(plan.currentAmountMinor)); }} type="button">Alterar valor futuro</button> : null}
              </div>
              {ratePlanId === plan.id ? <form className="merchant-recurring-rate-form" onSubmit={(event) => void saveRate(event, plan.id)}><label className="form-field"><span>Vigência a partir de</span><input aria-label="Vigência a partir de" min={todayInput()} onChange={(event) => setRateDate(event.target.value)} required type="date" value={rateDate} /></label><label className="form-field"><span>Novo valor em reais</span><input aria-label="Novo valor em reais" inputMode="decimal" onChange={(event) => setRateAmount(event.target.value)} required value={rateAmount} /></label><button className="button button--primary" disabled={saving} type="submit">Salvar novo valor</button></form> : null}
              {plan.charges.length ? <div className="merchant-recurring-charge-list"><h4>Cobranças geradas</h4>{plan.charges.map((charge) => <div className="merchant-recurring-charge" key={charge.id}>
                <div><strong>{formatAmount(charge.amountMinor)}</strong><small>{formatDate(charge.dueDate)} · {charge.derivedStatus === "paid" ? "Paga" : charge.derivedStatus === "partially_paid" ? "Parcialmente paga" : charge.derivedStatus === "overdue" ? "Atrasada" : charge.derivedStatus === "due_today" ? "Vence hoje" : charge.derivedStatus === "canceled" ? "Cancelada" : "Pendente"}</small></div>
                {charge.balanceMinor > 0 && charge.status === "open" ? <button className="button button--secondary" onClick={() => { setPayingChargeId(charge.id); setPaymentAmount(formatInput(charge.balanceMinor)); }} type="button">Registrar pagamento</button> : null}
                {charge.balanceMinor > 0 && charge.status === "open" ? <a className="button button--secondary" href={`/templates/cobranca-pix?recurringChargeId=${encodeURIComponent(charge.id)}`}>Preparar mensagem</a> : null}
                {charge.payments.map((payment) => <div className="merchant-recurring-payment-record" key={payment.id}><span><strong>{formatAmount(payment.amountMinor)}</strong><small>{formatDate(payment.paidAt.slice(0, 10))} · Confira o recebimento no banco</small></span><a className="button button--secondary" href={`/templates/pagamento-confirmado?recurringPaymentId=${encodeURIComponent(payment.id)}`}>Preparar confirmação</a></div>)}
                {payingChargeId === charge.id ? <form className="merchant-recurring-payment-form" onSubmit={(event) => void savePayment(event, charge.id)}><label className="form-field"><span>Valor recebido (R$)</span><input aria-label="Valor recebido (R$)" inputMode="decimal" onChange={(event) => setPaymentAmount(event.target.value)} required value={paymentAmount} /></label><label className="form-field"><span>Forma de pagamento</span><select aria-label="Forma de pagamento" onChange={(event) => setPaymentMethod(event.target.value as typeof paymentMethod)} value={paymentMethod}><option value="pix">Pix</option><option value="cash">Dinheiro</option><option value="bank_transfer">Transferência</option><option value="other">Outro</option></select></label><button className="button button--primary" disabled={saving} type="submit">Salvar pagamento</button><button className="button button--secondary" onClick={() => setPayingChargeId("")} type="button">Cancelar</button></form> : null}
              </div>)}</div> : <p className="merchant-recurring-empty">Nenhuma cobrança dentro do período atual ainda.</p>}
            </article>)}</div> : <div className="merchant-directory-empty"><span><Repeat2 aria-hidden="true" size={21} /></span><strong>Comece com uma mensalidade</strong><p>Crie um plano recorrente para visualizar os próximos vencimentos e registrar pagamentos.</p></div>}
          </section>
        </div>
      </section>
    </CustomerAreaShell>
  );
}
