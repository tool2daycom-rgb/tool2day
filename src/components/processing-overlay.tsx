"use client";

import { useEffect, useState } from "react";

const WAIT_MIN_MS = 2_000;

/**
 * Simple processing wait UI — no third-party ads (kept clean for AdSense review).
 */
export function ProcessingOverlay({
  open,
  label,
}: {
  open: boolean;
  label?: string;
}) {
  const [active, setActive] = useState(false);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (!open) return;
    setActive(true);
    setCanClose(false);
    const started = Date.now();
    const tick = window.setInterval(() => {
      if (Date.now() - started >= WAIT_MIN_MS) {
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

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0a0a0a]/45 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label={label || "جارٍ المعالجة…"}
    >
      <div className="relative w-full max-w-sm rounded-2xl border border-white/15 bg-white px-5 py-8 text-center shadow-xl">
        {canClose ? (
          <button
            type="button"
            onClick={() => setActive(false)}
            className="absolute end-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#111] text-lg font-bold text-white"
            aria-label="إغلاق"
          >
            ×
          </button>
        ) : null}
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#eee] border-t-[#111]" />
        <p className="text-sm font-bold text-[#111]">{label || "جارٍ المعالجة…"}</p>
        <p className="mt-2 text-xs text-[#666]">
          {canClose ? "يمكنك المتابعة" : "يرجى الانتظار…"}
        </p>
      </div>
    </div>
  );
}
