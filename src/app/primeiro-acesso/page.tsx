"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleAlert, ShieldCheck, UserRound } from "lucide-react";
import { CustomerAreaShell, CustomerWorkspaceLoading } from "@/components/customer-area-shell";
import { CustomerProfileForm } from "@/components/customer-profile-form";
import { ApiError, api } from "@/lib/api-client";
import type { AuthenticatedCustomer } from "@/lib/api-contracts";
import { safeReturnTo } from "@/lib/safe-return-to";
import { useCustomerWorkspace } from "@/hooks/use-customer-workspace";

function destinationAfterProfile(value: string | null) {
  const destination = safeReturnTo(value, "/painel");
  return destination === "/conta" || destination === "/primeiro-acesso" ? "/painel" : destination;
}

function FirstAccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspace = useCustomerWorkspace();
  const started = useRef(false);
  const [user, setUser] = useState<AuthenticatedCustomer | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const destination = destinationAfterProfile(searchParams.get("returnTo"));

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void api.getCurrentUser().then((currentUser) => {
      if (currentUser.profileComplete) {
        router.replace(destination);
        return;
      }
      setUser(currentUser);
    }).catch((cause: unknown) => {
      if (cause instanceof ApiError && cause.status === 401) {
        router.replace("/entrar?returnTo=%2Fprimeiro-acesso");
      } else {
        setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar seus dados.");
      }
    }).finally(() => setLoading(false));
  }, [destination, router]);

  function finishProfile(updatedUser: AuthenticatedCustomer) {
    setUser(updatedUser);
    router.replace(destination);
  }

  return (
    <CustomerAreaShell access={workspace.access} email={user?.email ?? workspace.email}>
      <section className="customer-first-access">
        <div className="customer-first-access__copy">
          <span className="customer-area-eyebrow"><UserRound aria-hidden="true" size={14} /> Primeiro acesso</span>
          <h1>Vamos preparar sua área.</h1>
          <p>Complete seus dados para entrar no seu espaço privado e acessar sua licença e mensagens.</p>
        </div>
        {loading ? <div className="customer-area-loading" role="status">Validando seu acesso…</div> : null}
        {error ? <div className="customer-area-error" role="alert"><CircleAlert aria-hidden="true" size={18} />{error}</div> : null}
        {!loading && user && !user.profileComplete ? (
          <section aria-labelledby="customer-profile-title" className="customer-profile-panel">
            <div className="customer-profile-panel__heading">
              <span className="customer-profile-panel__icon"><ShieldCheck aria-hidden="true" size={20} /></span>
              <div>
                <h2 id="customer-profile-title">Seus dados de acesso</h2>
                <p>Essas informações ficam vinculadas à sua conta e podem ser atualizadas depois.</p>
              </div>
            </div>
            <CustomerProfileForm initialProfile={user} onSaved={finishProfile} submitLabel="Salvar e entrar na minha área" />
          </section>
        ) : null}
      </section>
    </CustomerAreaShell>
  );
}

export default function FirstAccessPage() {
  return <Suspense fallback={<CustomerWorkspaceLoading label="Preparando seu primeiro acesso…" />}><FirstAccessContent /></Suspense>;
}
