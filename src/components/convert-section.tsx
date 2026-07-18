import Link from "next/link";
import {
  categoryLabels,
  getToolsByCategory,
  type ToolCategory,
} from "@/lib/tools";

const convertCategories: ToolCategory[] = ["video", "audio", "pdf", "files"];

export function ConvertSection() {
  return (
    <section id="convert" className="scroll-mt-24 px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-ink sm:text-4xl">
          تحويل الفيديو والصوت وPDF والملفات
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-8 text-ink-soft">
          أدوات واضحة وسريعة لكل نوع ملف تحتاجه يومياً — بدون تعقيد.
        </p>

        <div className="mt-12 space-y-12">
          {convertCategories.map((category) => {
            const items = getToolsByCategory(category);
            return (
              <div key={category}>
                <h3 className="mb-5 text-sm font-semibold tracking-wide text-brand">
                  {categoryLabels[category]}
                </h3>
                <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((tool) => (
                    <li key={tool.slug}>
                      <Link
                        href={`/tools/${tool.slug}`}
                        className="group block border-b border-line pb-4 transition hover:border-brand"
                      >
                        <span className="text-lg font-semibold text-ink group-hover:text-brand">
                          {tool.title}
                        </span>
                        <p className="mt-2 text-sm leading-7 text-ink-soft">
                          {tool.description}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
