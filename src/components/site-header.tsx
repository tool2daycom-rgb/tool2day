"use client";

import Link from "next/link";
import {
  ChevronDown,
  FileText,
  Globe,
  LayoutTemplate,
  MonitorSmartphone,
  Music2,
  RefreshCcw,
  Smartphone,
  Video,
} from "lucide-react";
import { useState } from "react";
import { AuthMenu } from "@/components/auth-menu";
import { BrandLogo } from "@/components/brand-logo";
import {
  categoryMeta,
  getToolsByCategory,
  type ToolCategory,
} from "@/lib/tools";

/** ترتيب قوائم سطح المكتب مثل 123apps: Video → Audio → PDF → Converters */
const desktopNavOrder: ToolCategory[] = [
  "video",
  "audio",
  "pdf",
  "converters",
];

const categoryIcon: Record<ToolCategory, typeof Video> = {
  video: Video,
  audio: Music2,
  pdf: FileText,
  converters: RefreshCcw,
};

const DESIGN_BASE = "https://design.tool2day.com";

const templateLinks = [
  {
    href: `${DESIGN_BASE}/?category=app`,
    title: "قوالب التطبيقات",
    hint: "واجهات جاهزة لتطبيقات الجوال",
    Icon: Smartphone,
  },
  {
    href: `${DESIGN_BASE}/?category=web`,
    title: "قوالب المواقع",
    hint: "تصاميم ويب وواجهات احترافية",
    Icon: MonitorSmartphone,
  },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState<ToolCategory | "templates" | null>(null);

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
            <div
              className="relative"
              onMouseEnter={() => setOpen("templates")}
              onMouseLeave={() => setOpen(null)}
            >
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-bold text-white transition hover:bg-white/10"
                aria-expanded={open === "templates"}
              >
                <LayoutTemplate
                  className="h-4 w-4 shrink-0"
                  strokeWidth={2.25}
                />
                <span>القوالب</span>
                <ChevronDown
                  className="h-3.5 w-3.5 opacity-90"
                  strokeWidth={2.5}
                />
              </button>
              {open === "templates" ? (
                <div
                  dir="rtl"
                  className="absolute left-1/2 top-full z-50 mt-0 w-72 -translate-x-1/2 rounded-md border border-white/10 bg-[#1c1c1c] py-2 shadow-xl"
                >
                  <ul className="flex flex-col px-1">
                    {templateLinks.map((item) => (
                      <li key={item.href}>
                        <a
                          href={item.href}
                          className="flex items-start gap-2.5 rounded-md px-3 py-2.5 transition hover:bg-white/10"
                        >
                          <item.Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#f5c518]" />
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-white">
                              {item.title}
                            </span>
                            <span className="mt-0.5 block text-[11px] font-normal leading-4 text-white/55">
                              {item.hint}
                            </span>
                          </span>
                        </a>
                      </li>
                    ))}
                    <li className="mt-1 border-t border-white/10 px-1 pt-1">
                      <a
                        href={DESIGN_BASE}
                        className="block rounded-md px-3 py-2 text-xs font-semibold text-[#f5c518] transition hover:bg-white/10"
                      >
                        تصفّح كل القوالب →
                      </a>
                    </li>
                  </ul>
                </div>
              ) : null}
            </div>

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
        <a
          href={DESIGN_BASE}
          className="shrink-0 rounded-full border border-[#f5c518]/40 bg-[#f5c518]/10 px-3 py-1 text-xs font-bold text-[#f5c518]"
        >
          القوالب
        </a>
        {desktopNavOrder.map((category) => (
          <Link
            key={category}
            href={`/#${categoryMeta[category].anchor}`}
            className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-xs font-bold text-white"
          >
            {categoryMeta[category].label}
          </Link>
        ))}
      </div>
    </header>
  );
}
