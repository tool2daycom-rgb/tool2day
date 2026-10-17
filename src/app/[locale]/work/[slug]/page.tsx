import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, site } from "@/content";
import { getWorkCopy, getWorkProject } from "@/content/work";
import { WorkProjectPage } from "@/components/WorkProjectPage";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  const projects = getWorkCopy("de").projects;
  return site.locales.flatMap((locale) =>
    projects.map((project) => ({ locale, slug: project.id })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const project = getWorkProject(locale, slug);
  if (!project) return {};
  return {
    title: `${project.title} | tool2day`,
    description: project.summary,
    alternates: {
      canonical: `/${locale}/work/${project.id}`,
      languages: {
        de: `/de/work/${project.id}`,
        en: `/en/work/${project.id}`,
        "x-default": `/${site.defaultLocale}/work/${project.id}`,
      },
    },
  };
}

export default async function WorkSlugPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const project = getWorkProject(locale, slug);
  if (!project) notFound();
  return <WorkProjectPage locale={locale} project={project} />;
}
