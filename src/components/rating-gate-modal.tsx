"use client";

import { useEffect, useState } from "react";
import { BrandMarkAnimated } from "@/components/brand-mark-animated";
import { StarsRow } from "@/components/star-rating";
import {
  getDownloadRatingContext,
  hasRated,
  RATING_NEEDED_EVENT,
  resolveRatingGate,
  submitRating,
} from "@/lib/ratings";

export function RatingGateModal() {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<string | null>(null);
  const [picked, setPicked] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onNeed = (e: Event) => {
      const detail = (e as CustomEvent<{ target: string }>).detail;
      const t = detail?.target || getDownloadRatingContext();
      if (!t) return;
      if (hasRated(t)) {
        resolveRatingGate(true);
        return;
      }
      setTarget(t);
      setPicked(0);
      setError(null);
      setOpen(true);
    };
    window.addEventListener(RATING_NEEDED_EVENT, onNeed);
    return () => window.removeEventListener(RATING_NEEDED_EVENT, onNeed);
  }, []);

  if (!open || !target) return null;

  const isSite = target === "site";
  const title = isSite ? "قيّم الموقع أولاً" : "قيّم الأداة قبل التنزيل";

  async function confirm() {
    if (!target) return;
    if (picked < 1) {
      setError("اختر تقييماً من 1 إلى 5 نجوم");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitRating(target, picked);
      setOpen(false);
      resolveRatingGate(true);
    } catch {
      setError("تعذّر حفظ التقييم، حاول مرة أخرى");
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    setOpen(false);
    resolveRatingGate(false);
  }

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rating-gate-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#0a0a0a]/50 backdrop-blur-[2px]"
        aria-label="إغلاق"
        onClick={cancel}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.2)] sm:p-8">
        <div className="flex flex-col items-center text-center">
          <BrandMarkAnimated size={44} motion="morph" />
          <h2
            id="rating-gate-title"
            className="mt-4 text-xl font-bold text-[#111]"
          >
            {title}
          </h2>
          <p className="mt-2 text-sm leading-7 text-[#555]">
            التقييم إلزامي مرة واحدة لكل أداة قبل تنزيل الملف. يساعدنا على إبقاء
            Tool2Day مجانياً وبدون علامة مائية.
          </p>
          <div className="mt-6">
            <StarsRow value={picked} onPick={setPicked} size="lg" />
          </div>
          {error ? (
            <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
          ) : null}
          <div className="mt-6 flex w-full flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              disabled={busy}
              onClick={() => void confirm()}
              className="flex-1 rounded-xl bg-[#111] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#222] disabled:opacity-60"
            >
              {busy ? "جاري الحفظ…" : "تأكيد والتنزيل"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={cancel}
              className="flex-1 rounded-xl border border-[#ddd] px-5 py-3 text-sm font-semibold text-[#555] transition hover:bg-[#fafafa]"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
