import { notFound } from "next/navigation";
import { HtmlLang } from "@/components/HtmlLang";
import { isLocale, site } from "@/content";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return site.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <>
      <HtmlLang locale={locale} />
      {children}
    </>
  );
}
