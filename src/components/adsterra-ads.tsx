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

function isApprovedHost(): boolean {
  if (typeof window === "undefined") return true;
  const h = window.location.hostname.replace(/^www\./, "");
  return h === "tool2day.com" || h === "localhost" || h === "127.0.0.1";
}

function hasAdvertisingConsent(): boolean {
  return Boolean(getStoredConsent()?.advertising);
}

function useAdvertisingConsent() {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const sync = () => setAllowed(hasAdvertisingConsent());
    sync();
    window.addEventListener("tool2day:consent", sync);
    return () => window.removeEventListener("tool2day:consent", sync);
  }, []);
  return allowed;
}

/** Official Adsterra unit via same-origin /ads page (www.tool2day.com). */
export function AdsterraBanner({
  size,
  className = "",
}: {
  size: AdsterraBannerSize;
  className?: string;
}) {
  const unit = ADSTERRA_BANNERS[size];
  const allowed = useAdvertisingConsent();

  return (
    <div
      className={`mx-auto overflow-hidden bg-[#f5f5f5] ${className}`}
      style={{ width: unit.width, maxWidth: "100%", minHeight: unit.height }}
      aria-label="Advertisement"
      data-ad={size}
    >
      {allowed ? (
        <iframe
          title={`Adsterra ${size}`}
          src={`/ads/${size}.html`}
          width={unit.width}
          height={unit.height}
          className="max-w-full border-0"
          scrolling="no"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : null}
    </div>
  );
}

/** Popunder + Social Bar after advertising consent on approved host. */
export function AdsterraGlobalScripts() {
  const allowed = useAdvertisingConsent();
  useEffect(() => {
    if (!allowed || !isApprovedHost()) return;
    const apply = () => {
      appendScriptOnce("adsterra-popunder", ADSTERRA_POPUNDER, document.head);
      appendScriptOnce("adsterra-socialbar", ADSTERRA_SOCIAL_BAR, document.body);
    };
    apply();
    const t = window.setTimeout(apply, 800);
    return () => window.clearTimeout(t);
  }, [allowed]);
  return null;
}

export function AdsterraNative({ className = "" }: { className?: string }) {
  const allowed = useAdvertisingConsent();
  useEffect(() => {
    if (!allowed || !isApprovedHost()) return;
    const run = () => {
      if (document.getElementById("adsterra-native-invoke")) return;
      if (!document.getElementById(ADSTERRA_NATIVE.containerId)) return;
      const s = document.createElement("script");
      s.id = "adsterra-native-invoke";
      s.async = true;
      s.dataset.cfasync = "false";
      s.src = ADSTERRA_NATIVE.script;
      document.body.appendChild(s);
    };
    run();
    const t = window.setTimeout(run, 500);
    return () => window.clearTimeout(t);
  }, [allowed]);

  return (
    <div
      className={`mx-auto my-4 w-full max-w-5xl px-3 py-2 ${className}`}
      aria-label="Advertisement"
    >
      <div id={ADSTERRA_NATIVE.containerId} />
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

/**
 * Wait overlay during long processing.
 * ≥10s lock; Exit/X opens Smartlink first when ads are allowed.
 */
export function AdsterraWaitOverlay({
  open,
  label,
}: {
  open: boolean;
  label?: string;
}) {
  const allowed = useAdvertisingConsent();
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
    if (allowed) openSmartlink();
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
          aria-label={allowed ? "فتح الإعلان ثم الإغلاق" : "إغلاق"}
        >
          ×
        </button>
        <p className="mb-1 text-center text-sm font-bold text-[#111]">
          {label || "جارٍ التحميل…"}
        </p>
        <p className="mb-3 text-center text-[11px] font-semibold text-[#666]">
          {canClose
            ? allowed
              ? "الخروج يفتح الإعلان أولاً ثم يغلق النافذة"
              : "يمكنك المتابعة الآن"
            : `يبقى ${leftSec} ثوانٍ`}
        </p>
        {allowed ? (
          <div
            className="overflow-hidden bg-[#f5f5f5]"
            style={{ width: 300, height: 250, maxWidth: "100%" }}
          >
            <iframe
              title="Adsterra 300x250"
              src="/ads/300x250.html"
              width={300}
              height={250}
              className="max-w-full border-0"
              scrolling="no"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          <div className="flex h-[120px] w-full items-center justify-center rounded-lg bg-[#f5f5f5] text-xs text-[#888]">
            جارٍ المعالجة…
          </div>
        )}
        <button
          type="button"
          onClick={tryClose}
          className="mt-3 text-xs font-semibold text-[#2563eb] hover:underline"
        >
          {canClose
            ? allowed
              ? "فتح الإعلان ثم إغلاق والمتابعة"
              : "متابعة"
            : `انتظر ${leftSec}ث`}
        </button>
      </div>
    </div>
  );
}
