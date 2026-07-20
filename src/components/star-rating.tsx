"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Check, ShieldCheck, Sparkles, Star } from "lucide-react";
import { BrandMarkAnimated } from "@/components/brand-mark-animated";
import {
  fetchRatingStats,
  formatRatingAverage,
  hasRated,
  RATING_UPDATED_EVENT,
  submitRating,
  type RatingStats,
} from "@/lib/ratings";

function StarButton({
  index,
  filled,
  half,
  onPick,
  disabled,
  size = "md",
}: {
  index: number;
  filled: boolean;
  half?: boolean;
  onPick: (n: number) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const dim =
    size === "xl"
      ? "h-11 w-11 sm:h-12 sm:w-12"
      : size === "lg"
        ? "h-8 w-8"
        : size === "sm"
          ? "h-5 w-5"
          : "h-6 w-6";
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`${index} نجوم`}
      onClick={() => onPick(index)}
      className={`relative ${dim} transition hover:scale-110 disabled:cursor-default disabled:hover:scale-100`}
    >
      <Star
        className={`${dim} fill-[#e5e5e5] text-[#e5e5e5]`}
        strokeWidth={1.5}
      />
      {(filled || half) && (
        <span
          className={`absolute inset-0 overflow-hidden ${half ? "w-1/2" : "w-full"}`}
        >
          <Star
            className={`${dim} fill-[#E8874A] text-[#E8874A] drop-shadow-[0_1px_2px_rgba(232,135,74,0.4)]`}
            strokeWidth={1.5}
          />
        </span>
      )}
    </button>
  );
}

export function StarsRow({
  value,
  onPick,
  disabled,
  size = "md",
}: {
  value: number;
  onPick?: (n: number) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const interactive = Boolean(onPick) && !disabled;
  return (
    <div className="flex items-center gap-1 sm:gap-1.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = value >= n;
        const half = !filled && value >= n - 0.5;
        return (
          <StarButton
            key={n}
            index={n}
            filled={filled}
            half={half}
            disabled={!interactive}
            size={size}
            onPick={(v) => onPick?.(v)}
          />
        );
      })}
    </div>
  );
}

export function ToolRatingBar({
  target,
  label = "قيّم هذه الأداة",
  className = "",
}: {
  target: string;
  label?: string;
  className?: string;
}) {
  const [stats, setStats] = useState<RatingStats>({ average: 0, count: 0 });
  const [voted, setVoted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState(0);

  useEffect(() => {
    setVoted(hasRated(target));
    void fetchRatingStats(target).then(setStats);
    const onUp = (e: Event) => {
      const detail = (e as CustomEvent<{ target: string }>).detail;
      if (detail?.target === target) {
        setVoted(true);
        void fetchRatingStats(target).then(setStats);
      }
    };
    window.addEventListener(RATING_UPDATED_EVENT, onUp);
    return () => window.removeEventListener(RATING_UPDATED_EVENT, onUp);
  }, [target]);

  async function pick(stars: number) {
    if (busy) return;
    setBusy(true);
    try {
      const next = await submitRating(target, stars);
      setStats(next);
      setVoted(true);
    } finally {
      setBusy(false);
    }
  }

  const display = hover || stats.average;

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-3 border-t border-dashed border-[#ddd] pt-8 ${className}`}
    >
      <p className="text-base font-bold text-[#111]">{label}</p>
      <div
        onMouseLeave={() => setHover(0)}
        className="flex flex-wrap items-center justify-center gap-3"
      >
        <div
          className="flex cursor-pointer"
          onMouseMove={(e) => {
            if (busy) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const n = Math.min(5, Math.max(1, Math.ceil((x / rect.width) * 5)));
            setHover(n);
          }}
        >
          <StarsRow
            value={display}
            onPick={pick}
            disabled={busy}
            size="lg"
          />
        </div>
        <span className="text-sm font-semibold text-[#333]" dir="ltr">
          {stats.count > 0
            ? `${formatRatingAverage(stats.average)} / 5`
            : "— / 5"}
        </span>
        <span className="text-sm text-[#666]">
          {stats.count > 0 ? `${stats.count} صوتاً` : "كن أول من يقيّم"}
        </span>
      </div>
      {voted ? (
        <span className="w-full text-center text-xs font-medium text-emerald-700 sm:w-auto">
          شكراً لتقييمك — يمكنك تغيير النجوم في أي وقت
        </span>
      ) : (
        <span className="w-full text-center text-xs text-[#888] sm:w-auto">
          اضغط على النجوم للتقييم
        </span>
      )}
    </div>
  );
}

const HINTS = ["سيء", "مقبول", "جيد", "رائع", "ممتاز"] as const;

export function SiteRatingCard() {
  const [stats, setStats] = useState<RatingStats>({ average: 0, count: 0 });
  const [voted, setVoted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState(0);

  useEffect(() => {
    setVoted(hasRated("site"));
    void fetchRatingStats("site").then(setStats);
    const onUp = (e: Event) => {
      const detail = (e as CustomEvent<{ target: string }>).detail;
      if (detail?.target === "site") {
        setVoted(true);
        void fetchRatingStats("site").then(setStats);
      }
    };
    window.addEventListener(RATING_UPDATED_EVENT, onUp);
    return () => window.removeEventListener(RATING_UPDATED_EVENT, onUp);
  }, []);

  async function pick(stars: number) {
    if (busy) return;
    setBusy(true);
    try {
      await submitRating("site", stars);
      // الموقع يعرض تجميع كل تقييمات الأدوات + تقييم الموقع
      const next = await fetchRatingStats("site");
      setStats(next);
      setVoted(true);
    } finally {
      setBusy(false);
    }
  }

  const preview = hover || Math.round(stats.average) || 0;
  const hint = preview >= 1 ? HINTS[Math.min(5, preview) - 1] : "اضغط على النجوم للتقييم";

  return (
    <section className="relative mt-14 overflow-hidden border-y border-[#dce8f5] bg-[#eef5fc]">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(245,197,24,0.22), transparent 55%), radial-gradient(ellipse 45% 55% at 0% 100%, rgba(91,155,245,0.2), transparent 50%), radial-gradient(ellipse 40% 45% at 100% 80%, rgba(232,135,74,0.16), transparent 48%)",
        }}
      />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 py-14 text-center sm:px-6 sm:py-16">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/brand/logo-hero-eyes.png"
            alt="Tool2Day"
            width={720}
            height={180}
            className="h-auto w-full max-w-[16rem] object-contain sm:max-w-[22rem]"
            unoptimized
          />
          <BrandMarkAnimated size={52} motion="morph" />
        </div>

        <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-[#122033] sm:text-4xl">
          ما رأيك في الموقع؟
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-8 text-[#3d4f63]">
          تقييمك من هنا ومن كل الأدوات يتجمّع هنا — ويساعدنا على إبقاء Tool2Day{" "}
          <span className="font-bold text-[#122033]">مجانياً بالكامل</span> وبدون
          علامة مائية.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-100">
            <Sparkles className="h-3.5 w-3.5" />
            مجاني بالكامل
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold text-sky-800 ring-1 ring-sky-100">
            <ShieldCheck className="h-3.5 w-3.5" />
            بدون علامة مائية
          </span>
        </div>

        <div className="mt-10 w-full max-w-lg rounded-2xl border border-white/80 bg-white/80 px-5 py-8 shadow-[0_12px_40px_rgba(18,32,51,0.08)] backdrop-blur-sm sm:px-10 sm:py-10">
          {voted ? (
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
              <Check className="h-4 w-4" />
              شكراً — يمكنك تغيير النجوم في أي وقت
            </div>
          ) : (
            <p className="mb-5 text-sm font-bold text-[#E8874A]">{hint}</p>
          )}

          <div
            className="flex flex-col items-center gap-5"
            onMouseLeave={() => setHover(0)}
          >
            <div
              className="flex cursor-pointer justify-center"
              onMouseMove={(e) => {
                if (busy) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const n = Math.min(
                  5,
                  Math.max(1, Math.ceil((x / rect.width) * 5)),
                );
                setHover(n);
              }}
            >
              <StarsRow
                value={hover || stats.average}
                onPick={pick}
                disabled={busy}
                size="xl"
              />
            </div>

            <div className="flex items-end justify-center gap-2" dir="ltr">
              <span className="text-5xl font-extrabold tabular-nums tracking-tight text-[#122033] sm:text-6xl">
                {stats.count > 0 ? formatRatingAverage(stats.average) : "—"}
              </span>
              <span className="mb-2 text-lg font-semibold text-[#8a9aab]">
                / 5
              </span>
            </div>

            <p className="text-sm text-[#5a6d80]">
              {stats.count > 0
                ? `تجميع ${stats.count} تقييماً من كل الأدوات والموقع`
                : "كن أول من يقيّم — التقييمات من الأدوات تظهر هنا أيضاً"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
