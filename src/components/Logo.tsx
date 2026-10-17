import Link from "next/link";

type LogoProps = {
  locale: string;
  className?: string;
};

export function Logo({ locale, className = "" }: LogoProps) {
  return (
    <Link href={`/${locale}`} className={`logo-mark ${className}`} aria-label="tool2day">
      <span className="logo-word">
        tool<span className="logo-two">2</span>day
      </span>
    </Link>
  );
}
