"use client";

import Link from "next/link";
import {
  Bot,
  Calculator,
  ChevronDown,
  FileText,
  Music2,
  RefreshCcw,
  Share2,
  Sparkles,
  Video,
  Wrench,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AuthMenu } from "@/components/auth-menu";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ToolIcon } from "@/components/tool-icon";
import { useLocale } from "@/components/locale-provider";
import { getToolTitle } from "@/lib/i18n/tool-titles";
import {
  getRecentToolSlugs,
  subscribeRecentTools,
} from "@/lib/recent-tools";
import {
  categoryMeta,
  getTool,
  getToolsByCategory,
  type Tool,
  type ToolCategory,
} from "@/lib/tools";

const desktopNavOrder: ToolCategory[] = [
  "utilities",
  "generators",
  "calculators",
  "ai",
  "social-dev",
  "video",
  "audio",
  "pdf",
  "converters",
];

const categoryIcon: Record<ToolCategory, typeof Video> = {
  generators: Sparkles,
  calculators: Calculator,
  ai: Bot,
  "social-dev": Share2,
  video: Video,
  audio: Music2,
  pdf: FileText,
  converters: RefreshCcw,
  utilities: Wrench,
};

export function SiteHeader() {
  const [open, setOpen] = useState<ToolCategory | null>(null);
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);
  const navRef = useRef<HTMLElement>(null);
  const { locale, messages, localeDef } = useLocale();

  useEffect(() => {
    const refresh = () => setRecentSlugs(getRecentToolSlugs());
    refresh();
    return subscribeRecentTools(refresh);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const el = navRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function navItemsFor(category: ToolCategory): Tool[] {
    const base = getToolsByCategory(category);
    if (category !== "utilities") return base;
    const seen = new Set(base.map((t) => t.slug));
    const extras: Tool[] = [];
    for (const slug of recentSlugs) {
      if (seen.has(slug)) continue;
      const tool = getTool(slug);
      if (tool && !tool.hidden) {
        seen.add(slug);
        extras.push(tool);
      }
    }
    return [...base, ...extras];
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0a] text-white">
      <div
        dir="ltr"
        className="flex h-14 w-full items-center gap-2 px-2 sm:gap-3 sm:px-3 lg:px-4"
      >
        <Link
          href="/"
          className="relative z-10 -ms-0.5 flex shrink-0 items-center pe-1"
          aria-label="Tool2Day — Home"
        >
          <BrandLogo size="sm" showWord />
        </Link>

        <nav
          ref={navRef}
          className="relative z-20 hidden min-w-0 flex-1 items-center overflow-visible md:flex"
        >
          <div className="flex max-w-full flex-wrap items-center gap-0 overflow-visible">
            {desktopNavOrder.map((category) => {
              const items = navItemsFor(category);
              const isOpen = open === category;
              const Icon = categoryIcon[category];
              const label = messages.categories[category].label;
              return (
                <div
                  key={category}
                  className="relative shrink-0"
                  onMouseEnter={() => setOpen(category)}
                  onMouseLeave={() => setOpen(null)}
                >
                  <button
                    type="button"
                    className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-2 text-[13px] font-bold text-white transition hover:bg-white/10 lg:gap-1.5 lg:px-2.5 lg:text-sm ${
                      isOpen ? "bg-white/10" : ""
                    }`}
                    aria-expanded={isOpen}
                    aria-haspopup="menu"
                    onClick={() =>
                      setOpen((cur) => (cur === category ? null : category))
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                    <span>{label}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 opacity-90 transition ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      strokeWidth={2.5}
                    />
                  </button>
                  {isOpen ? (
                    <div
                      role="menu"
                      dir={localeDef.dir}
                      className={`absolute top-full z-[60] pt-1 ${
                        category === "video"
                          ? "left-0 w-[min(34rem,90vw)] lg:left-1/2 lg:-translate-x-1/2"
                          : "left-0 w-64"
                      }`}
                    >
                      <div className="rounded-md border border-white/10 bg-[#1c1c1c] py-2 shadow-xl">
                        <ul
                          className={
                            category === "video"
                              ? "grid grid-cols-2 gap-x-2 px-2"
                              : "flex flex-col px-1"
                          }
                        >
                          {items.map((tool) => {
                            return (
                              <li key={tool.slug}>
                                <Link
                                  href={`/tools/${tool.slug}`}
                                  role="menuitem"
                                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                                  onClick={() => setOpen(null)}
                                >
                                  <ToolIcon
                                    slug={tool.slug}
                                    Icon={tool.icon}
                                    size="sm"
                                    className="text-white"
                                    strokeWidth={2}
                                  />
                                  <span>
                                    {getToolTitle(
                                      tool.slug,
                                      locale,
                                      tool.title,
                                    )}
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </nav>

        <div className="relative z-10 ms-auto flex shrink-0 items-center gap-3 pe-0.5 text-sm font-bold text-white sm:gap-4">
          <LanguageSwitcher />
          <AuthMenu />
        </div>
      </div>

      <div
        dir={localeDef.dir}
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
            {messages.categories[category].label}
          </Link>
        ))}
      </div>
    </header>
  );
}
