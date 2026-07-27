"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { User as AuthUser } from "@supabase/supabase-js";
import { Check, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { createClient } from "@/lib/supabase/client";
import {
  clearPostedSiteCommentFlag,
  fetchPublicReviews,
  hasPostedSiteComment,
  submitRating,
  type PublicReview,
} from "@/lib/ratings";
import { tools } from "@/lib/tools";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "؟";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] || ""}${parts[1]![0] || ""}`.toUpperCase();
}

function toolLabel(target: string) {
  if (target === "site") return "Tool2Day";
  const tool = tools.find((t) => t.slug === target);
  return tool?.title || "Tool2Day";
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

function StarsPick({
  value,
  onPick,
  disabled,
}: {
  value: number;
  onPick: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          aria-label={`${n}`}
          onClick={() => onPick(n)}
          className="transition hover:scale-110 disabled:opacity-50"
        >
          <Star
            className={`h-8 w-8 ${
              value >= n
                ? "fill-[#F5C518] text-[#F5C518]"
                : "fill-transparent text-[#d4d4d4]"
            }`}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

function StarsMini({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${
            value >= n
              ? "fill-[#F5C518] text-[#F5C518]"
              : "fill-transparent text-[#d4d4d4]"
          }`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  eyebrow,
  compact,
}: {
  review: PublicReview;
  eyebrow: string;
  compact?: boolean;
}) {
  const label = toolLabel(review.target);
  return (
    <article
      className={`rounded-2xl bg-white text-[#111] shadow-[0_18px_50px_rgba(0,0,0,0.22)] ${
        compact ? "px-5 py-6" : "px-6 py-8 sm:px-10 sm:py-10"
      }`}
    >
      <p className="text-center text-[11px] font-semibold text-[#9aa3af]">
        {eyebrow} — {label}
      </p>

      <div className="mt-5 flex items-center justify-center gap-3">
        <div className="text-end">
          <p className="text-sm font-extrabold text-[#111]">
            {review.displayName}
          </p>
          <div className="mt-1 flex justify-end">
            <StarsMini value={review.stars} />
          </div>
        </div>
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8874A] text-sm font-extrabold text-white"
          aria-hidden
        >
          {initials(review.displayName)}
        </div>
      </div>

      <p
        className={`mt-6 text-center font-semibold leading-8 text-[#1a1a1a] ${
          compact ? "text-sm" : "text-[15px] sm:text-base"
        }`}
      >
        “{review.comment}”
      </p>

      <p className="mt-5 text-center text-[11px] font-semibold text-[#9aa3af]">
        {label}
      </p>
    </article>
  );
}

function WriteReviewForm({ onPosted }: { onPosted: () => void }) {
  const { messages } = useLocale();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [stars, setStars] = useState(5);
  const [displayName, setDisplayName] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        if (hasPostedSiteComment()) setDone(true);
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

  async function submit() {
    if (!user || busy) return;
    const name = displayName.trim() || authDisplayName(user);
    const text = comment.trim();
    if (!name || text.length < 3) {
      setError(messages.reviewCommentHint);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitRating("site", stars, {
        displayName: name,
        comment: text,
      });
      setDone(true);
      onPosted();
    } catch {
      setError(messages.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  function startEdit() {
    clearPostedSiteCommentFlag();
    setDone(false);
    setError(null);
  }

  return (
    <div
      id="write-review"
      className="mx-auto mt-8 w-full max-w-xl scroll-mt-28 rounded-2xl bg-white px-5 py-6 text-[#111] shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:px-8 sm:py-8"
    >
      <h2 className="text-center text-lg font-extrabold text-[#122033] sm:text-xl">
        {messages.writeYourReview}
      </h2>
      <p className="mt-2 text-center text-sm text-[#666]">
        {messages.writeYourReviewSub}
      </p>

      {!authReady ? (
        <p className="mt-6 text-center text-sm text-[#888]">…</p>
      ) : !user ? (
        <div className="mt-6 rounded-xl border border-[#f3e0d0] bg-[#fff8f2] px-4 py-5 text-center">
          <p className="text-sm font-bold text-[#7a4a28]">
            {messages.loginToComment}
          </p>
          <Link
            href="/login?next=/testimonials#write-review"
            className="mt-4 inline-flex rounded-xl bg-[#122033] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#1c3048]"
          >
            {messages.login}
          </Link>
        </div>
      ) : done ? (
        <div className="mt-6 space-y-3 text-center">
          <div className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-50 px-3 py-3 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
            <Check className="h-4 w-4" />
            {messages.thankYouRating}
          </div>
          <button
            type="button"
            onClick={startEdit}
            className="text-sm font-extrabold text-[#E8874A] underline-offset-4 hover:underline"
          >
            {messages.editYourReview}
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4 text-start">
          <StarsPick value={stars} onPick={setStars} disabled={busy} />
          <label className="block text-xs font-bold text-[#444]">
            {messages.reviewDisplayName}
            <input
              className="mt-1 w-full rounded-xl border border-[#ddd] bg-[#fafafa] px-3 py-2.5 text-sm font-semibold text-[#111]"
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
              className="mt-1 min-h-[110px] w-full resize-y rounded-xl border border-[#ddd] bg-[#fafafa] px-3 py-2.5 text-sm leading-6 text-[#111]"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={messages.reviewCommentHint}
              maxLength={400}
              disabled={busy}
            />
          </label>
          {error ? (
            <p className="text-sm font-bold text-red-600">{error}</p>
          ) : null}
          <button
            type="button"
            disabled={busy || !displayName.trim() || comment.trim().length < 3}
            onClick={() => void submit()}
            className="w-full rounded-xl bg-[#E8874A] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-40"
          >
            {busy ? messages.saving : messages.publishReview}
          </button>
        </div>
      )}
    </div>
  );
}

const FALLBACK: PublicReview[] = [
  {
    id: "fb1",
    displayName: "أحمد محمد",
    stars: 5,
    comment: "أدوات ممتازة وسريعة — خاصة محرر الفيديو والترجمة الحركية.",
    target: "site",
    createdAt: "",
  },
  {
    id: "fb2",
    displayName: "سارة علي",
    stars: 5,
    comment: "الموقع سهل ومجاني بدون علامة مائية. أنصح فيه بقوة.",
    target: "site",
    createdAt: "",
  },
  {
    id: "fb3",
    displayName: "Omar K.",
    stars: 4,
    comment: "Great free tools in the browser. Clean UI and fast exports.",
    target: "site",
    createdAt: "",
  },
  {
    id: "fb4",
    displayName: "نورة",
    stars: 5,
    comment: "وفّر عليّ وقت كثير في تحويل الملفات والصوتيات.",
    target: "converters",
    createdAt: "",
  },
];

export function TestimonialsWorkspace({
  mode = "page",
}: {
  mode?: "page" | "teaser";
}) {
  const { messages } = useLocale();
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  function reload() {
    void fetchPublicReviews(80).then((data) => {
      setReviews(data.reviews.length ? data.reviews : FALLBACK);
      setLoaded(true);
      setIndex(0);
    });
  }

  useEffect(() => {
    reload();
  }, []);

  const list = reviews.length ? reviews : FALLBACK;
  const active = list[index % list.length]!;

  const neighbors = useMemo(() => {
    if (list.length < 2)
      return {
        prev: null as PublicReview | null,
        next: null as PublicReview | null,
      };
    const prev = list[(index - 1 + list.length) % list.length]!;
    const next = list[(index + 1) % list.length]!;
    return { prev, next };
  }, [index, list]);

  function go(delta: number) {
    setIndex((i) => (i + delta + list.length) % list.length);
  }

  const eyebrow = messages.customerOpinion;

  return (
    <section
      className={`relative overflow-hidden ${
        mode === "page"
          ? "min-h-[70vh] bg-[#0f3d3a] py-14 sm:py-20"
          : "mt-10 rounded-3xl bg-[#0f3d3a] py-12"
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(245,197,24,0.18), transparent 28%), radial-gradient(circle at 80% 30%, rgba(245,197,24,0.12), transparent 24%), radial-gradient(circle at 50% 80%, rgba(232,135,74,0.12), transparent 30%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        aria-hidden
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpath fill='%23F5C518' d='M40 8l3.5 10.8H55l-9 6.5 3.5 10.8L40 29.6l-9 6.5 3.5-10.8-9-6.5h11.5z'/%3E%3C/svg%3E\")",
          backgroundSize: "72px 72px",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <h1
            className={`font-extrabold tracking-tight text-white ${
              mode === "page" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
            }`}
          >
            {messages.testimonialsTitle}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/75 sm:text-[15px]">
            {messages.testimonialsSub}
          </p>
        </div>

        {mode === "page" ? <WriteReviewForm onPosted={reload} /> : null}

        <div className="relative mt-10 sm:mt-12">
          <button
            type="button"
            aria-label="previous"
            onClick={() => go(-1)}
            className="absolute start-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/50 sm:-start-2"
          >
            <ChevronRight className="h-5 w-5 rtl:hidden" />
            <ChevronLeft className="hidden h-5 w-5 rtl:block" />
          </button>
          <button
            type="button"
            aria-label="next"
            onClick={() => go(1)}
            className="absolute end-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/50 sm:-end-2"
          >
            <ChevronLeft className="h-5 w-5 rtl:hidden" />
            <ChevronRight className="hidden h-5 w-5 rtl:block" />
          </button>

          <div className="mx-auto grid max-w-3xl grid-cols-[0.7fr_1.4fr_0.7fr] items-center gap-2 sm:gap-4">
            <div className="scale-90 opacity-40 blur-[0.5px]">
              {neighbors.prev ? (
                <ReviewCard
                  review={neighbors.prev}
                  eyebrow={eyebrow}
                  compact
                />
              ) : (
                <div className="h-40 rounded-2xl bg-white/10" />
              )}
            </div>
            <div className="relative z-10">
              <ReviewCard review={active} eyebrow={eyebrow} />
              <div className="mx-auto mt-0 h-0 w-0 border-x-[10px] border-t-[12px] border-x-transparent border-t-white" />
            </div>
            <div className="scale-90 opacity-40 blur-[0.5px]">
              {neighbors.next ? (
                <ReviewCard
                  review={neighbors.next}
                  eyebrow={eyebrow}
                  compact
                />
              ) : (
                <div className="h-40 rounded-2xl bg-white/10" />
              )}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2">
            {list.slice(0, Math.min(list.length, 8)).map((r, i) => (
              <button
                key={r.id}
                type="button"
                aria-label={`review ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition ${
                  i === index % Math.min(list.length, 8)
                    ? "w-7 bg-[#E8874A]"
                    : "w-4 bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>

        {mode === "teaser" ? (
          <div className="mt-8 text-center">
            <Link
              href="/testimonials#write-review"
              className="inline-flex rounded-full bg-[#E8874A] px-6 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#d9773a]"
            >
              {messages.viewAllTestimonials}
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-14">
              <h2 className="text-center text-xl font-extrabold text-white sm:text-2xl">
                {messages.allTestimonials}
              </h2>
              {!loaded ? (
                <p className="mt-6 text-center text-sm text-white/60">…</p>
              ) : (
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {list.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      eyebrow={eyebrow}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="mx-auto mt-14 max-w-3xl rounded-2xl border border-[#E8874A]/70 bg-[#0b2f2d] px-6 py-8 text-center sm:px-10">
              <p className="text-xl font-extrabold text-white sm:text-2xl">
                {messages.testimonialsCtaTitle}
              </p>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/75">
                {messages.testimonialsCtaBody}
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex rounded-full bg-[#E8874A] px-6 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#d9773a]"
              >
                {messages.browseTools}
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
