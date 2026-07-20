import type { Metadata } from "next";
import { HelpFaq } from "@/components/help-faq";

export const metadata: Metadata = {
  title: "المساعدة",
  description:
    "مركز مساعدة Tool2Day — الفوترة والحساب واستكشاف أخطاء أدوات الفيديو والصوت وPDF.",
};

export default function HelpPage() {
  return <HelpFaq />;
}
