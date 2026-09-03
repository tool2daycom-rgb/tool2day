"use client";

import { useEffect, useRef, useState } from "react";
import {
  ADSTERRA_BANNERS,
  ADSTERRA_NATIVE,
  ADSTERRA_POPUNDER,
  ADSTERRA_SMARTLINK,
  ADSTERRA_SOCIAL_BAR,
  type AdsterraBannerSize,
} from "@/lib/adsterra";
import { getStoredConsent } from "@/lib/cookie-consent";

declare global {
  interface Window {
    atOptions?: Record<string, unknown>;
  }
}

function adsAllowed(): boolean {
  const c = getStoredConsent();
  if (!c) return true;
  return c.advertising;
}

function appendScriptOnce(id: string, src: string, parent: HTMLElement) {
  if (document.getElementById(id)) return;
  const el = document.createElement("script");
  el.id = id;
  el.async = true;
  el.src = src;
  parent.appendChild(el);
}

/** Serialize banner loads — Adsterra shares global `atOptions`. */
let bannerChain: Promise<void> = Promise.resolve();

function enqueueBanner(
  host: HTMLElement,
  unit: { key: string; width: number; height: number },
): Promise<void> {
  bannerChain = bannerChain.then(
    () =>
      new Promise<void>((resolve) => {
        if (!host.isConnected) {
          resolve();
          return;
        }
        host.replaceChildren();
        window.atOptions = {
          key: unit.key,
          format: "iframe",
          height: unit.height,
          width: unit.width,
          params: {},
        };
        const s = document.createElement("script");
        s.type = "text/javascript";
        s.src = `https://www.highperformanceformat.com/${unit.key}/invoke.js`;
        s.onload = () => window.setTimeout(resolve, 150);
        s.onerror = () => resolve();
        host.appendChild(s);
      }),
  );
  return bannerChain;
}

/** Popunder + Social Bar site-wide. */
export function AdsterraGlobalScripts() {
  useEffect(() => {
    const apply = () => {
      if (!adsAllowed()) return;
      appendScriptOnce("adsterra-popunder", ADSTERRA_POPUNDER, document.head);
      appendScriptOnce("adsterra-socialbar", ADSTERRA_SOCIAL_BAR, document.body);
    };
    apply();
    const t = window.setTimeout(apply, 1200);
    window.addEventListener("storage", apply);
    window.addEventListener("tool2day:consent", apply);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("storage", apply);
      window.removeEventListener("tool2day:consent", apply);
    };
  }, []);
  return null;
}

export function AdsterraBanner({
  size,
  className = "",
}: {
  size: AdsterraBannerSize;
  className?: string;
}) {
  const unit = ADSTERRA_BANNERS[size];
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !adsAllowed()) return;
    let cancelled = false;
    void enqueueBanner(host, unit).then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [unit]);

  return (
    <div
      className={`mx-auto flex flex-col items-center justify-center overflow-hidden rounded-md border border-[#e8e8e8] bg-[#fafafa] ${className}`}
      style={{ minHeight: unit.height, width: "100%", maxWidth: unit.width }}
      aria-label="Advertisement"
      data-ad={size}
    >
      <div
        ref={hostRef}
        className="flex items-center justify-center"
        style={{ width: unit.width, height: unit.height, maxWidth: "100%" }}
      />
    </div>
  );
}

export function AdsterraNative({ className = "" }: { className?: string }) {
  useEffect(() => {
    if (!adsAllowed()) return;
    if (document.getElementById("adsterra-native-invoke")) return;
    const s = document.createElement("script");
    s.id = "adsterra-native-invoke";
    s.async = true;
    s.dataset.cfasync = "false";
    s.src = ADSTERRA_NATIVE.script;
    document.body.appendChild(s);
  }, []);

  return (
    <div
      className={`mx-auto my-4 w-full max-w-5xl rounded-md border border-[#e8e8e8] bg-[#fafafa] px-3 py-4 ${className}`}
      aria-label="Advertisement"
    >
      <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wide text-[#aaa]">
        Ad
      </p>
      <div id={ADSTERRA_NATIVE.containerId} />
      <p className="mt-2 text-center text-xs">
        <a
          href={ADSTERRA_SMARTLINK}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="font-semibold text-[#2563eb] hover:underline"
        >
          Offers
        </a>
      </p>
    </div>
  );
}

/** Mid-page 300×250 block for tool / home content. */
export function AdsterraInContent({ className = "" }: { className?: string }) {
  return (
    <div className={`my-6 flex justify-center px-3 ${className}`}>
      <AdsterraBanner size="300x250" />
    </div>
  );
}

/** Sticky mobile bottom banner. */
export function AdsterraMobileSticky() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] flex justify-center border-t border-[#e5e5e5] bg-white/95 py-1 backdrop-blur sm:hidden">
      <AdsterraBanner size="320x50" className="border-0 bg-transparent" />
    </div>
  );
}

/** Center-screen 300×250 while waiting — closes when done, or via X. */
export function AdsterraWaitOverlay({
  open,
  label,
}: {
  open: boolean;
  label?: string;
}) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (open) setDismissed(false);
  }, [open]);

  if (!open || dismissed) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0a0a0a]/55 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={label || "جارٍ التحميل…"}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="إغلاق الإعلان"
        onClick={() => setDismissed(true)}
      />
      <div className="relative z-[1] flex w-full max-w-[340px] flex-col items-center rounded-2xl border border-white/15 bg-white px-4 pb-4 pt-10 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute end-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#111] text-lg font-bold leading-none text-white transition hover:bg-[#333]"
          aria-label="إغلاق"
        >
          ×
        </button>
        <p className="mb-3 text-center text-sm font-bold text-[#111]">
          {label || "جارٍ التحميل…"}
        </p>
        <AdsterraBanner size="300x250" />
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-[#999]">
          Ad
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="mt-3 text-xs font-semibold text-[#2563eb] hover:underline"
        >
          إغلاق والمتابعة
        </button>
      </div>
    </div>
  );
}
