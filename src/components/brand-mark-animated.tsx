/** شعار المثلث المتحرك — أصفر / أزرق / برتقالي */
export function BrandMarkAnimated({
  className = "",
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={`brand-mark-animated inline-flex shrink-0 ${className}`}
      style={{ width: size, height: Math.round(size * 0.9) }}
      aria-hidden
    >
      <svg
        viewBox="0 0 200 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full overflow-visible"
        role="img"
        aria-label="Tool2Day"
      >
        <g className="brand-mark-sway">
          <circle
            className="brand-dot brand-dot-a"
            cx="100"
            cy="48"
            r="36"
            fill="#F5C518"
          />
          <circle
            className="brand-dot brand-dot-b"
            cx="58"
            cy="128"
            r="36"
            fill="#5B9BF5"
          />
          <circle
            className="brand-dot brand-dot-c"
            cx="142"
            cy="128"
            r="36"
            fill="#E8874A"
          />
        </g>
      </svg>
    </span>
  );
}
