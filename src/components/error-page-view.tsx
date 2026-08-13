"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ErrorLottie } from "@/components/error-lottie";

type Props = {
  title: string;
  description: string;
  homeLabel?: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export function ErrorPageView({
  title,
  description,
  homeLabel = "العودة للرئيسية",
  retryLabel = "إعادة المحاولة",
  onRetry,
}: Props) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center">
      <Link href="/" className="mb-6" aria-label="Tool2Day — Home">
        <BrandLogo size="md" showWord twoAsImage />
      </Link>
      <ErrorLottie size={300} />
      <h1 className="mt-4 font-[family-name:var(--font-syne)] text-2xl font-extrabold text-[#111] sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 max-w-md text-sm leading-7 text-[#555] sm:text-base">
        {description}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full bg-[#2563eb] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1d4ed8]"
          >
            {retryLabel}
          </button>
        ) : null}
        <Link
          href="/"
          className="rounded-full border border-[#ddd] bg-white px-5 py-2.5 text-sm font-bold text-[#222] hover:bg-[#f5f5f5]"
        >
          {homeLabel}
        </Link>
      </div>
    </div>
  );
}
