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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#121212] text-white">
      <div className="mx-auto flex h-[52px] w-full max-w-[1180px] items-center gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center"
          aria-label="Tool2Day — الصفحة الرئيسية"
        >
          <BrandLogo size="md" showWord />
        </Link>

        {/* مجموعة القوائم + الحساب — مثل 123apps على سطح المكتب */}
        <div className="ms-auto hidden items-center gap-1 md:flex">
          <nav className="flex items-center gap-0.5">
            {navCategories.map((category) => {
              const items = getToolsByCategory(category);
              const isOpen = open === category;
              const Icon = categoryMeta[category].icon;
              return (
                <div
                  key={category}
                  className="relative"
                  onMouseEnter={() => setOpen(category)}
                  onMouseLeave={() => setOpen(null)}
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-[13px] font-bold text-white transition hover:bg-white/10"
                    aria-expanded={isOpen}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-white" strokeWidth={2.25} />
                    <span>{categoryMeta[category].label}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                  </button>
                  {isOpen ? (
                    <div
                      className={`absolute top-full z-50 mt-0 min-w-56 rounded-md border border-white/10 bg-[#1c1c1c] py-2 shadow-xl ${
                        category === "video" ? "end-0 w-[34rem]" : "end-0 w-64"
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
                                <ToolIcon className="h-4 w-4 shrink-0 text-white" />
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

          <div className="ms-2 flex items-center gap-1 border-s border-white/15 ps-3">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-[13px] font-bold text-white transition hover:bg-white/10"
              aria-label="اللغة"
            >
              <Globe className="h-4 w-4" strokeWidth={2.25} />
              <span>AR</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-[13px] font-bold text-white transition hover:bg-white/10"
            >
              <User className="h-4 w-4" strokeWidth={2.25} />
              <span>تسجيل الدخول</span>
            </button>
          </div>
        </div>

        {/* موبايل: لغة + دخول فقط */}
        <div className="ms-auto flex items-center gap-1 md:hidden">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-sm font-bold text-white"
            aria-label="اللغة"
          >
            <Globe className="h-4 w-4" strokeWidth={2.25} />
            <span>AR</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-sm font-bold text-white"
          >
            <User className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-2 md:hidden">
        {navCategories.map((category) => {
          const Icon = categoryMeta[category].icon;
          return (
            <Link
              key={category}
              href={`/#${categoryMeta[category].anchor}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-white"
            >
              <Icon className="h-3.5 w-3.5" />
              {categoryMeta[category].label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
