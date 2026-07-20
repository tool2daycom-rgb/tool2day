import type { Metadata } from "next";
import { InfoShell } from "@/components/info-shell";

export const metadata: Metadata = {
  title: "تواصل معنا",
  description: "تواصل مع فريق Tool2Day",
};

export default function ContactPage() {
  return (
    <InfoShell
      title="تواصل معنا"
      description="يسعدنا سماع ملاحظاتك واقتراحاتك."
      paragraphs={[
        "راسلنا عبر البريد: support@tool2day.com",
        "اذكر اسم الأداة ونوع الملف ووصف المشكلة لنتمكن من المساعدة بسرعة.",
        "نحاول الرد في أقرب وقت ممكن خلال أيام العمل.",
      ]}
    />
  );
}
