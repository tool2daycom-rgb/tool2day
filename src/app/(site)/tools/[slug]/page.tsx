import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BrandMarkAnimated } from "@/components/brand-mark-animated";
import { PdfEditorWorkspace } from "@/components/pdf-editor-workspace";
import { ToolSeoSections } from "@/components/tool-seo-sections";
import { ToolWorkspace } from "@/components/tool-workspace";
import { getToolSeoContent } from "@/lib/tool-seo-content";
import { categoryMeta, getTool, tools } from "@/lib/tools";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return tools
    .filter((tool) => tool.slug !== "video-editor")
    .map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "video-editor") {
    return { title: "محرر الفيديو" };
  }
  const tool = getTool(slug);
  if (!tool) return {};
  const seo = getToolSeoContent(tool);
  return {
    title: tool.title,
    description: seo.tagline,
  };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  if (slug === "video-editor") {
    redirect("/tools/video-editor");
  }

  const tool = getTool(slug);
  if (!tool) notFound();

  const Icon = tool.icon;
  const category = categoryMeta[tool.category];
  const isPdf = slug === "pdf-editor";
  const seo = getToolSeoContent(tool);

  return (
    <div
      className={`mx-auto w-full px-4 py-10 sm:px-6 sm:py-14 ${
        isPdf ? "max-w-[1400px]" : "max-w-3xl"
      }`}
    >
      <Link
        href={`/#${category.anchor}`}
        className="text-sm font-semibold text-[#2563eb] transition hover:underline"
      >
        ← {category.sectionTitle}
      </Link>

      <div className="mt-8 flex flex-col items-center text-center">
        <BrandMarkAnimated size={40} motion="morph" className="mb-4" />
        <div className="flex items-center justify-center gap-3">
          <Icon className="h-7 w-7 stroke-[1.5] text-[#222]" />
          <h1 className="text-3xl font-bold text-[#111] sm:text-4xl">
            {tool.title}
          </h1>
        </div>
        <p className="mt-3 max-w-xl text-base leading-8 text-[#555]">
          {seo.tagline}
        </p>
        <p className="mt-2 text-sm font-semibold text-emerald-700">
          مجاني بالكامل · بدون علامة مائية
        </p>
      </div>

      <div className="mt-8">
        {isPdf ? (
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

      <ToolSeoSections content={seo} />
    </div>
  );
}
