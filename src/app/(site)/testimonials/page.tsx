import type { Metadata } from "next";
import { TestimonialsWorkspace } from "@/components/testimonials-workspace";
import { sitePageAlternates } from "@/lib/seo-multilang";

export const metadata: Metadata = {
  title: "ماذا يقولون عنا",
  description:
    "آراء وتقييمات مستخدمي Tool2Day — أسماء المستخدمين وتعليقاتهم حول الأدوات المجانية.",
  alternates: sitePageAlternates("/testimonials"),
};

export default function TestimonialsPage() {
  return <TestimonialsWorkspace mode="page" />;
}
