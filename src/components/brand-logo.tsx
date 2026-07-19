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
  const markPx = size === "lg" ? 28 : size === "sm" ? 18 : 22;

  return (
    <span
      dir="ltr"
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <BrandMarkAnimated size={markPx} />
      {showWord ? (
        <span
          className={`inline-flex items-center font-[family-name:var(--font-display)] font-black uppercase tracking-[-0.02em] ${
            size === "lg"
              ? twoAsImage
                ? "text-[2rem] leading-none sm:text-[2.4rem]"
                : "text-[1.35rem] leading-none sm:text-[1.5rem]"
              : size === "sm"
                ? "text-[0.95rem] leading-none"
                : "text-[1.15rem] leading-none"
          } ${twoAsImage ? "text-[#111]" : "text-white"}`}
        >
          <span>tool</span>
          {twoAsImage ? (
            <Image
              src="/pngegg.png"
              alt="2"
              width={64}
              height={92}
              className="mx-1 inline-block h-[1.7em] w-auto translate-y-[-0.08em] object-contain"
              unoptimized
              priority
            />
          ) : (
            <span>2</span>
          )}
          <span>day</span>
        </span>
      ) : null}
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
