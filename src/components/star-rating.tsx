"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
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
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "lg" ? "h-8 w-8" : size === "sm" ? "h-5 w-5" : "h-6 w-6";
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`${index} نجوم`}
      onClick={() => onPick(index)}
      className={`relative ${dim} transition hover:scale-110 disabled:cursor-default disabled:hover:scale-100`}
    >
      <Star className={`${dim} fill-[#e5e5e5] text-[#e5e5e5]`} />
      {(filled || half) && (
        <span
          className={`absolute inset-0 overflow-hidden ${half ? "w-1/2" : "w-full"}`}
        >
          <Star className={`${dim} fill-[#F5C518] text-[#F5C518]`} />
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
  size?: "sm" | "md" | "lg";
}) {
  const interactive = Boolean(onPick) && !disabled;
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
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
          {stats.count > 0 ? `${formatRatingAverage(stats.average)} / 5` : "— / 5"}
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

export function SiteRatingCard() {
  return (
    <div className="mx-auto mt-10 max-w-5xl px-4 sm:px-6">
      <div className="rounded-2xl border border-[#e8e8e8] bg-white px-6 py-8 text-center shadow-[0_1px_0_rgba(0,0,0,0.03)] sm:px-10">
        <h2 className="text-xl font-bold text-[#111] sm:text-2xl">
          قيّم موقع Tool2Day
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-[#555]">
          رأيك يساعدنا على إبقاء الأدوات مجانية بالكامل وبدون علامة مائية.
        </p>
        <ToolRatingBar
          target="site"
          label="قيّم الموقع"
          className="mt-4 border-0 pt-2"
        />
      </div>
    </div>
  );
}
