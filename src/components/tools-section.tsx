import Link from "next/link";
import { categoryLabels, tools } from "@/lib/tools";

export function ToolsSection() {
  return (
    <section id="tools" className="scroll-mt-24 px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-ink sm:text-4xl">
          كل الأدوات
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-8 text-ink-soft">
          اختر الأداة وابدأ مباشرة. كل مسار مصمّم لمهمة واحدة واضحة.
        </p>

        <ul className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <li key={tool.slug}>
              <Link
                href={`/tools/${tool.slug}`}
                className="group block rounded-xl border border-transparent p-1 transition hover:border-line hover:bg-surface"
              >
                <span className="text-xs font-semibold text-accent">
                  {categoryLabels[tool.category]}
                </span>
                <h3 className="mt-2 text-xl font-semibold text-ink group-hover:text-brand">
                  {tool.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-ink-soft">
                  {tool.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
