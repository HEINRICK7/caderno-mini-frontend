"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { checkoutPlanDetails, type CheckoutPlan } from "@/domain/checkout-plan";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    __cadernoMetaPixelQueue?: Array<{ name: string; params?: Record<string, string | number> }>;
  }
}

type MarketingConsent = "accepted" | "rejected" | null;
type MarketingConsentSnapshot = MarketingConsent | "loading";

const consentStorageKey = "caderno-meta-marketing-consent-v1";
const consentChangeEvent = "caderno-meta-consent-change";
const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";
const hasPixelId = /^\d+$/.test(pixelId);

function isMarketingPage(pathname: string) {
  return pathname === "/"
    || pathname === "/templates"
    || pathname.startsWith("/templates/")
    || pathname === "/como-funciona"
    || pathname === "/para-seu-negocio"
    || pathname === "/depoimentos";
}

function shouldLoadPixel(pathname: string) {
  return isMarketingPage(pathname)
    || pathname.startsWith("/mensagens/")
    || pathname.startsWith("/compras/");
}

function readMarketingConsent(): MarketingConsent {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(consentStorageKey);
    return stored === "accepted" || stored === "rejected" ? stored : null;
  } catch {
    return null;
  }
}

function subscribeToMarketingConsent(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(consentChangeEvent, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(consentChangeEvent, callback);
    window.removeEventListener("storage", callback);
  };
}

function getServerConsentSnapshot(): MarketingConsentSnapshot {
  return "loading";
}

function removeMetaPixelCookies() {
  for (const name of ["_fbp", "_fbc"]) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${window.location.hostname}; SameSite=Lax`;
  }
}

export function trackMetaEvent(name: "PageView" | "InitiateCheckout" | "Purchase", params?: Record<string, string | number>) {
  if (!hasPixelId || typeof window === "undefined" || readMarketingConsent() !== "accepted") return false;
  if (window.fbq) {
    window.fbq("track", name, params);
  } else {
    (window.__cadernoMetaPixelQueue ??= []).push({ name, params });
  }
  return true;
}

export function trackInitiateCheckout(plan: CheckoutPlan) {
  const details = checkoutPlanDetails[plan];
  trackMetaEvent("InitiateCheckout", {
    value: details.amountMinor / 100,
    currency: "BRL",
    content_name: details.name,
  });
}

export function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousLocation = useRef<string | null>(null);
  const consent = useSyncExternalStore(subscribeToMarketingConsent, readMarketingConsent, getServerConsentSnapshot);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [marketingSelected, setMarketingSelected] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const search = searchParams.toString();
  const location = `${pathname}${search ? `?${search}` : ""}`;
  const shouldTrack = Boolean(pathname && consent === "accepted" && isMarketingPage(pathname));
  const shouldLoad = Boolean(pathname && consent === "accepted" && shouldLoadPixel(pathname));
  const shouldOfferConsent = Boolean(pathname && shouldLoadPixel(pathname));

  useEffect(() => {
    if (!pathname || !shouldTrack) {
      previousLocation.current = null;
      return;
    }

    if (previousLocation.current !== location) trackMetaEvent("PageView");
    previousLocation.current = location;
  }, [location, pathname, shouldTrack]);

  function saveConsent(nextConsent: Exclude<MarketingConsent, null>) {
    try {
      window.localStorage.setItem(consentStorageKey, nextConsent);
    } catch {
      setSaveError(true);
      return;
    }

    setSaveError(false);
    window.dispatchEvent(new Event(consentChangeEvent));
    setPreferencesOpen(false);

    if (nextConsent === "accepted") {
      window.fbq?.("consent", "grant");
    } else {
      window.fbq?.("consent", "revoke");
      window.__cadernoMetaPixelQueue = [];
      removeMetaPixelCookies();
    }
  }

  function openPreferences() {
    setMarketingSelected(consent === "accepted");
    setSaveError(false);
    setPreferencesOpen(true);
  }

  if (!hasPixelId) return null;

  return (
    <>
      {shouldLoad ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('consent','revoke');fbq('init','${pixelId}');fbq('consent','grant');(window.__cadernoMetaPixelQueue||[]).forEach(function(e){fbq('track',e.name,e.params)});window.__cadernoMetaPixelQueue=[];`}
        </Script>
      ) : null}

      {consent !== "loading" && shouldOfferConsent && (consent === null || preferencesOpen) ? (
        <section className="meta-consent" aria-label="Preferências de cookies de marketing">
          <div className="meta-consent__copy">
            <span className="meta-consent__eyebrow">Sua privacidade</span>
            <h2>{preferencesOpen ? "Preferências de cookies" : "Medição opcional de anúncios"}</h2>
            <p>
              O Pixel da Meta ajuda a medir visitas e resultados de anúncios. Se você permitir,
              enviaremos à Meta informações sobre as páginas visitadas e eventos do site. A medição
              é opcional e sua escolha não altera o funcionamento do Cadernô Express.
            </p>
          </div>

          {preferencesOpen ? (
            <div className="meta-consent__details">
              <label className="meta-consent__toggle">
                <input
                  checked={marketingSelected}
                  onChange={(event) => setMarketingSelected(event.currentTarget.checked)}
                  type="checkbox"
                />
                <span>
                  <strong>Medição de anúncios (Meta Pixel)</strong>
                  <span>
                    Mede páginas, início de checkout e compras. Nos eventos de checkout e compra,
                    enviamos o nome do plano, o valor e a moeda. A Meta também pode receber dados
                    técnicos do navegador e identificadores de cookies que ela administra.
                  </span>
                </span>
              </label>
              <p className="meta-consent__retention">
                Esta escolha fica salva neste navegador até você alterá-la. Os cookies e prazos da
                Meta seguem as políticas da própria Meta e podem variar conforme o navegador.
              </p>
              <div className="meta-consent__links">
                <a href="https://www.facebook.com/privacy/policies/cookies" rel="noreferrer" target="_blank">
                  Política de cookies da Meta <span aria-hidden="true">↗</span>
                </a>
                <a href="https://www.facebook.com/privacy/policy/" rel="noreferrer" target="_blank">
                  Política de privacidade da Meta <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
          ) : null}

          {saveError ? (
            <p className="meta-consent__error" role="alert">
              Não foi possível salvar sua escolha neste navegador. A medição continuará desativada.
            </p>
          ) : null}

          <div className="meta-consent__actions">
            {preferencesOpen ? (
              <>
                <button className="meta-consent__button" onClick={() => saveConsent("rejected")} type="button">
                  Rejeitar medição
                </button>
                <button
                  className="meta-consent__button"
                  onClick={() => saveConsent(marketingSelected ? "accepted" : "rejected")}
                  type="button"
                >
                  Salvar preferências
                </button>
              </>
            ) : (
              <>
                <button className="meta-consent__button" onClick={() => saveConsent("rejected")} type="button">
                  Recusar medição
                </button>
                <button className="meta-consent__button" onClick={openPreferences} type="button">
                  Personalizar
                </button>
                <button className="meta-consent__button" onClick={() => saveConsent("accepted")} type="button">
                  Permitir medição
                </button>
              </>
            )}
          </div>
        </section>
      ) : null}

      {consent !== "loading" && shouldOfferConsent && consent !== null && !preferencesOpen ? (
        <button className="meta-consent__manage" onClick={openPreferences} type="button">
          Preferências de cookies
        </button>
      ) : null}
    </>
  );
}
