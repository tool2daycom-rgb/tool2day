"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { ToolIcon } from "@/components/tool-icon";
import { getToolTitle } from "@/lib/i18n/tool-titles";
import { isToolLive } from "@/lib/processors/active-tools";
import {
  getRecentToolSlugs,
  subscribeRecentTools,
} from "@/lib/recent-tools";
import {
  categoryMeta,
  categoryOrder,
  getTool,
  getToolsByCategory,
  type Tool,
  type ToolCategory,
} from "@/lib/tools";

function useDailyTools(): { tools: Tool[]; recentSlugs: Set<string> } {
  const permanent = useMemo(() => getToolsByCategory("utilities"), []);
  const permanentSlugs = useMemo(
    () => new Set(permanent.map((t) => t.slug)),
    [permanent],
  );
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => setRecentSlugs(getRecentToolSlugs());
    refresh();
    return subscribeRecentTools(refresh);
  }, []);

  const tools = useMemo(() => {
    const extras: Tool[] = [];
    for (const slug of recentSlugs) {
      if (permanentSlugs.has(slug)) continue;
      const tool = getTool(slug);
      if (tool && !tool.hidden) extras.push(tool);
    }
    return [...permanent, ...extras];
  }, [permanent, permanentSlugs, recentSlugs]);

  return {
    tools,
    recentSlugs: new Set(
      recentSlugs.filter((s) => !permanentSlugs.has(s)),
    ),
  };
}

function ToolRow({
  tool,
  recent,
}: {
  tool: Tool;
  recent?: boolean;
}) {
  const { locale, messages } = useLocale();
  const live = isToolLive(tool.slug);
  return (
    <li>
      <Link
        href={`/tools/${tool.slug}`}
        className={`group flex items-center gap-3 transition ${
          live
            ? "text-[#222] hover:text-[#2563eb]"
            : "text-[#888] hover:text-[#555]"
        }`}
      >
        <ToolIcon
          slug={tool.slug}
          Icon={tool.icon}
          size="sm"
          className={
            live ? "text-[#333] group-hover:opacity-90" : "opacity-50"
          }
          strokeWidth={1.5}
        />
        <span className="text-[15px] leading-6">
          {getToolTitle(tool.slug, locale, tool.title)}
        </span>
        {recent ? (
          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
            مؤخراً
          </span>
        ) : live ? (
          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
            {messages.free}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

function CategorySection({ category }: { category: ToolCategory }) {
  const tools = getToolsByCategory(category);
  const { messages } = useLocale();
  const meta = categoryMeta[category];
  const sectionTitle = messages.categories[category].sectionTitle;

  return (
    <section id={meta.anchor} className="scroll-mt-24 py-10 sm:py-12">
      <h2 className="mb-6 text-2xl font-bold text-[#1a1a1a] sm:text-[1.75rem]">
        {sectionTitle}
      </h2>
      <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolRow key={tool.slug} tool={tool} />
        ))}
      </ul>
    </section>
  );
}

function DailyCategorySection() {
  const { tools, recentSlugs } = useDailyTools();
  const { messages } = useLocale();
  const meta = categoryMeta.utilities;
  const sectionTitle = messages.categories.utilities.sectionTitle;

  return (
    <section id={meta.anchor} className="scroll-mt-24 py-10 sm:py-12">
      <h2 className="mb-6 text-2xl font-bold text-[#1a1a1a] sm:text-[1.75rem]">
        {sectionTitle}
      </h2>
      <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolRow
            key={tool.slug}
            tool={tool}
            recent={recentSlugs.has(tool.slug)}
          />
        ))}
      </ul>
    </section>
  );
}

export function HomeDirectory() {
  const { messages } = useLocale();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-12 text-center sm:mb-16">
        <div className="flex justify-center">
          <Image
            src="/brand/logo-hero-eyes.png"
            alt="Tool2Day"
            width={920}
            height={220}
            className="h-auto w-full max-w-[28rem] object-contain sm:max-w-[36rem]"
            priority
            unoptimized
          />
        </div>
        <h1 className="mx-auto mt-4 max-w-2xl text-base leading-8 text-[#333] sm:text-lg">
          {messages.heroLine}
        </h1>
      </div>

      <div className="rounded-2xl border border-[#e8e8e8] bg-white px-5 py-2 shadow-[0_1px_0_rgba(0,0,0,0.03)] sm:px-10">
        {categoryOrder.map((category) =>
          category === "utilities" ? (
            <DailyCategorySection key={category} />
          ) : (
            <CategorySection key={category} category={category} />
          ),
        )}
      </div>
    </div>
  );
}
