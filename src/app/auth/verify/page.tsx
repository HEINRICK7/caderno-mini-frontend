"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ApiError, api } from "@/lib/api-client";
import { safeReturnTo } from "@/lib/safe-return-to";

function VerifyMagicLink() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const started = useRef(false);
  const [message, setMessage] = useState("Validando link…");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (started.current || !token) {
      return;
    }
    started.current = true;
    void api.verifyMagicLink(token).then((user) => {
      const requestedReturnTo = safeReturnTo(sessionStorage.getItem("caderno:auth:return-to"), "/painel");
      sessionStorage.removeItem("caderno:auth:return-to");
      setMessage("Acesso confirmado.");
      if (!user.profileComplete) {
        const params = new URLSearchParams();
        if (requestedReturnTo !== "/primeiro-acesso") {
          params.set("returnTo", requestedReturnTo === "/conta" ? "/painel" : requestedReturnTo);
        }
        router.replace(`/primeiro-acesso${params.size ? `?${params}` : ""}`);
        return;
      }
      router.replace(requestedReturnTo === "/conta" ? "/painel" : requestedReturnTo);
    }).catch((cause: unknown) => {
      const detail = cause instanceof ApiError ? cause.message : "Não foi possível validar o link.";
      setError(detail);
      router.replace("/auth/verify");
    });
  }, [router, searchParams]);

  const missingToken = !searchParams.get("token");
  const visibleError = error || (missingToken ? "Link ausente ou incompleto." : "");
  return <p className={visibleError ? "page-message page-message--error" : "page-message"} role={visibleError ? "alert" : "status"}>{visibleError || message}</p>;
}

export default function VerifyPage() {
  return (
    <main className="subpage-shell">
      <SiteHeader />
      <section className="subpage-content subpage-content--narrow">
        <Suspense fallback={<p className="page-message">Validando link…</p>}>
          <VerifyMagicLink />
        </Suspense>
      </section>
    </main>
  );
}
