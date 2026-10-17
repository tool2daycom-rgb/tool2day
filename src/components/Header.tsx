"use client";

import { useEffect, useState } from "react";
import type { Dictionary, Locale } from "@/content";
import { Logo } from "./Logo";
import { LanguageSwitch } from "./LanguageSwitch";

type Props = {
  locale: Locale;
  t: Dictionary;
};

export function Header({ locale, t }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const links = [
    { href: "#services", label: t.nav.services },
    { href: "#work", label: t.nav.work },
    { href: "#why", label: t.nav.why },
    { href: "#process", label: t.nav.process },
    { href: "#contact", label: t.nav.contact },
  ];

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="shell header-inner">
        <Logo locale={locale} variant="mark" />

        <nav className="nav-desktop" aria-label="Primary">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <LanguageSwitch locale={locale} ariaLabel={t.nav.langAria} />
          <a className="btn btn-primary header-cta" href="#contact">
            {t.nav.cta}
          </a>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            <span aria-hidden="true" className={open ? "burger is-open" : "burger"} />
          </button>
        </div>
      </div>

      <div id="mobile-nav" className={`mobile-nav ${open ? "is-open" : ""}`}>
        <nav aria-label="Mobile">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <a className="btn btn-primary" href="#contact" onClick={() => setOpen(false)}>
            {t.nav.cta}
          </a>
        </nav>
      </div>
    </header>
  );
}
