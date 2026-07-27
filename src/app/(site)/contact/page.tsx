import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { sitePageAlternates } from "@/lib/seo-multilang";

export const metadata: Metadata = {
  title: "تواصل معنا",
  description: "أرسل رسالة أو أبلغ عن مشكلة لفريق Tool2Day",
  alternates: sitePageAlternates("/contact"),
};

export default function ContactPage() {
  return <ContactForm />;
}
