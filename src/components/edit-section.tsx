import Link from "next/link";
import { getToolsByCategory } from "@/lib/tools";

export function EditSection() {
  const editTools = getToolsByCategory("edit");

  return (
    <section
      id="edit"
      className="scroll-mt-24 border-y border-line bg-[linear-gradient(180deg,rgba(11,92,99,0.08),rgba(255,255,255,0.35))] px-5 py-20 sm:px-8"
    >
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-ink sm:text-4xl">
            تحرير فيديوهات جاهزة للنشر
          </h2>
          <p className="mt-4 max-w-md text-base leading-8 text-ink-soft">
            قصّ، أضف ترجمة، وصدّر فيديوهات ترويجية قصيرة للمنصات — بأسلوب بسيط
            يشبه تجربة أدوات الإبداع الحديثة.
          </p>
          <Link
            href="/tools/ugc-editor"
            className="mt-7 inline-flex rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-deep"
          >
            افتح محرّر الفيديو
          </Link>
        </div>

        <ul className="grid gap-6 sm:grid-cols-3">
          {editTools.map((tool) => (
            <li key={tool.slug}>
              <Link
                href={`/tools/${tool.slug}`}
                className="group block h-full border-t-2 border-brand/30 pt-4 transition hover:border-accent"
              >
                <h3 className="text-lg font-semibold text-ink group-hover:text-brand">
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
