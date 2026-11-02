"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
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
    <form className="template-form" onSubmit={submit}>
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
      <section className="subpage-content subpage-content--narrow">
        <div className="page-heading page-heading--stacked">
          <h1>Entrar</h1>
          <p>Use o mesmo e-mail da compra. Vamos enviar um link sem senha; depois, você encontra suas mensagens em Minha conta.</p>
        </div>
        <Suspense fallback={<p className="page-message">Carregando…</p>}>
          <SignInForm />
        </Suspense>
      </section>
    </main>
  );
}
