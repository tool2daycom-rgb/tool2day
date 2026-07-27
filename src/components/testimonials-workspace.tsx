"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import {
  fetchPublicReviews,
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

  useEffect(() => {
    let cancelled = false;
    void fetchPublicReviews(80).then((data) => {
      if (cancelled) return;
      setReviews(data.reviews.length ? data.reviews : FALLBACK);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const list = reviews.length ? reviews : FALLBACK;
  const active = list[index % list.length]!;

  const neighbors = useMemo(() => {
    if (list.length < 2) return { prev: null as PublicReview | null, next: null as PublicReview | null };
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

        {/* Carousel */}
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
              <ReviewCard
                review={active}
                eyebrow={eyebrow}
              />
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
              href="/testimonials"
              className="inline-flex rounded-full bg-[#E8874A] px-6 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#d9773a]"
            >
              {messages.viewAllTestimonials}
            </Link>
          </div>
        ) : (
          <>
            {/* All comments grid */}
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
