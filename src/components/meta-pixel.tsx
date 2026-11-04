"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { checkoutPlanDetails, type CheckoutPlan } from "@/domain/checkout-plan";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    __cadernoMetaPixelQueue?: Array<{ name: string; params?: Record<string, string | number> }>;
  }
}

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

export function trackMetaEvent(name: "PageView" | "InitiateCheckout" | "Purchase", params?: Record<string, string | number>) {
  if (!hasPixelId || typeof window === "undefined") return false;
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
  const search = searchParams.toString();
  const location = `${pathname}${search ? `?${search}` : ""}`;
  const shouldTrack = Boolean(pathname && isMarketingPage(pathname));
  const shouldLoad = Boolean(pathname && shouldLoadPixel(pathname));

  useEffect(() => {
    if (!pathname) return;

    if (previousLocation.current !== location && shouldTrack) {
      trackMetaEvent("PageView");
    }

    previousLocation.current = location;
  }, [location, pathname, shouldTrack]);

  if (!hasPixelId || !shouldLoad) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');(window.__cadernoMetaPixelQueue||[]).forEach(function(e){fbq('track',e.name,e.params)});window.__cadernoMetaPixelQueue=[];`}
      </Script>
      {shouldTrack ? <noscript>
        {/* The image pixel is needed when JavaScript is disabled. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          alt=""
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript> : null}
    </>
  );
}
