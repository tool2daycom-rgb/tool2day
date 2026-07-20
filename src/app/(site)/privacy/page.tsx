import type { Metadata } from "next";
import { InfoShell } from "@/components/info-shell";

export const metadata: Metadata = {
  title: "الخصوصية",
  description: "سياسة الخصوصية في Tool2Day",
};

export default function PrivacyPage() {
  return (
    <InfoShell
      title="الخصوصية"
      description="كيف نتعامل مع بياناتك على Tool2Day."
      paragraphs={[
        "نعالج الملفات محلياً في المتصفح قدر الإمكان، ولا نرفع محتواك إلى خوادمنا إلا عند الحاجة لتشغيل خدمة محددة.",
        "لا نبيع بياناتك الشخصية. نستخدم معلومات تقنية أساسية لتحسين الخدمة والأمان.",
        "باستخدامك للموقع فإنك توافق على هذه السياسة. يمكن تحديثها عند الحاجة مع إبقاء نسخة محدّثة هنا.",
      ]}
    />
  );
}
