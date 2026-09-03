"use client";

import { useEffect, useState } from "react";
import {
  ADSTERRA_BANNERS,
  ADSTERRA_NATIVE,
  ADSTERRA_POPUNDER,
  ADSTERRA_SMARTLINK,
  ADSTERRA_SOCIAL_BAR,
  type AdsterraBannerSize,
} from "@/lib/adsterra";
import { getStoredConsent } from "@/lib/cookie-consent";

const WAIT_MIN_MS = 10_000;

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

function openSmartlink() {
  try {
    window.open(ADSTERRA_SMARTLINK, "_blank", "noopener,noreferrer");
  } catch {
    window.location.assign(ADSTERRA_SMARTLINK);
  }
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

/** Visible, always-clickable ad slot (Adsterra iframe + Smartlink fallback). */
export function AdsterraBanner({
  size,
  className = "",
}: {
  size: AdsterraBannerSize;
  className?: string;
}) {
  const unit = ADSTERRA_BANNERS[size];
  const compact = unit.height <= 60;

  return (
    <div
      className={`relative mx-auto overflow-hidden rounded-md border border-[#222] shadow-sm ${className}`}
      style={{ width: "100%", maxWidth: unit.width, height: unit.height }}
      aria-label="Advertisement"
      data-ad={size}
    >
      <a
        href={ADSTERRA_SMARTLINK}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`absolute inset-0 z-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#1d4ed8] to-[#e11d48] px-2 text-center font-bold text-white ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        <span>Sponsored Offer</span>
        <span
          className={`mt-1 font-semibold opacity-90 ${
            compact ? "text-[9px]" : "text-[10px]"
          }`}
        >
          اضغط للعرض · Ad
        </span>
      </a>
      <iframe
        title={`Advertisement ${size}`}
        src={`/ads/${size}.html`}
        width={unit.width}
        height={unit.height}
        className="pointer-events-none absolute inset-0 z-10 max-w-full border-0"
        loading="eager"
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
      className={`mx-auto my-4 w-full max-w-5xl rounded-md border border-[#ddd] bg-[#fafafa] px-3 py-4 ${className}`}
      aria-label="Advertisement"
    >
      <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wide text-[#aaa]">
        Ad
      </p>
      <div id={ADSTERRA_NATIVE.containerId} className="min-h-[40px]" />
      <a
        href={ADSTERRA_SMARTLINK}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="mt-2 flex min-h-[88px] items-center justify-center rounded-lg bg-gradient-to-r from-[#0a0a0a] via-[#1d4ed8] to-[#e11d48] px-4 text-center text-sm font-bold text-white"
      >
        Sponsored Offer — اضغط للعرض
      </a>
    </div>
  );
}

export function AdsterraInContent({ className = "" }: { className?: string }) {
  return (
    <div className={`my-6 flex justify-center px-3 ${className}`}>
      <AdsterraBanner size="300x250" />
    </div>
  );
}

export function AdsterraMobileSticky() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] flex justify-center border-t border-[#e5e5e5] bg-white/95 py-1 backdrop-blur sm:hidden">
      <AdsterraBanner size="320x50" className="border-0 shadow-none" />
    </div>
  );
}

/**
 * Center wait ad: ≥10 seconds; Exit/X opens smartlink first, then closes after lock.
 */
export function AdsterraWaitOverlay({
  open,
  label,
}: {
  open: boolean;
  label?: string;
}) {
  const [active, setActive] = useState(false);
  const [canClose, setCanClose] = useState(false);
  const [leftSec, setLeftSec] = useState(10);

  useEffect(() => {
    if (!open) return;
    setActive(true);
    setCanClose(false);
    setLeftSec(10);
    const started = Date.now();
    const tick = window.setInterval(() => {
      const left = Math.max(0, WAIT_MIN_MS - (Date.now() - started));
      setLeftSec(Math.ceil(left / 1000));
      if (left <= 0) {
        setCanClose(true);
        window.clearInterval(tick);
      }
    }, 200);
    return () => window.clearInterval(tick);
  }, [open]);

  useEffect(() => {
    if (!open && active && canClose) setActive(false);
  }, [open, active, canClose]);

  if (!active) return null;

  const tryClose = () => {
    openSmartlink();
    if (canClose) setActive(false);
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0a0a0a]/55 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={label || "جارٍ التحميل…"}
    >
      <div className="relative z-[1] flex w-full max-w-[340px] flex-col items-center rounded-2xl border border-white/15 bg-white px-4 pb-4 pt-10 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <button
          type="button"
          onClick={tryClose}
          className="absolute end-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#111] text-lg font-bold leading-none text-white transition hover:bg-[#333]"
          aria-label="فتح الإعلان ثم الإغلاق"
        >
          ×
        </button>
        <p className="mb-1 text-center text-sm font-bold text-[#111]">
          {label || "جارٍ التحميل…"}
        </p>
        <p className="mb-3 text-center text-[11px] font-semibold text-[#666]">
          {canClose
            ? "الخروج يفتح الإعلان أولاً ثم يغلق النافذة"
            : `يبقى ${leftSec} ثوانٍ — الضغط على × يفتح الإعلان`}
        </p>
        <AdsterraBanner size="300x250" />
        <button
          type="button"
          onClick={() => openSmartlink()}
          className="mt-2 w-full rounded-lg bg-[#e11d48] px-3 py-2.5 text-sm font-bold text-white hover:bg-[#be123c]"
        >
          فتح العرض الإعلاني
        </button>
        <button
          type="button"
          onClick={tryClose}
          className="mt-2 text-xs font-semibold text-[#2563eb] hover:underline"
        >
          {canClose
            ? "فتح الإعلان ثم إغلاق والمتابعة"
            : `انتظر ${leftSec}ث — أو اضغط × لفتح الإعلان`}
        </button>
      </div>
    </div>
  );
}
