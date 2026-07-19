import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { isToolLive } from "@/lib/processors/active-tools";
import {
  categoryMeta,
  categoryOrder,
  getToolsByCategory,
  type ToolCategory,
} from "@/lib/tools";

function CategorySection({ category }: { category: ToolCategory }) {
  const tools = getToolsByCategory(category);
  const meta = categoryMeta[category];

  return (
    <section id={meta.anchor} className="scroll-mt-24 py-10 sm:py-12">
      <h2 className="mb-6 text-2xl font-bold text-[#1a1a1a] sm:text-[1.75rem]">
        {meta.sectionTitle}
      </h2>
      <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const live = isToolLive(tool.slug);
          return (
            <li key={tool.slug}>
              <Link
                href={`/tools/${tool.slug}`}
                className={`group flex items-center gap-3 transition ${
                  live
                    ? "text-[#222] hover:text-[#2563eb]"
                    : "text-[#888] hover:text-[#555]"
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 stroke-[1.5] transition ${
                    live
                      ? "text-[#333] group-hover:text-[#2563eb]"
                      : "text-[#aaa]"
                  }`}
                />
                <span className="text-[15px] leading-6">{tool.title}</span>
                {live ? (
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                    شغّال
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function HomeDirectory() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-12 text-center sm:mb-16">
        <div className="flex justify-center">
          <BrandLogo size="lg" showWord className="text-4xl text-[#111] sm:text-5xl" />
        </div>
        <h1 className="mx-auto mt-4 max-w-2xl text-base leading-8 text-[#333] sm:text-lg">
          الأدوات الإلكترونية لتحويل الفيديو والصوت وPDF والملفات
        </h1>
        <p className="mt-3 text-sm text-[#666]">
          كل الأدوات مفعّلة — ارفع ملفك وابدأ المعالجة مباشرة في المتصفح
        </p>
      </div>

      <div className="rounded-2xl border border-[#e8e8e8] bg-white px-5 py-2 shadow-[0_1px_0_rgba(0,0,0,0.03)] sm:px-10">
        {categoryOrder.map((category) => (
          <CategorySection key={category} category={category} />
        ))}
      </div>
    </div>
  );
}
