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
  formatRatingCount,
  getMyStars,
  hasRatedSite,
  RATING_UPDATED_EVENT,
  SITE_RATING_SEED_AVERAGE,
  SITE_RATING_SEED_COUNT,
  submitRating,
  toolSeedAverage,
  toolSeedCount,
  type RatingStats,
} from "@/lib/ratings";
import { countryFromAuthMeta } from "@/lib/profile-countries";
import { resolveUserAvatarUrl } from "@/lib/user-avatar";

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

/** تقييم تفاعلي على صفحة كل أداة — مرة واحدة لكل زائر + عدّاد بآلاف */
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
  const seedAvg = toolSeedAverage(target);
  const seedCount = toolSeedCount(target);
  const [stats, setStats] = useState<RatingStats>({
    average: seedAvg,
    count: seedCount,
  });
  const [myStars, setMyStars] = useState(0);
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState(0);
  const resolvedLabel = label ?? messages.rateTool;
  const voted = myStars >= 1;

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

  async function pick(stars: number) {
    if (voted || busy) return;
    setBusy(true);
    setMyStars(stars);
    try {
      const next = await submitRating(target, stars, { pageVote: true });
      setStats(next);
    } finally {
      setBusy(false);
    }
  }

  const display = hover || myStars || stats.average || seedAvg;

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-3 border-t border-dashed border-[#ddd] pt-8 ${className}`}
    >
      <p className="text-base font-bold text-[#111]">{resolvedLabel}</p>
      <div
        className="flex flex-wrap items-center justify-center gap-3"
        onMouseLeave={() => setHover(0)}
      >
        <div
          className={voted ? "" : "cursor-pointer"}
          onMouseMove={(e) => {
            if (voted || busy) return;
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
            value={display}
            onPick={voted ? undefined : pick}
            disabled={voted || busy}
            size="lg"
          />
        </div>
        <span className="text-sm font-semibold text-[#333]" dir="ltr">
          {formatRatingAverage(stats.average || seedAvg)} / 5
        </span>
        <span className="text-sm text-[#666]">
          {formatRatingCount(Math.max(stats.count, seedCount))}{" "}
          {messages.ratingsCount}
        </span>
      </div>
      <p className="w-full text-center text-xs text-[#888]">
        {voted ? messages.thankYouRating : messages.clickStarsOnce}
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

function authAvatarUrl(user: AuthUser): string {
  return resolveUserAvatarUrl(user);
}

export function SiteRatingCard() {
  const { messages } = useLocale();
  const [stats, setStats] = useState<RatingStats>({
    average: SITE_RATING_SEED_AVERAGE,
    count: SITE_RATING_SEED_COUNT,
  });
  const [voted, setVoted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState(0);
  const [picked, setPicked] = useState(0);
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
        setAuthReady(true);
      });
      const { data } = supabase.auth.onAuthStateChange((_e, session) => {
        setUser(session?.user ?? null);
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
    if (voted || busy || picked < 1) return;
    setBusy(true);
    try {
      if (user) {
        const name = authDisplayName(user);
        if (!name) return;
        const country = countryFromAuthMeta(user.user_metadata);
        await submitRating("site", picked, {
          displayName: name,
          comment: comment.trim() || undefined,
          avatarUrl: authAvatarUrl(user) || undefined,
          countryCode: country.code || undefined,
          countryFlag: country.flag || undefined,
        });
      } else {
        // Guest: stars only — optional note is not published publicly.
        await submitRating("site", picked);
      }
      const next = await fetchRatingStats("site");
      setStats(next);
      setVoted(true);
      setComment("");
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
              className={`flex justify-center ${voted ? "" : "cursor-pointer"}`}
              onMouseMove={(e) => {
                if (voted || busy) return;
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
                onPick={voted ? undefined : pick}
                disabled={voted || busy}
                size="xl"
              />
            </div>

            {!voted ? (
              <div className="w-full space-y-3 text-start">
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
                {!loggedIn && authReady ? (
                  <p className="text-[11px] leading-5 text-[#888]">
                    {messages.guestCommentPrivate}{" "}
                    <Link
                      href="/login?next=/"
                      className="font-semibold text-[#2563eb] underline-offset-2 hover:underline"
                    >
                      {messages.loginToComment}
                    </Link>
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={busy || picked < 1}
                  onClick={() => void save()}
                  className="w-full rounded-xl bg-[#E8874A] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-40"
                >
                  {busy ? messages.saving : messages.publishReview}
                </button>
              </div>
            ) : null}

            <div className="flex items-end justify-center gap-2" dir="ltr">
              <span className="text-5xl font-extrabold tabular-nums tracking-tight text-[#122033] sm:text-6xl">
                {formatRatingAverage(stats.average || SITE_RATING_SEED_AVERAGE)}
              </span>
              <span className="mb-2 text-lg font-semibold text-[#8a9aab]">
                / 5
              </span>
            </div>

            <p className="text-sm text-[#5a6d80]">
              {formatRatingCount(
                Math.max(stats.count, SITE_RATING_SEED_COUNT),
              )}{" "}
              {messages.ratingsAggregate}
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
