import Link from "next/link";
import { BrandMarkAnimated } from "@/components/brand-mark-animated";

const links = [
  { href: "/privacy", label: "الخصوصية" },
  { href: "/terms", label: "الشروط والأحكام" },
  { href: "/refund", label: "سياسة الاسترداد" },
  { href: "/pricing", label: "التسعير" },
  { href: "/help", label: "المساعدة" },
  { href: "/contact", label: "تواصل معنا" },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-auto bg-[#0a0a0a] text-white">
      {/* موجة علوية بأسلوب SISTRIX */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -translate-y-[calc(100%-1px)] leading-none">
        <svg
          viewBox="0 0 1440 72"
          preserveAspectRatio="none"
          className="block h-10 w-full sm:h-14"
          aria-hidden
        >
          <path
            fill="#1a1a1a"
            d="M0,48 C240,72 480,8 720,32 C960,56 1200,8 1440,36 L1440,72 L0,72 Z"
          />
          <path
            fill="#0a0a0a"
            d="M0,56 C280,20 520,68 760,44 C1000,20 1240,60 1440,40 L1440,72 L0,72 Z"
          />
        </svg>
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-12">
        <div className="flex flex-col items-center gap-8">
          <BrandMarkAnimated size={56} motion="morph" />

          <nav
            aria-label="روابط التذييل"
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-semibold text-white/90 sm:gap-x-8 sm:text-[15px]"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex w-full flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/55 sm:flex-row sm:text-sm">
            <p>© Tool2Day</p>
            <p>العربية</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
