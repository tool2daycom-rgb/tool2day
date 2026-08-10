import type { Metadata } from "next";
import { HelpFaq } from "@/components/help-faq";
import { sitePageAlternates } from "@/lib/seo-multilang";

export const metadata: Metadata = {
  title: "المساعدة",
  description:
    "مركز مساعدة Tool2Day — الفوترة والحساب واستكشاف أخطاء أدوات الفيديو والصوت وPDF.",
  alternates: sitePageAlternates("/help"),
  openGraph: {
    title: "المساعدة | Tool2Day",
    description:
      "مركز مساعدة Tool2Day — الفوترة والحساب واستكشاف أخطاء الأدوات.",
    url: "https://www.tool2day.com/help",
    siteName: "Tool2Day",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function HelpPage() {
  return <HelpFaq />;
}
