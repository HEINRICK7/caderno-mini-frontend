"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";
const hasPixelId = /^\d+$/.test(pixelId);

function isMarketingPage(pathname: string) {
  return pathname === "/" || pathname === "/templates";
}

export function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousLocation = useRef<string | null>(null);
  const search = searchParams.toString();
  const location = `${pathname}${search ? `?${search}` : ""}`;
  const shouldTrack = Boolean(pathname && isMarketingPage(pathname));

  useEffect(() => {
    if (!pathname) return;

    if (previousLocation.current !== null && previousLocation.current !== location && shouldTrack) {
      window.fbq?.("track", "PageView");
    }

    previousLocation.current = location;
  }, [location, pathname, shouldTrack]);

  if (!hasPixelId || !shouldTrack) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
      </Script>
      <noscript>
        {/* The image pixel is needed when JavaScript is disabled. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          alt=""
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
