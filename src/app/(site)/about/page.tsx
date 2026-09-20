import type { Metadata } from "next";
import Link from "next/link";
import { sitePageAlternates } from "@/lib/seo-multilang";

export const metadata: Metadata = {
  title: "About Us | من نحن",
  description:
    "About Tool2Day — free browser tools for video, audio, PDF, converters, calculators, and generators.",
  alternates: sitePageAlternates("/about"),
  openGraph: {
    title: "About Us | Tool2Day",
    description:
      "Learn what Tool2Day is and how our free online tools help you convert, edit, and create.",
    url: "https://www.tool2day.com/about",
    siteName: "Tool2Day",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 text-[#333] sm:px-6 sm:py-16">
      <div className="space-y-5 text-[15px] leading-8 [&_h1]:mb-3 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-[#111] [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#111]">
        <h1>من نحن — About Tool2Day</h1>
        <p>
          Tool2Day منصة أدوات إلكترونية مجانية تعمل مباشرة من المتصفح. نساعد
          المستخدمين على تحويل الملفات، تحرير الفيديو والصوت وPDF، واستخدام
          حاسبات ومولدات يومية دون تثبيت برامج ثقيلة على الجهاز.
        </p>
        <p>
          Tool2Day is a free online toolkit that runs in your browser. We help
          people convert files, edit video, audio, and PDFs, and use everyday
          calculators and generators — without installing heavy desktop software.
        </p>

        <h2>ماذا نقدّم؟</h2>
        <p>
          نوفّر مجموعة أدوات عملية: محولات الملفات، أدوات الفيديو والصوت، أدوات
          PDF، مولدات النصوص والتصميم، وحاسبات مالية ورياضية. كل صفحة أداة تتضمن
          شرحاً وخطوات استخدام وصيغاً مدعومة وأسئلة شائعة حتى تفهم الفائدة قبل
          البدء.
        </p>
        <p>
          We offer practical utilities: file converters, video and audio tools,
          PDF utilities, text and design generators, and math or finance
          calculators. Each tool page includes an introduction, steps, supported
          formats, and FAQs so you know what to expect before you start.
        </p>

        <h2>قيمنا</h2>
        <ul className="list-disc space-y-2 ps-5">
          <li>مجاني للاستخدام الأساسي دون إجبارك على اشتراك.</li>
          <li>معالجة داخل المتصفح قدر الإمكان لحماية الخصوصية.</li>
          <li>لا نضيف شعار Tool2Day على ملفاتك المُصدَّرة.</li>
          <li>نلتزم بسياسات الإعلانات والمحتوى المسؤول.</li>
        </ul>

        <h2>التواصل</h2>
        <p>
          لأي استفسار أو بلاغ عن مشكلة أو حقوق نشر، راسلنا عبر{" "}
          <Link href="/contact" className="font-semibold text-[#2563eb] hover:underline">
            صفحة اتصل بنا
          </Link>{" "}
          أو البريد{" "}
          <a
            href="mailto:support@tool2day.com"
            className="font-semibold text-[#2563eb] hover:underline"
          >
            support@tool2day.com
          </a>
          .
        </p>
        <p>
          For support, copyright notices, or feedback, use our{" "}
          <Link href="/contact" className="font-semibold text-[#2563eb] hover:underline">
            Contact page
          </Link>{" "}
          or email{" "}
          <a
            href="mailto:support@tool2day.com"
            className="font-semibold text-[#2563eb] hover:underline"
          >
            support@tool2day.com
          </a>
          .
        </p>
      </div>

      <p className="mt-10">
        <Link
          href="/"
          className="text-sm font-semibold text-[#2563eb] hover:underline"
        >
          ← العودة للصفحة الرئيسية
        </Link>
      </p>
    </article>
  );
}
