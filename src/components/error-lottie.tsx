"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const LOTTIE_SRC =
  "https://lottie.host/bc2c4816-2ecf-4cdb-93e8-f961eaf32d8a/UDN78enqhj.lottie";
const SCRIPT_SRC =
  "https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.4/dist/dotlottie-wc.js";

type DotLottieWcProps = React.HTMLAttributes<HTMLElement> & {
  src?: string;
  autoplay?: boolean | string;
  loop?: boolean | string;
};

const DotLottieWc =
  "dotlottie-wc" as unknown as React.ElementType<DotLottieWcProps>;

export function ErrorLottie({
  className = "",
  size = 300,
}: {
  className?: string;
  size?: number;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof customElements === "undefined") return;
    if (customElements.get("dotlottie-wc")) {
      setReady(true);
      return;
    }
    void customElements
      .whenDefined("dotlottie-wc")
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, []);

  return (
    <div
      className={`mx-auto flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Script
        src={SCRIPT_SRC}
        type="module"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      {ready ? (
        <DotLottieWc
          src={LOTTIE_SRC}
          style={{ width: `${size}px`, height: `${size}px` }}
          autoplay=""
          loop=""
        />
      ) : (
        <div className="h-full w-full animate-pulse rounded-full bg-[#dfeee6]" />
      )}
    </div>
  );
}
