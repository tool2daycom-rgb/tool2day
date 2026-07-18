import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PdfEditorWorkspace } from "@/components/pdf-editor-workspace";
import { ToolWorkspace } from "@/components/tool-workspace";
import { categoryMeta, getTool, tools } from "@/lib/tools";

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

  const Icon = tool.icon;
  const category = categoryMeta[tool.category];

  return (
    <div
      className={`mx-auto w-full px-4 py-10 sm:px-6 sm:py-14 ${
        slug === "pdf-editor" ? "max-w-5xl" : "max-w-3xl"
      }`}
    >
      <Link
        href={`/#${category.anchor}`}
        className="text-sm font-semibold text-[#2563eb] transition hover:underline"
      >
        ← {category.sectionTitle}
      </Link>
      <div className="mt-6 flex items-center gap-3">
        <Icon className="h-7 w-7 stroke-[1.5] text-[#222]" />
        <h1 className="text-3xl font-bold text-[#111] sm:text-4xl">{tool.title}</h1>
      </div>
      <p className="mt-3 text-base leading-8 text-[#555]">{tool.description}</p>
      <div className="mt-8">
        {slug === "pdf-editor" ? (
          <PdfEditorWorkspace
            title={tool.title}
            description={tool.description}
          />
        ) : (
          <ToolWorkspace
            slug={tool.slug}
            title={tool.title}
            description={tool.description}
            accept={tool.accept}
          />
        )}
      </div>
    </div>
  );
}
