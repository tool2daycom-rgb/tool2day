"use client";

import Link from "next/link";
import {
  Bot,
  Calculator,
  ChevronDown,
  FileText,
  Globe,
  Music2,
  RefreshCcw,
  Sparkles,
  Video,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { AuthMenu } from "@/components/auth-menu";
import { BrandLogo } from "@/components/brand-logo";
import {
  categoryMeta,
  getToolsByCategory,
  type ToolCategory,
} from "@/lib/tools";

/** مولدات أولاً، ثم الحسابات، ثم الذكاء الاصطناعي */
const desktopNavOrder: ToolCategory[] = [
  "generators",
  "calculators",
  "ai",
  "video",
  "audio",
  "pdf",
  "converters",
  "utilities",
];

const categoryIcon: Record<ToolCategory, typeof Video> = {
  generators: Sparkles,
  calculators: Calculator,
  ai: Bot,
  video: Video,
  audio: Music2,
  pdf: FileText,
  converters: RefreshCcw,
  utilities: Wrench,
};

export function SiteHeader() {
  const [open, setOpen] = useState<ToolCategory | null>(null);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0a] text-white">
      <div
        dir="ltr"
        className="relative mx-auto flex h-14 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8"
      >
        <Link
          href="/"
          className="relative z-10 flex shrink-0 items-center"
          aria-label="Tool2Day — الصفحة الرئيسية"
        >
          <BrandLogo size="md" showWord />
        </Link>

        <nav className="pointer-events-none absolute inset-x-0 top-0 hidden h-14 items-center justify-center md:flex">
          <div className="pointer-events-auto flex items-center gap-0.5">
            {desktopNavOrder.map((category) => {
              const items = getToolsByCategory(category);
              const isOpen = open === category;
              const Icon = categoryIcon[category];
              return (
                <div
                  key={category}
                  className="relative"
                  onMouseEnter={() => setOpen(category)}
                  onMouseLeave={() => setOpen(null)}
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-bold text-white transition hover:bg-white/10"
                    aria-expanded={isOpen}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                    <span>{categoryMeta[category].label}</span>
                    <ChevronDown
                      className="h-3.5 w-3.5 opacity-90"
                      strokeWidth={2.5}
                    />
                  </button>
                  {isOpen ? (
                    <div
                      dir="rtl"
                      className={`absolute top-full z-50 mt-0 min-w-56 rounded-md border border-white/10 bg-[#1c1c1c] py-2 shadow-xl ${
                        category === "video"
                          ? "left-1/2 w-[34rem] -translate-x-1/2"
                          : "left-1/2 w-64 -translate-x-1/2"
                      }`}
                    >
                      <ul
                        className={
                          category === "video"
                            ? "grid grid-cols-2 gap-x-2 px-2"
                            : "flex flex-col px-1"
                        }
                      >
                        {items.map((tool) => {
                          const ToolIcon = tool.icon;
                          return (
                            <li key={tool.slug}>
                              <Link
                                href={`/tools/${tool.slug}`}
                                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                              >
                                <ToolIcon className="h-4 w-4 shrink-0" />
                                <span>{tool.title}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </nav>

        <div className="relative z-10 ml-auto flex shrink-0 items-center gap-4 text-sm font-bold text-white">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 transition hover:opacity-80"
            aria-label="اللغة"
          >
            <Globe className="h-4 w-4" strokeWidth={2.25} />
            <span className="hidden sm:inline">AR</span>
          </button>
          <AuthMenu />
        </div>
      </div>

      <div
        dir="rtl"
        className="flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-2 md:hidden"
      >
        {desktopNavOrder.map((category) => (
          <Link
            key={category}
            href={`/#${categoryMeta[category].anchor}`}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
              category === "generators"
                ? "border-[#f5c518]/40 bg-[#f5c518]/10 text-[#f5c518]"
                : "border-white/20 text-white"
            }`}
          >
            {categoryMeta[category].label}
          </Link>
        ))}
      </div>
    </header>
  );
}
