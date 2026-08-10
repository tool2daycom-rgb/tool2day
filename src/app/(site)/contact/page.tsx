import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { sitePageAlternates } from "@/lib/seo-multilang";

export const metadata: Metadata = {
  title: "تواصل معنا",
  description:
    "تواصل مع فريق Tool2Day — اطرح سؤالاً، أبلغ عن خطأ، أو اقترح ميزة. نرد عبر النموذج خلال أقرب وقت.",
  keywords: [
    "تواصل معنا",
    "دعم Tool2Day",
    "contact Tool2Day",
    "دعم فني",
    "إبلاغ عن مشكلة",
  ],
  alternates: sitePageAlternates("/contact"),
  openGraph: {
    title: "تواصل معنا | Tool2Day",
    description:
      "أرسل رسالة أو أبلغ عن مشكلة لفريق Tool2Day — دعم مجاني عبر النموذج.",
    url: "https://www.tool2day.com/contact",
    siteName: "Tool2Day",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  return <ContactForm />;
}
