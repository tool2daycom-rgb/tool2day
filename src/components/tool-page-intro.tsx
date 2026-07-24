"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useLocale } from "@/components/locale-provider";
import { getToolTitle } from "@/lib/i18n/tool-titles";
import { getToolSeoContent } from "@/lib/tool-seo-content";
import type { ToolCategory } from "@/lib/tools";

function cleanTagline(tagline: string) {
  return tagline
    .replace(/\s*[—–-]\s*بدون علامة مائية/g, "")
    .replace(/\s*وبدون علامة مائية/g, "")
    .replace(/\s*بدون علامة مائية/g, "")
    .trim();
}

type Props = {
  slug: string;
  arTitle: string;
  categoryAnchor: string;
  categoryKey: ToolCategory;
  /** Optional icon (or other node) rendered next to the title. */
  children?: ReactNode;
};

/**
 * Client-rendered breadcrumb + logo + title + tagline for a tool page.
 * Recomputes the display title and tagline from the current locale so they
 * update instantly when the language switcher changes, without a page reload.
 */
export function ToolPageIntro({
  slug,
  arTitle,
  categoryAnchor,
  categoryKey,
  children,
}: Props) {
  const { locale, messages } = useLocale();
  const displayTitle = getToolTitle(slug, locale, arTitle);
  const categoryLabel = messages.categories[categoryKey].sectionTitle;
  const seo = getToolSeoContent(
    { slug, title: arTitle },
    { locale, title: displayTitle },
  );
  const tagline = cleanTagline(seo.tagline);

  return (
    <>
      <Link
        href={`/#${categoryAnchor}`}
        className="text-sm font-bold text-[#1d4ed8] transition hover:underline"
      >
        ← {categoryLabel}
      </Link>

      <div className="mt-8 flex flex-col items-center text-center">
        <Link
          href="/"
          className="mb-5 inline-flex w-full max-w-[22rem] justify-center transition hover:opacity-90 sm:max-w-[28rem]"
          aria-label="Tool2Day — Home"
        >
          <Image
            src="/brand/logo-hero-eyes.png"
            alt="TOOL2DAY"
            width={920}
            height={220}
            className="h-auto w-full object-contain"
            priority
            unoptimized
          />
        </Link>

        <div className="flex items-center justify-center gap-3 sm:gap-4">
          {children}
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0a0a0a] sm:text-4xl">
            {displayTitle}
          </h1>
        </div>
        <p className="mt-3 max-w-xl text-base font-semibold leading-8 text-[#222]">
          {tagline}
        </p>
        <p className="mt-2 text-sm font-extrabold text-emerald-800">
          {messages.completelyFree}
        </p>
      </div>
    </>
  );
}
