import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AiToolsWorkspace } from "@/components/ai-tools-workspace";
import { CalculatorsWorkspace } from "@/components/calculators-workspace";
import { GeneratorsWorkspace } from "@/components/generators-workspace";
import { ImageConverterWorkspace } from "@/components/image-converter-workspace";
import { PdfEditorWorkspace } from "@/components/pdf-editor-workspace";
import { SocialDevWorkspace } from "@/components/social-dev-workspace";
import { ToolSeoSections } from "@/components/tool-seo-sections";
import { ToolWorkspace } from "@/components/tool-workspace";
import { UtilityToolWorkspace } from "@/components/utility-tool-workspace";
import { VideoToTextWorkspace } from "@/components/video-to-text-workspace";
import {
  getToolKeywords,
  getToolPageDescription,
  getToolPageTitle,
} from "@/lib/seo-keywords";
import { getToolSeoContent } from "@/lib/tool-seo-content";
import { categoryMeta, getTool, tools } from "@/lib/tools";
import { getToolKind } from "@/lib/processors/active-tools";

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
    return {
      title: "محرر الفيديو مجاناً",
      description:
        "محرر الفيديو مجاناً — تايملاين ومعاينة: قص، سرعة، تدوير، صوت، نص وصور ثم تصدير. بدون علامة مائية على Tool2Day.",
      keywords: [
        "محرر الفيديو",
        "محرر الفيديو مجاناً",
        "أدوات الفيديو",
        "Tool2Day",
        "مجاناً",
      ],
    };
  }
  const tool = getTool(slug);
  if (!tool) return {};
  const seo = getToolSeoContent(tool);
  const title = getToolPageTitle(tool);
  const description = getToolPageDescription(tool, seo.tagline);
  return {
    title,
    description,
    keywords: getToolKeywords(tool),
    openGraph: {
      title: `${title} | Tool2Day`,
      description,
      url: `https://tool2day.com/tools/${tool.slug}`,
      siteName: "Tool2Day",
      locale: "ar_AR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Tool2Day`,
      description,
    },
    alternates: {
      canonical: `https://tool2day.com/tools/${tool.slug}`,
    },
  };
}

function cleanTagline(tagline: string) {
  return tagline
    .replace(/\s*[—–-]\s*بدون علامة مائية/g, "")
    .replace(/\s*وبدون علامة مائية/g, "")
    .replace(/\s*بدون علامة مائية/g, "")
    .trim();
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
  const isCv = slug === "cv-builder";
  const kind = getToolKind(slug);
  const isUtility =
    kind === "text-tools" ||
    kind === "error-detector" ||
    kind === "speed-test";
  const isGenerator =
    kind === "cv-builder" ||
    kind === "fancy-text" ||
    kind === "email-generator" ||
    kind === "css-generator";
  const isCalculator =
    kind === "calorie-calculator" ||
    kind === "loan-calculator" ||
    kind === "crypto-calculator" ||
    kind === "timezone-calculator" ||
    kind === "currency-exchange";
  const isAiTool =
    kind === "ai-ocr" ||
    kind === "ai-summarize" ||
    kind === "ai-remove-bg" ||
    kind === "ai-upscale" ||
    kind === "ai-erase";
  const isSocialDev =
    kind === "thumbnail-downloader" ||
    kind === "hashtag-generator" ||
    kind === "code-formatter" ||
    kind === "video-content-ideas";
  const isCurrency = kind === "currency-exchange";
  const isVideoToText = kind === "video-to-text";
  const isImageConverter = slug === "image-converter";
  const seo = getToolSeoContent(tool);
  const isWide =
    isPdf ||
    isCv ||
    isCurrency ||
    kind === "ai-erase" ||
    isImageConverter ||
    kind === "video-content-ideas";
  const tagline = cleanTagline(seo.tagline);

  return (
    <div
      className={`mx-auto w-full px-4 py-10 sm:px-6 sm:py-14 ${
        isWide ? "max-w-[1400px]" : "max-w-3xl"
      }`}
    >
      <Link
        href={`/#${category.anchor}`}
        className="text-sm font-bold text-[#1d4ed8] transition hover:underline"
      >
        ← {category.sectionTitle}
      </Link>

      <div className="mt-8 flex flex-col items-center text-center">
        <Link
          href="/"
          className="mb-5 inline-flex w-full max-w-[22rem] justify-center transition hover:opacity-90 sm:max-w-[28rem]"
          aria-label="Tool2Day — العودة للصفحة الرئيسية"
        >
          <Image
            src="/brand/logo-hero-eyes.png"
            alt="TOOL2DAY"
            width={920}
            height={220}
            className="h-auto w-full object-contain"
            priority
            unoptimized
          />
        </Link>

        <div className="flex items-center justify-center gap-3 sm:gap-4">
          {isCurrency ? (
            <Image
              src="/brand/currency-gold-coin.png"
              alt=""
              width={96}
              height={96}
              className="h-14 w-14 rounded-full object-cover shadow-md sm:h-16 sm:w-16"
              unoptimized
              aria-hidden
            />
          ) : (
            <Icon className="h-8 w-8 stroke-[2] text-[#111]" />
          )}
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0a0a0a] sm:text-4xl">
            {tool.title}
          </h1>
        </div>
        <p className="mt-3 max-w-xl text-base font-semibold leading-8 text-[#222]">
          {tagline}
        </p>
        <p className="mt-2 text-sm font-extrabold text-emerald-800">
          مجاني بالكامل
        </p>
      </div>

      <div className="mt-8">
        {isPdf ? (
          <PdfEditorWorkspace
            title={tool.title}
            description={tool.description}
            slug={tool.slug}
          />
        ) : isUtility ? (
          <UtilityToolWorkspace
            kind={kind as "text-tools" | "error-detector" | "speed-test"}
            slug={tool.slug}
            title={tool.title}
            description={tool.description}
          />
        ) : isGenerator ? (
          <GeneratorsWorkspace
            kind={
              kind as
                | "cv-builder"
                | "fancy-text"
                | "email-generator"
                | "css-generator"
            }
            slug={tool.slug}
            title={tool.title}
            description={tool.description}
          />
        ) : isCalculator ? (
          <CalculatorsWorkspace
            kind={
              kind as
                | "calorie-calculator"
                | "loan-calculator"
                | "crypto-calculator"
                | "timezone-calculator"
                | "currency-exchange"
            }
            slug={tool.slug}
            title={tool.title}
            description={tool.description}
          />
        ) : isAiTool ? (
          <AiToolsWorkspace
            kind={
              kind as
                | "ai-ocr"
                | "ai-summarize"
                | "ai-remove-bg"
                | "ai-upscale"
                | "ai-erase"
            }
            slug={tool.slug}
            title={tool.title}
            description={tool.description}
          />
        ) : isSocialDev ? (
          <SocialDevWorkspace
            kind={
              kind as
                | "thumbnail-downloader"
                | "hashtag-generator"
                | "code-formatter"
                | "video-content-ideas"
            }
            slug={tool.slug}
            title={tool.title}
            description={tool.description}
          />
        ) : isVideoToText ? (
          <VideoToTextWorkspace
            slug={tool.slug}
            title={tool.title}
            description={tool.description}
          />
        ) : isImageConverter ? (
          <ImageConverterWorkspace
            slug={tool.slug}
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

      <ToolSeoSections content={seo} toolSlug={tool.slug} />
    </div>
  );
}
