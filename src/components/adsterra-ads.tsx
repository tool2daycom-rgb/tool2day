"use client";

import { useEffect, useId, useState } from "react";
import {
  ADSTERRA_BANNERS,
  ADSTERRA_NATIVE,
  ADSTERRA_POPUNDER,
  ADSTERRA_SOCIAL_BAR,
  type AdsterraBannerSize,
} from "@/lib/adsterra";
import { getStoredConsent } from "@/lib/cookie-consent";

function adsAllowed(): boolean {
  const c = getStoredConsent();
  if (!c) return true;
  return c.advertising;
}

function appendScript(id: string, src: string, parent: HTMLElement) {
  if (document.getElementById(id)) return;
  const el = document.createElement("script");
  el.id = id;
  el.async = true;
  el.src = src;
  parent.appendChild(el);
}

/** Popunder in head + social bar near body end. */
export function AdsterraGlobalScripts() {
  useEffect(() => {
    const apply = () => {
      if (!adsAllowed()) return;
      appendScript("adsterra-popunder", ADSTERRA_POPUNDER, document.head);
      appendScript("adsterra-socialbar", ADSTERRA_SOCIAL_BAR, document.body);
    };
    apply();
    window.addEventListener("storage", apply);
    window.addEventListener("tool2day:consent", apply);
    return () => {
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
  const uid = useId().replace(/:/g, "");

  return (
    <div
      className={`flex items-center justify-center overflow-hidden bg-[#f3f3f3] ${className}`}
      style={{ minHeight: unit.height, minWidth: Math.min(unit.width, 320) }}
      aria-label="Advertisement"
      data-ad={size}
    >
      <iframe
        id={`adsterra-${size}-${uid}`}
        title={`Advertisement ${size}`}
        src={`/ads/${size}.html`}
        width={unit.width}
        height={unit.height}
        className="max-w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
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
      className={`mx-auto w-full max-w-5xl px-3 py-3 ${className}`}
      aria-label="Advertisement"
    >
      <div id={ADSTERRA_NATIVE.containerId} />
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
