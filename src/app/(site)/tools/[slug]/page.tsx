import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { AiToolsWorkspace } from "@/components/ai-tools-workspace";
import { CalculatorsWorkspace } from "@/components/calculators-workspace";
import { GeneratorsWorkspace } from "@/components/generators-workspace";
import { ImageConverterWorkspace } from "@/components/image-converter-workspace";
import { PdfEditorWorkspace } from "@/components/pdf-editor-workspace";
import { SocialDevWorkspace } from "@/components/social-dev-workspace";
import { ToolPageIntro } from "@/components/tool-page-intro";
import { ToolSeoSections } from "@/components/tool-seo-sections";
import { ToolWorkspace } from "@/components/tool-workspace";
import { UtilityToolWorkspace } from "@/components/utility-tool-workspace";
import { VideoToTextWorkspace } from "@/components/video-to-text-workspace";
import { VideoSubtitlesWorkspace } from "@/components/video-subtitles-workspace";
import { KineticCaptionsWorkspace } from "@/components/kinetic-captions-workspace";
import { PngLibraryWorkspace } from "@/components/png-library-workspace";
import { getToolTitle } from "@/lib/i18n/tool-titles";
import { JsonLd } from "@/components/json-ld";
import { resolveRequestLocale } from "@/lib/request-locale";
import { getToolKeywords } from "@/lib/seo-keywords";
import {
  buildLanguageAlternateMap,
  buildToolJsonLd,
  getLocalizedMetaDescription,
  getLocalizedMetaTitle,
  ogLocaleTag,
} from "@/lib/seo-multilang";
import { getToolSeoContent } from "@/lib/tool-seo-content";
import { categoryMeta, getTool, tools } from "@/lib/tools";
import { getToolKind } from "@/lib/processors/active-tools";
import { getToolImageIcon } from "@/lib/tool-image-icons";

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
  const locale = await resolveRequestLocale();
  const displayTitle = getToolTitle(tool.slug, locale, tool.title);
  const seo = getToolSeoContent(tool, { locale, title: displayTitle });
  const metaTitle = getLocalizedMetaTitle(tool.slug, locale, tool.title);
  const metaDescription = getLocalizedMetaDescription(
    tool.slug,
    locale,
    tool.title,
    seo.tagline,
    tool.description,
  );
  const path = `/tools/${tool.slug}`;
  return {
    title: metaTitle,
    description: metaDescription,
    keywords: getToolKeywords(tool),
    openGraph: {
      title: `${metaTitle} | Tool2Day`,
      description: metaDescription,
      url: `https://www.tool2day.com${path}`,
      siteName: "Tool2Day",
      locale: ogLocaleTag(locale),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${metaTitle} | Tool2Day`,
      description: metaDescription,
    },
    alternates: {
      canonical: `https://www.tool2day.com${path}`,
      languages: buildLanguageAlternateMap(path),
    },
    robots: { index: true, follow: true },
  };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  if (slug === "video-editor") {
    redirect("/tools/video-editor");
  }

  const tool = getTool(slug);
  if (!tool) notFound();

  const locale = await resolveRequestLocale();
  const displayTitle = getToolTitle(tool.slug, locale, tool.title);
  const seo = getToolSeoContent(tool, { locale, title: displayTitle });
  const metaDescription = getLocalizedMetaDescription(
    tool.slug,
    locale,
    tool.title,
    seo.tagline,
    tool.description,
  );
  const jsonLd = buildToolJsonLd({
    tool,
    locale,
    displayTitle,
    description: metaDescription,
    seo,
  });

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
    kind === "css-generator" ||
    kind === "color-converter" ||
    kind === "color-palette-extractor" ||
    kind === "css-gradient-generator";
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
  const isVideoSubtitles = kind === "video-subtitles";
  const isKineticCaptions = kind === "kinetic-captions";
  const isPngLibrary = kind === "png-library";
  const isImageConverter = slug === "image-converter";
  const isWide =
    isPdf ||
    isCv ||
    isCurrency ||
    kind === "ai-erase" ||
    isImageConverter ||
    isVideoSubtitles ||
    isKineticCaptions ||
    isPngLibrary ||
    kind === "video-content-ideas";

  return (
    <div
      className={`mx-auto w-full px-4 py-10 sm:px-6 sm:py-14 ${
        isWide ? "max-w-[1400px]" : "max-w-3xl"
      }`}
    >
      <JsonLd data={jsonLd} />
      <ToolPageIntro
        slug={tool.slug}
        arTitle={tool.title}
        categoryAnchor={category.anchor}
        categoryKey={tool.category}
      >
        {getToolImageIcon(tool.slug) ? (
          <Image
            src={getToolImageIcon(tool.slug)!}
            alt=""
            width={64}
            height={64}
            className="h-14 w-14 object-contain sm:h-16 sm:w-16"
            unoptimized
            aria-hidden
          />
        ) : (
          <Icon className="h-8 w-8 stroke-[2] text-[#111]" />
        )}
      </ToolPageIntro>

      <div className="mt-8">
        {isPdf ? (
          <PdfEditorWorkspace
            arTitle={tool.title}
            arDescription={tool.description}
            slug={tool.slug}
          />
        ) : isUtility ? (
          <UtilityToolWorkspace
            kind={kind as "text-tools" | "error-detector" | "speed-test"}
            slug={tool.slug}
            arTitle={tool.title}
            arDescription={tool.description}
          />
        ) : isGenerator ? (
          <GeneratorsWorkspace
            kind={
              kind as
                | "cv-builder"
                | "fancy-text"
                | "email-generator"
                | "css-generator"
                | "color-converter"
                | "color-palette-extractor"
                | "css-gradient-generator"
            }
            slug={tool.slug}
            arTitle={tool.title}
            arDescription={tool.description}
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
            arTitle={tool.title}
            arDescription={tool.description}
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
            arTitle={tool.title}
            arDescription={tool.description}
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
            arTitle={tool.title}
            arDescription={tool.description}
          />
        ) : isVideoToText ? (
          <VideoToTextWorkspace
            slug={tool.slug}
            arTitle={tool.title}
            arDescription={tool.description}
          />
        ) : isVideoSubtitles ? (
          <VideoSubtitlesWorkspace
            slug={tool.slug}
            arTitle={tool.title}
            arDescription={tool.description}
          />
        ) : isKineticCaptions ? (
          <KineticCaptionsWorkspace
            slug={tool.slug}
            arTitle={tool.title}
            arDescription={tool.description}
          />
        ) : isPngLibrary ? (
          <PngLibraryWorkspace
            slug={tool.slug}
            arTitle={tool.title}
            arDescription={tool.description}
          />
        ) : isImageConverter ? (
          <ImageConverterWorkspace
            slug={tool.slug}
            arTitle={tool.title}
            arDescription={tool.description}
          />
        ) : (
          <ToolWorkspace
            slug={tool.slug}
            arTitle={tool.title}
            arDescription={tool.description}
            accept={tool.accept}
          />
        )}
      </div>

      <ToolSeoSections toolSlug={tool.slug} arTitle={tool.title} />
    </div>
  );
}
