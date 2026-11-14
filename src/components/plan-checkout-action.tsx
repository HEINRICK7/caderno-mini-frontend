"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { ApiError, api } from "@/lib/api-client";

export function PlanCheckoutAction() {
  const [availability, setAvailability] = useState<"checking" | "enabled" | "paused" | "unknown">("checking");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    let active = true;
    void api.getPlatformCheckoutAvailability().then(({ enabled }) => {
      if (active) setAvailability(enabled ? "enabled" : "paused");
    }).catch(() => {
      if (active) setAvailability("unknown");
    });
    return () => { active = false; };
  }, []);

  async function startCheckout() {
    if (availability !== "enabled" || started.current) return;
    started.current = true;
    setLoading(true);
    setError("");
    try {
      const checkout = await api.createPlatformCheckout("annual");
      window.location.assign(checkout.checkoutUrl);
    } catch (cause) {
      setError(cause instanceof ApiError
        ? cause.message
        : "Não foi possível abrir o checkout. Tente novamente.");
      started.current = false;
      setLoading(false);
    }
  }

  return (
    <>
      <button
        className={`button pricing-plan__action${availability === "paused" || availability === "unknown" ? " pricing-plan__action--paused" : ""}`}
        disabled={loading || availability !== "enabled"}
        onClick={() => void startCheckout()}
        type="button"
      >
        {loading
          ? "Preparando checkout…"
          : availability === "paused"
            ? "Compra temporariamente indisponível"
            : availability === "unknown"
              ? "Checkout indisponível"
              : availability === "checking"
                ? "Verificando disponibilidade…"
                : "Comprar por R$ 47,00"}
        {loading
          ? <LoaderCircle aria-hidden="true" className="pricing-checkout-spinner" size={17} />
          : availability === "paused" || availability === "unknown"
            ? <LockKeyhole aria-hidden="true" size={17} />
            : <ArrowRight aria-hidden="true" size={17} />}
      </button>
      {availability === "paused" ? (
        <p className="pricing-checkout-status" role="status">
          Estamos concluindo a aprovação dos documentos para liberar a compra.
        </p>
      ) : null}
      {availability === "unknown" ? (
        <p className="pricing-checkout-error" role="alert">
          Não foi possível confirmar a disponibilidade. Atualize a página para tentar novamente.
        </p>
      ) : null}
      {error ? <p className="pricing-checkout-error" role="alert">{error}</p> : null}
    </>
  );
}
