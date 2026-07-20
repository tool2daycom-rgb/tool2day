import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "تواصل معنا",
  description: "أرسل رسالة أو أبلغ عن مشكلة لفريق Tool2Day",
};

export default function ContactPage() {
  return <ContactForm />;
}
