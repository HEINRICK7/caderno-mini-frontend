"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Check, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ApiError, api } from "@/lib/api-client";
import { safeReturnTo } from "@/lib/safe-return-to";

function SignInForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    setMessage("");
    try {
      const response = await api.requestMagicLink(email);
      sessionStorage.setItem("caderno:auth:return-to", safeReturnTo(searchParams.get("returnTo"), "/conta"));
      setMessage(response);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível enviar o link.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="template-form auth-form" onSubmit={submit}>
      <div className="form-field">
        <label htmlFor="email">E-mail</label>
        <input autoComplete="email" id="email" name="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </div>
      {message ? <p className="form-notice" role="status">{message}</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button button--primary form-submit" disabled={sending} type="submit">
        {sending ? "Enviando…" : "Enviar link de acesso"}
      </button>
    </form>
  );
}

export default function SignInPage() {
  return (
    <main className="subpage-shell">
      <SiteHeader />
      <section className="subpage-content auth-content">
        <div className="auth-layout">
          <header className="auth-intro">
            <span className="auth-eyebrow"><Sparkles aria-hidden="true" size={14} /> Seu espaço, organizado</span>
            <h1>Seus cartões, sempre à mão.</h1>
            <p>Entre para encontrar suas compras e compartilhar os links das mensagens que você criou.</p>
            <ul className="auth-benefits">
              <li><span><Check aria-hidden="true" size={14} /></span>Sem senha para memorizar</li>
              <li><span><Check aria-hidden="true" size={14} /></span>Compras e mensagens reunidas</li>
              <li><span><Check aria-hidden="true" size={14} /></span>Acesso pelo e-mail da compra</li>
            </ul>
          </header>
          <section aria-labelledby="auth-card-title" className="auth-card">
            <span className="auth-card__icon"><Mail aria-hidden="true" size={20} /></span>
            <h2 id="auth-card-title">Receba seu link de acesso</h2>
            <p>Informe o mesmo e-mail usado no checkout. Enviaremos um link seguro para entrar.</p>
            <Suspense fallback={<p className="page-message" role="status">Preparando o formulário…</p>}>
              <SignInForm />
            </Suspense>
            <p className="auth-card__security"><LockKeyhole aria-hidden="true" size={14} /> Seu acesso é privado e vinculado ao seu e-mail.</p>
          </section>
        </div>
      </section>
    </main>
  );
}
