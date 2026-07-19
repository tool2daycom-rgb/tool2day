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
      ? { w: 120, h: 48 }
      : size === "sm"
        ? { w: 56, h: 22 }
        : { w: 88, h: 36 };

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src="/brand/logo-mark-sizes.svg"
        alt=""
        width={dims.w}
        height={dims.h}
        className="h-auto max-h-10 w-auto sm:max-h-12"
        style={
          size === "lg"
            ? { maxHeight: "2.75rem" }
            : size === "sm"
              ? { maxHeight: "1.5rem" }
              : { maxHeight: "2.25rem" }
        }
        priority
        unoptimized
      />
      {showWord ? (
        <span
          className={`font-[family-name:var(--font-display)] font-bold tracking-tight ${
            size === "lg"
              ? "text-3xl sm:text-4xl"
              : size === "sm"
                ? "text-base"
                : "text-xl"
          }`}
        >
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
