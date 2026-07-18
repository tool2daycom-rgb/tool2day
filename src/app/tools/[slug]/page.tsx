import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ToolWorkspace } from "@/components/tool-workspace";
import { categoryLabels, getTool, tools } from "@/lib/tools";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  return {
    title: tool.title,
    description: tool.description,
  };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-20 pt-28 sm:px-8">
      <Link
        href="/#tools"
        className="text-sm font-semibold text-brand transition hover:text-brand-deep"
      >
        ← كل الأدوات
      </Link>
      <p className="mt-6 text-xs font-semibold tracking-wide text-accent">
        {categoryLabels[tool.category]}
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-ink sm:text-4xl">
        {tool.title}
      </h1>
      <p className="mt-3 text-base leading-8 text-ink-soft">{tool.description}</p>
      <div className="mt-8">
        <ToolWorkspace tool={tool} />
      </div>
    </div>
  );
}
