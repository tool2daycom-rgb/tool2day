import type { Metadata } from "next";
import { InfoShell } from "@/components/info-shell";

export const metadata: Metadata = {
  title: "التسعير",
  description: "التسعير في Tool2Day",
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
