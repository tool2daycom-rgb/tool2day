import type { Metadata } from "next";
import { InfoShell } from "@/components/info-shell";

export const metadata: Metadata = {
  title: "سياسة الاسترداد",
  description: "سياسة الاسترداد في Tool2Day",
};

export default function RefundPage() {
  return (
    <InfoShell
      title="سياسة الاسترداد"
      description="شروط الاسترداد للخدمات المدفوعة إن وُجدت."
      paragraphs={[
        "معظم أدوات Tool2Day مجانية وتعمل في المتصفح بدون رسوم.",
        "إذا فعّلنا لاحقاً باقات مدفوعة، سيتم توضيح مدة الاسترداد وشروطه بوضوح قبل الدفع.",
        "لأي طلب استرداد أو استفسار مالي، تواصل معنا عبر صفحة التواصل.",
      ]}
    />
  );
}
