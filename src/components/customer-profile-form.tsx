"use client";

import { useState, type FormEvent } from "react";
import { Check, CircleAlert, LoaderCircle } from "lucide-react";
import { ApiError, api } from "@/lib/api-client";
import type { AuthenticatedCustomer } from "@/lib/api-contracts";

type CustomerProfile = Pick<AuthenticatedCustomer, "name" | "whatsapp" | "birthDate">;

function todayForInput() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

export function CustomerProfileForm({
  initialProfile,
  onSaved,
  submitLabel = "Salvar meus dados",
}: {
  initialProfile: CustomerProfile;
  onSaved?: (user: AuthenticatedCustomer) => void;
  submitLabel?: string;
}) {
  const [name, setName] = useState(initialProfile.name ?? "");
  const [whatsapp, setWhatsapp] = useState(initialProfile.whatsapp ?? "");
  const [birthDate, setBirthDate] = useState(initialProfile.birthDate ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const user = await api.updateCustomerProfile({ name, whatsapp, birthDate });
      setSaved(true);
      onSaved?.(user);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível salvar seus dados. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="customer-profile-form" onSubmit={submit}>
      <div className="customer-profile-form__fields">
        <div className="form-field">
          <label htmlFor="customer-name">Nome completo</label>
          <input autoComplete="name" id="customer-name" maxLength={120} name="name" required value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="customer-whatsapp">WhatsApp com DDD</label>
          <input autoComplete="tel" id="customer-whatsapp" inputMode="tel" maxLength={24} name="whatsapp" placeholder="(11) 99999-0000" required type="tel" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} />
          <small>Usaremos esse número para identificar seu contato.</small>
        </div>
        <div className="form-field">
          <label htmlFor="customer-birth-date">Data de nascimento</label>
          <input autoComplete="bday" id="customer-birth-date" max={todayForInput()} name="birthDate" required type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
        </div>
      </div>
      {error ? <p className="customer-profile-form__message is-error" role="alert"><CircleAlert aria-hidden="true" size={16} />{error}</p> : null}
      {saved ? <p className="customer-profile-form__message is-saved" role="status"><Check aria-hidden="true" size={16} />Dados salvos com sucesso.</p> : null}
      <button className="button button--primary customer-profile-form__submit" disabled={saving} type="submit">
        {saving ? <LoaderCircle aria-hidden="true" className="spin" size={16} /> : null}
        {saving ? "Salvando…" : submitLabel}
      </button>
    </form>
  );
}
