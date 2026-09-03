"use client";

import { useEffect, useMemo } from "react";
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
  const srcDoc = useMemo(
    () =>
      `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body>
<script>atOptions={key:'${unit.key}',format:'iframe',height:${unit.height},width:${unit.width},params:{}};</script>
<script src="https://www.highperformanceformat.com/${unit.key}/invoke.js"><\/script>
</body></html>`,
    [unit.key, unit.height, unit.width],
  );

  return (
    <div
      className={`flex justify-center overflow-hidden ${className}`}
      aria-label="Advertisement"
    >
      <iframe
        title="Advertisement"
        width={unit.width}
        height={unit.height}
        srcDoc={srcDoc}
        className="max-w-full border-0"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        loading="lazy"
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

/** Center-screen 300×250 while a download/extract is in progress. */
export function AdsterraWaitOverlay({
  open,
  label,
}: {
  open: boolean;
  label?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0a0a0a]/55 p-4 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
    >
      <div className="flex w-full max-w-[340px] flex-col items-center rounded-2xl border border-white/15 bg-white px-4 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <p className="mb-3 text-center text-sm font-bold text-[#111]">
          {label || "جارٍ التحميل…"}
        </p>
        <AdsterraBanner size="300x250" />
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-[#999]">
          Ad
        </p>
      </div>
    </div>
  );
}
