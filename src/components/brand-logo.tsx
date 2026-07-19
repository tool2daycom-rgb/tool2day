import Image from "next/image";
import Link from "next/link";
import { BrandMarkAnimated } from "@/components/brand-mark-animated";

/** شعار Tool2Day بأسلوب 123apps: أيقونة مثلث صغيرة + اسم عريض */
export function BrandLogo({
  className = "",
  showWord = true,
  size = "md",
  /** استبدال رقم 2 بصورة pngegg (لشعار وسط الصفحة) */
  twoAsImage = false,
}: {
  className?: string;
  showWord?: boolean;
  size?: "sm" | "md" | "lg";
  twoAsImage?: boolean;
}) {
  const markPx =
    size === "lg" ? (twoAsImage ? 44 : 28) : size === "sm" ? 18 : 22;

  return (
    <span
      dir="ltr"
      className={`inline-flex items-center ${twoAsImage ? "gap-3" : "gap-2"} ${className}`}
    >
      {showWord ? (
        <span
          className={`inline-flex items-center font-[family-name:var(--font-display)] font-extrabold uppercase tracking-[-0.02em] ${
            size === "lg"
              ? twoAsImage
                ? "text-[2.75rem] leading-none sm:text-[3.5rem]"
                : "text-[1.35rem] leading-none sm:text-[1.5rem]"
              : size === "sm"
                ? "text-[0.95rem] leading-none"
                : "text-[1.2rem] leading-none tracking-[-0.03em]"
          } ${twoAsImage ? "text-[#111]" : "text-white"}`}
        >
          <span>tool</span>
          {twoAsImage ? (
            <Image
              src="/pngegg.png"
              alt="2"
              width={96}
              height={138}
              className="mx-1.5 inline-block h-[1.85em] w-auto translate-y-[-0.08em] object-contain"
              unoptimized
              priority
            />
          ) : (
            <span
              className="mx-0.5 inline-block border-y-[1.75px] border-current px-[0.1em] text-[0.88em] leading-[0.95] tracking-normal"
              aria-label="2"
            >
              2
            </span>
          )}
          <span>day</span>
        </span>
      ) : null}
      <BrandMarkAnimated size={markPx} />
    </span>
  );
}

export function BrandLogoLink({
  className = "",
  showWord = true,
  size = "md",
}: {
  className?: string;
  showWord?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Link
      href="/"
      className={`inline-flex shrink-0 items-center transition hover:opacity-90 ${className}`}
      aria-label="Tool2Day — الصفحة الرئيسية"
    >
      <BrandLogo showWord={showWord} size={size} />
    </Link>
  );
}
