"use client";

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
        className={`${dim} fill-[#d4d4d4] text-[#d4d4d4]`}
        strokeWidth={1.5}
      />
      {(filled || half) && (
        <span
          className={`absolute inset-0 overflow-hidden ${half ? "w-1/2" : "w-full"}`}
        >
          <Star
            className={`${dim} fill-[#F5C518] text-[#F5C518] drop-shadow-[0_1px_2px_rgba(245,197,24,0.45)]`}
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
    if (voted || busy) return;
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
        className="flex items-center gap-3"
      >
        <div
          className="flex"
          onMouseMove={(e) => {
            if (voted) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const n = Math.min(5, Math.max(1, Math.ceil((x / rect.width) * 5)));
            setHover(n);
          }}
        >
          <StarsRow
            value={display}
            onPick={voted ? undefined : pick}
            disabled={voted || busy}
            size="md"
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
          شكراً لتقييمك
        </span>
      ) : null}
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
    if (voted || busy) return;
    setBusy(true);
    try {
      const next = await submitRating("site", stars);
      setStats(next);
      setVoted(true);
    } finally {
      setBusy(false);
    }
  }

  const preview = hover || (voted ? Math.round(stats.average) : 0);
  const hint = preview >= 1 ? HINTS[preview - 1] : "اضغط على النجوم للتقييم";

  return (
    <section className="relative mt-14 overflow-hidden border-y border-[#1a1a1a] bg-[#0f0f0f] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% -10%, rgba(245,197,24,0.18), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(91,155,245,0.12), transparent 50%), radial-gradient(ellipse 40% 35% at 0% 80%, rgba(232,135,74,0.12), transparent 45%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 py-14 text-center sm:px-6 sm:py-16">
        <BrandMarkAnimated size={56} motion="morph" />

        <p className="mt-5 font-[family-name:var(--font-syne)] text-xs font-extrabold tracking-[0.2em] text-[#F5C518] uppercase">
          TOOL2DAY
        </p>

        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          ما رأيك في الموقع؟
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-8 text-white/70">
          تقييمك يساعدنا على تطوير الأدوات وإبقائها{" "}
          <span className="font-semibold text-white">مجانية بالكامل</span> وبدون
          علامة مائية.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            مجاني بالكامل
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-sky-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            بدون علامة مائية
          </span>
        </div>

        <div className="mt-10 w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-8 backdrop-blur-sm sm:px-10 sm:py-10">
          {voted ? (
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1.5 text-sm font-bold text-emerald-300">
              <Check className="h-4 w-4" />
              شكراً — تم حفظ تقييمك
            </div>
          ) : (
            <p className="mb-5 text-sm font-semibold text-[#F5C518]">{hint}</p>
          )}

          <div
            className="flex flex-col items-center gap-5"
            onMouseLeave={() => setHover(0)}
          >
            <div
              className="flex justify-center"
              onMouseMove={(e) => {
                if (voted) return;
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
                value={hover || stats.average || (voted ? stats.average : 0)}
                onPick={voted ? undefined : pick}
                disabled={voted || busy}
                size="xl"
              />
            </div>

            <div className="flex items-end justify-center gap-2" dir="ltr">
              <span className="text-5xl font-extrabold tabular-nums tracking-tight text-white sm:text-6xl">
                {stats.count > 0 ? formatRatingAverage(stats.average) : "—"}
              </span>
              <span className="mb-2 text-lg font-semibold text-white/45">
                / 5
              </span>
            </div>

            <p className="text-sm text-white/55">
              {stats.count > 0
                ? `بناءً على ${stats.count} تقييماً من مستخدمي Tool2Day`
                : "كن أول من يقيّم الموقع"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
