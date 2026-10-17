import type { Dictionary, Locale } from "@/content";
import { site } from "@/content";
import { Logo } from "./Logo";
import { FooterYear } from "./FooterYear";

type Props = {
  locale: Locale;
  t: Dictionary;
};

type FooterLink = {
  label: string;
  href?: string;
};

export function SiteFooter({ locale, t }: Props) {
  const whatsapp = site.links.whatsapp.trim();

  const serviceLinks: FooterLink[] = [
    { label: t.footer.websites, href: "#websites" },
    { label: t.footer.webapps, href: "#webapps" },
    { label: t.footer.mobile, href: "#mobile" },
    { label: t.footer.hosting },
  ];

  const companyLinks: FooterLink[] = [
    { label: t.footer.about, href: "#why" },
    { label: t.footer.projects, href: "#work" },
    { label: t.footer.contact, href: "#contact" },
  ];

  return (
    <>
      <footer className="site-footer">
        <div className="shell footer-grid">
          <div className="footer-brand">
            <Logo locale={locale} />
            <p>{t.footer.blurb}</p>
          </div>

          <div>
            <h2>{t.footer.servicesTitle}</h2>
            <ul>
              {serviceLinks.map((item) => (
                <li key={item.label}>
                  {item.href ? <a href={item.href}>{item.label}</a> : <span>{item.label}</span>}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2>{t.footer.companyTitle}</h2>
            <ul>
              {companyLinks.map((item) => (
                <li key={item.label}>
                  {item.href ? <a href={item.href}>{item.label}</a> : <span>{item.label}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="shell footer-bottom">
          <p>
            © <FooterYear /> {t.footer.rights}
          </p>
          <ul className="footer-legal">
            <li>
              <a href={site.legal.imprint}>{t.footer.imprint}</a>
            </li>
            <li>
              <a href={site.legal.privacy}>{t.footer.privacy}</a>
            </li>
          </ul>
        </div>
      </footer>

      {whatsapp ? (
        <a
          className="whatsapp-fab"
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.footer.whatsappAria}
        >
          <WhatsAppIcon />
        </a>
      ) : null}
    </>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M16.02 3.2C9.1 3.2 3.5 8.78 3.5 15.68c0 2.2.58 4.35 1.68 6.24L3.2 28.8l7.1-1.86a12.4 12.4 0 0 0 5.72 1.4h.01c6.92 0 12.52-5.58 12.52-12.48S22.94 3.2 16.02 3.2zm7.27 17.72c-.31.88-1.84 1.62-2.56 1.72-.66.1-1.5.14-2.42-.15-.56-.17-1.28-.4-2.2-.78-3.87-1.67-6.38-5.56-6.57-5.82-.2-.26-1.56-2.08-1.56-3.96s.99-2.81 1.34-3.19c.35-.38.76-.48 1.01-.48h.73c.23 0 .54-.09.84.64.31.75 1.05 2.57 1.14 2.75.09.18.15.39.03.62-.12.24-.18.39-.36.6-.18.21-.38.47-.54.63-.18.18-.36.37-.15.72.2.35.9 1.48 1.93 2.4 1.33 1.18 2.45 1.55 2.8 1.72.35.18.55.15.76-.09.2-.24.88-1.02 1.11-1.37.24-.35.47-.29.79-.17.31.12 2 .94 2.34 1.11.35.18.58.26.66.41.09.15.09.88-.22 1.76z"
      />
    </svg>
  );
}
