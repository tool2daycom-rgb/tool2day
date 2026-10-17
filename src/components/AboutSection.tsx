"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import type { Dictionary, Locale } from "@/content";

type Props = {
  locale: Locale;
  t: Dictionary["why"];
};

export function AboutSection({ locale, t }: Props) {
  const [active, setActive] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!active) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActive(false);
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (sectionRef.current?.contains(target)) return;
      setActive(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [active]);

  return (
    <section
      id="why"
      ref={sectionRef}
      className={`section about-section ${active ? "is-spotlight" : ""}`}
      aria-labelledby={titleId}
    >
      <div
        className={`about-spotlight-scrim ${active ? "is-visible" : ""}`}
        aria-hidden="true"
      />

      <div className="shell about-layout">
        <button
          type="button"
          ref={cardRef}
          className="about-portrait"
          aria-pressed={active}
          aria-describedby={titleId}
          onMouseEnter={() => setActive(true)}
          onMouseLeave={() => setActive(false)}
          onFocus={() => setActive(true)}
          onBlur={(event) => {
            const next = event.relatedTarget as Node | null;
            if (next && sectionRef.current?.contains(next)) return;
            setActive(false);
          }}
          onClick={() => {
            if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
              return;
            }
            setActive((value) => !value);
          }}
        >
          <Image
            src="/about-portrait.jpg"
            alt={t.imageAlt}
            width={571}
            height={1024}
            className="about-portrait-image"
            sizes="(max-width: 720px) 72vw, 280px"
            priority={false}
          />
        </button>

        <div
          className="about-copy"
          onMouseEnter={() => {
            if (window.matchMedia("(hover: hover)").matches) setActive(true);
          }}
          onMouseLeave={() => {
            if (window.matchMedia("(hover: hover)").matches) setActive(false);
          }}
          onFocusCapture={() => setActive(true)}
          onBlurCapture={(event) => {
            const next = event.relatedTarget as Node | null;
            if (next && sectionRef.current?.contains(next)) return;
            setActive(false);
          }}
        >
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 id={titleId}>{t.title}</h2>
          {t.body.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="about-text">
              {paragraph}
            </p>
          ))}
          <a className="btn btn-primary about-cta" href={`/${locale}/start`}>
            {t.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
