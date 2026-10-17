import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  locale: string;
  variant?: "full" | "mark";
  className?: string;
};

export function Logo({ locale, variant = "full", className = "" }: LogoProps) {
  if (variant === "mark") {
    return (
      <Link href={`/${locale}`} className={`logo-mark ${className}`} aria-label="tool2day">
        <Image
          src="/icon.png"
          alt=""
          width={40}
          height={40}
          className="logo-icon-img"
          priority
        />
        <span className="logo-word">
          tool<span className="logo-two">2</span>day
        </span>
      </Link>
    );
  }

  return (
    <Link href={`/${locale}`} className={`logo-full ${className}`} aria-label="tool2day">
      <Image
        src="/logo.png"
        alt="tool2day — Websites · Apps · Digital"
        width={280}
        height={96}
        className="logo-image"
        priority
      />
    </Link>
  );
}
