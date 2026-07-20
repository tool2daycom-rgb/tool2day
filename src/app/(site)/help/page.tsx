import type { Metadata } from "next";
import { InfoShell } from "@/components/info-shell";

export const metadata: Metadata = {
  title: "المساعدة",
  description: "مركز المساعدة في Tool2Day",
};

export default function HelpPage() {
  return (
    <InfoShell
      title="المساعدة"
      description="إجابات سريعة لأكثر الأسئلة شيوعاً."
      paragraphs={[
        "اختر الأداة من الصفحة الرئيسية، ارفع ملفك، ثم ابدأ المعالجة مباشرة في المتصفح.",
        "إذا توقف التحميل أو فشلت المعالجة، جرّب ملفاً أصغر أو متصفحاً حديثاً مثل Chrome أو Edge.",
        "للمزيد من الدعم، استخدم صفحة «تواصل معنا».",
      ]}
    />
  );
}
