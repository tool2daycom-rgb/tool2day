"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { User as AuthUser } from "@supabase/supabase-js";
import { Check, MessageCircleHeart, ShieldCheck, Sparkles, Star } from "lucide-react";
import { BrandMarkAnimated } from "@/components/brand-mark-animated";
import { useLocale } from "@/components/locale-provider";
import { createClient } from "@/lib/supabase/client";
import {
  fetchRatingStats,
  formatRatingAverage,
  getMyStars,
  hasRatedSite,
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
  onPick?: (n: number) => void;
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
  const interactive = Boolean(onPick) && !disabled;
  return (
    <button
      type="button"
      disabled={!interactive}
      aria-label={`${index} نجوم`}
      onClick={() => onPick?.(index)}
      className={`relative ${dim} ${interactive ? "cursor-pointer transition hover:scale-110" : "cursor-default"}`}
    >
      <Star
        className={`${dim} ${
          filled
            ? "fill-[#E8874A] text-[#E8874A]"
            : half
              ? "fill-[#e5e5e5] text-[#e5e5e5]"
              : "fill-[#e5e5e5] text-[#e5e5e5]"
        }`}
        strokeWidth={1.25}
      />
      {half && !filled ? (
        <span className="absolute inset-0 w-1/2 overflow-hidden">
          <Star
            className={`${dim} fill-[#E8874A] text-[#E8874A]`}
            strokeWidth={1.25}
          />
        </span>
      ) : null}
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
            disabled={disabled}
            size={size}
            onPick={onPick}
          />
        );
      })}
    </div>
  );
}

/** عرض فقط — التقييم يتم مرة واحدة بعد استخدام الأداة (قبل التنزيل) */
export function ToolRatingBar({
  target,
  label,
  className = "",
}: {
  target: string;
  label?: string;
  className?: string;
}) {
  const { messages } = useLocale();
  const [stats, setStats] = useState<RatingStats>({ average: 0, count: 0 });
  const [myStars, setMyStars] = useState(0);
  const resolvedLabel = label ?? messages.rateTool;

  useEffect(() => {
    setMyStars(getMyStars(target));
    void fetchRatingStats(target).then(setStats);
    const onUp = (e: Event) => {
      const detail = (e as CustomEvent<{ target: string }>).detail;
      if (detail?.target === target) {
        setMyStars(getMyStars(target));
        void fetchRatingStats(target).then(setStats);
      }
    };
    window.addEventListener(RATING_UPDATED_EVENT, onUp);
    return () => window.removeEventListener(RATING_UPDATED_EVENT, onUp);
  }, [target]);

  const display = stats.average || myStars;

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-3 border-t border-dashed border-[#ddd] pt-8 ${className}`}
    >
      <p className="text-base font-bold text-[#111]">{resolvedLabel}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <StarsRow value={display} disabled size="lg" />
        <span className="text-sm font-semibold text-[#333]" dir="ltr">
          {stats.count > 0
            ? `${formatRatingAverage(stats.average)} / 5`
            : "— / 5"}
        </span>
        <span className="text-sm text-[#666]">
          {stats.count > 0
            ? `${stats.count} ${messages.ratingsCount}`
            : messages.noRatingsYet}
        </span>
      </div>
      <p className="w-full text-center text-xs text-[#888]">
        {messages.rateOnceOnDownload}
      </p>
    </div>
  );
}

function authDisplayName(user: AuthUser): string {
  const meta = user.user_metadata || {};
  const raw =
    meta.full_name ||
    meta.name ||
    meta.preferred_username ||
    user.email?.split("@")[0] ||
    "";
  return String(raw).trim().slice(0, 60);
}

export function SiteRatingCard() {
  const { messages } = useLocale();
  const [stats, setStats] = useState<RatingStats>({ average: 0, count: 0 });
  const [voted, setVoted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState(0);
  const [picked, setPicked] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [comment, setComment] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const HINTS = [
    messages.starBad,
    messages.starOk,
    messages.starGood,
    messages.starGreat,
    messages.starExcellent,
  ] as const;

  useEffect(() => {
    setVoted(hasRatedSite());
    setPicked(getMyStars("site"));
    void fetchRatingStats("site").then(setStats);
    const onUp = (e: Event) => {
      const detail = (e as CustomEvent<{ target: string }>).detail;
      if (detail?.target === "site") {
        setVoted(hasRatedSite());
        setPicked(getMyStars("site"));
        void fetchRatingStats("site").then(setStats);
      }
    };
    window.addEventListener(RATING_UPDATED_EVENT, onUp);
    return () => window.removeEventListener(RATING_UPDATED_EVENT, onUp);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (cancelled) return;
        setUser(data.user);
        if (data.user) setDisplayName(authDisplayName(data.user));
        setAuthReady(true);
      });
      const { data } = supabase.auth.onAuthStateChange((_e, session) => {
        const next = session?.user ?? null;
        setUser(next);
        if (next) setDisplayName((prev) => prev || authDisplayName(next));
        setAuthReady(true);
      });
      subscription = data.subscription;
    } catch {
      if (!cancelled) setAuthReady(true);
    }
    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  async function pick(stars: number) {
    if (voted || busy) return;
    setPicked(stars);
    setHover(0);
  }

  async function save() {
    if (voted || busy || picked < 1 || !user) return;
    const name = displayName.trim() || authDisplayName(user);
    if (!name) return;
    setBusy(true);
    try {
      await submitRating("site", picked, {
        displayName: name,
        comment: comment.trim() || undefined,
      });
      const next = await fetchRatingStats("site");
      setStats(next);
      setVoted(true);
    } finally {
      setBusy(false);
    }
  }

  const preview = voted ? picked || stats.average : hover || picked;
  const hint =
    preview >= 1
      ? HINTS[Math.min(5, Math.round(preview)) - 1]
      : messages.clickStarsOnce;
  const loggedIn = Boolean(user);

  return (
    <section className="relative mt-14 overflow-hidden border-y border-[#dce8f5] bg-[#eef5fc]">
      <style>{`
        @keyframes testimonials-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(232, 135, 74, 0.45); }
          50% { transform: scale(1.03); box-shadow: 0 0 0 12px rgba(232, 135, 74, 0); }
        }
        .btn-testimonials-pulse {
          animation: testimonials-pulse 2.2s ease-in-out infinite;
        }
        .btn-testimonials-pulse:hover {
          animation-play-state: paused;
          transform: scale(1.04);
        }
      `}</style>
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
          {messages.siteFeedbackTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-8 text-[#3d4f63]">
          {messages.siteFeedbackSub}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-100">
            <Sparkles className="h-3.5 w-3.5" />
            {messages.completelyFree}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold text-sky-800 ring-1 ring-sky-100">
            <ShieldCheck className="h-3.5 w-3.5" />
            {messages.noWatermark}
          </span>
        </div>

        <div className="mt-10 w-full max-w-lg rounded-2xl border border-white/80 bg-white/80 px-5 py-8 shadow-[0_12px_40px_rgba(18,32,51,0.08)] backdrop-blur-sm sm:px-10 sm:py-10">
          {voted ? (
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
              <Check className="h-4 w-4" />
              {messages.thankYouRating}
            </div>
          ) : (
            <p className="mb-5 text-sm font-bold text-[#E8874A]">{hint}</p>
          )}

          <div
            className="flex flex-col items-center gap-5"
            onMouseLeave={() => setHover(0)}
          >
            <div
              className={`flex justify-center ${voted || !loggedIn ? "" : "cursor-pointer"}`}
              onMouseMove={(e) => {
                if (voted || busy || !loggedIn) return;
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
                value={preview || stats.average}
                onPick={voted || !loggedIn ? undefined : pick}
                disabled={voted || busy || !loggedIn}
                size="xl"
              />
            </div>

            {!voted && authReady && !loggedIn ? (
              <div className="w-full rounded-xl border border-[#f3e0d0] bg-[#fff8f2] px-4 py-4 text-center">
                <p className="text-sm font-bold text-[#7a4a28]">
                  {messages.loginToComment}
                </p>
                <Link
                  href="/login?next=/"
                  className="mt-3 inline-flex rounded-xl bg-[#122033] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#1c3048]"
                >
                  {messages.login}
                </Link>
              </div>
            ) : null}

            {!voted && loggedIn ? (
              <div className="w-full space-y-3 text-start">
                <label className="block text-xs font-bold text-[#444]">
                  {messages.reviewDisplayName}
                  <input
                    className="mt-1 w-full rounded-xl border border-[#ddd] bg-white px-3 py-2.5 text-sm font-semibold text-[#111]"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={messages.reviewDisplayNameHint}
                    maxLength={60}
                    disabled={busy}
                    autoComplete="nickname"
                  />
                </label>
                <label className="block text-xs font-bold text-[#444]">
                  {messages.reviewComment}
                  <textarea
                    className="mt-1 min-h-[88px] w-full resize-y rounded-xl border border-[#ddd] bg-white px-3 py-2.5 text-sm leading-6 text-[#111]"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={messages.reviewCommentHint}
                    maxLength={400}
                    disabled={busy}
                  />
                </label>
                <button
                  type="button"
                  disabled={busy || picked < 1 || !displayName.trim()}
                  onClick={() => void save()}
                  className="w-full rounded-xl bg-[#E8874A] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-40"
                >
                  {busy ? messages.saving : messages.publishReview}
                </button>
              </div>
            ) : null}

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
                ? `${stats.count} ${messages.ratingsAggregate}`
                : messages.noRatingsYet}
            </p>

            <Link
              href="/testimonials#write-review"
              className="btn-testimonials-pulse mt-1 inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-[#E8874A] via-[#f0a05f] to-[#F5C518] px-6 py-3 text-sm font-extrabold text-white shadow-[0_10px_28px_rgba(232,135,74,0.35)] transition hover:brightness-105"
            >
              <MessageCircleHeart className="h-4 w-4" />
              {messages.testimonialsTitle}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
