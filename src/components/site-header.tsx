"use client";

import Link from "next/link";
import { ChevronDown, Globe, User } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import {
  categoryMeta,
  getToolsByCategory,
  navCategories,
  type ToolCategory,
} from "@/lib/tools";

export function SiteHeader() {
  const [open, setOpen] = useState<ToolCategory | null>(null);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#141414] text-white">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight"
          aria-label="Tool2Day — الصفحة الرئيسية"
        >
          <BrandLogo size="md" showWord />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navCategories.map((category) => {
            const items = getToolsByCategory(category);
            const isOpen = open === category;
            return (
              <div
                key={category}
                className="relative"
                onMouseEnter={() => setOpen(category)}
                onMouseLeave={() => setOpen(null)}
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm text-white/85 transition hover:bg-white/10 hover:text-white"
                  aria-expanded={isOpen}
                >
                  {categoryMeta[category].label}
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </button>
                {isOpen ? (
                  <div
                    className={`absolute top-full z-50 mt-0 min-w-56 rounded-md border border-white/10 bg-[#1c1c1c] py-2 shadow-xl ${
                      category === "video" ? "w-[34rem]" : "w-64"
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
                        const Icon = tool.icon;
                        return (
                          <li key={tool.slug}>
                            <Link
                              href={`/tools/${tool.slug}`}
                              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-white/85 transition hover:bg-white/10 hover:text-white"
                            >
                              <Icon className="h-4 w-4 shrink-0 opacity-80" />
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
        </nav>

        <div className="flex items-center gap-3 text-sm text-white/80">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 transition hover:text-white"
            aria-label="اللغة"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">AR</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 transition hover:text-white"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">تسجيل الدخول</span>
          </button>
        </div>
      </div>

      {/* Mobile category chips */}
      <div className="flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-2 md:hidden">
        {navCategories.map((category) => (
          <Link
            key={category}
            href={`/#${categoryMeta[category].anchor}`}
            className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-xs text-white/85"
          >
            {categoryMeta[category].label}
          </Link>
        ))}
      </div>
    </header>
  );
}
