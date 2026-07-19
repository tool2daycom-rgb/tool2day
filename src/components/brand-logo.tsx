import Image from "next/image";
import Link from "next/link";

/** شعار Tool2Day — الأحجام المتدرجة الشفافة */
export function BrandLogo({
  className = "",
  showWord = true,
  size = "md",
}: {
  className?: string;
  showWord?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const dims =
    size === "lg"
      ? { w: 72, h: 28 }
      : size === "sm"
        ? { w: 36, h: 14 }
        : { w: 48, h: 18 };

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/brand/logo-mark-sizes.svg"
        alt=""
        width={dims.w}
        height={dims.h}
        className="h-auto w-auto"
        priority
        unoptimized
      />
      {showWord ? (
        <span className="font-[family-name:var(--font-display)] font-bold tracking-tight">
          Tool2Day
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
