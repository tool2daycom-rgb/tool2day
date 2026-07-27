import type { Metadata } from "next";
import { InfoShell } from "@/components/info-shell";
import { sitePageAlternates } from "@/lib/seo-multilang";

export const metadata: Metadata = {
  title: "التسعير",
  description:
    "تسعير Tool2Day — الأدوات الأساسية مجانية حالياً بدون رسوم خفية. باقات اختيارية لاحقاً بأسعار واضحة.",
  alternates: sitePageAlternates("/pricing"),
  openGraph: {
    title: "التسعير | Tool2Day",
    description:
      "الأدوات الأساسية مجانية حالياً في المتصفح — بدون رسوم خفية على الاستخدام المجاني.",
    url: "https://www.tool2day.com/pricing",
    siteName: "Tool2Day",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function PricingPage() {
  return (
    <InfoShell
      title="التسعير"
      description="الأدوات الأساسية مجانية حالياً."
      paragraphs={[
        "يمكنك استخدام أدوات التحويل والفيديو والصوت وPDF مجاناً ضمن الحدود المتاحة في المتصفح.",
        "قد نضيف لاحقاً باقات اختيارية لمميزات متقدمة — وسنعرض الأسعار بوضوح هنا قبل أي تفعيل.",
        "لا توجد رسوم خفية على الأدوات المجانية الحالية.",
      ]}
    />
  );
}
