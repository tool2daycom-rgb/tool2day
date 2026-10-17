import Image from "next/image";
import type { Dictionary, Locale } from "@/content";
import { site } from "@/content";
import { Header } from "./Header";
import { ContactForm } from "./ContactForm";
import { SiteFooter } from "./SiteFooter";

type Props = {
  locale: Locale;
  t: Dictionary;
};

export function HomePage({ locale, t }: Props) {
  return (
    <>
      <Header locale={locale} t={t} />

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-atmosphere" aria-hidden="true" />
          <div className="shell hero-grid">
            <div className="hero-copy">
              <div className="hero-lockup">
                <p className="hero-brand">
                  tool<span className="hero-brand-two">2</span>day
                </p>
                <p className="hero-tagline">{t.hero.eyebrow}</p>
              </div>
              <h1 id="hero-title">{t.hero.title}</h1>
              <p className="lead">{t.hero.lead}</p>
              <div className="hero-actions">
                <a className="btn btn-primary" href={`/${locale}/start`}>
                  {t.hero.primaryCta}
                </a>
                <a className="btn btn-ghost" href="#services">
                  {t.hero.secondaryCta}
                </a>
              </div>
            </div>
            <div className="hero-visual reveal delay-1">
              <div className="hero-panel">
                <Image
                  src="/hero-visual.png"
                  alt=""
                  width={1024}
                  height={1024}
                  className="hero-image"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="section" aria-labelledby="services-title">
          <div className="shell">
            <header className="section-head">
              <p className="eyebrow">{t.services.eyebrow}</p>
              <h2 id="services-title">{t.services.title}</h2>
              <p className="lead">{t.services.lead}</p>
            </header>
            <ul className="service-grid">
              {t.services.items.map((item, index) => (
                <li
                  key={item.id}
                  id={item.id}
                  className={`service-card ${index === 0 ? "is-featured" : ""}`}
                >
                  <p className="card-label">{item.label}</p>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="work" className="section section-muted" aria-labelledby="work-title">
          <div className="shell">
            <header className="section-head">
              <p className="eyebrow">{t.work.eyebrow}</p>
              <h2 id="work-title">{t.work.title}</h2>
              <p className="lead">{t.work.lead}</p>
            </header>
            <ul className="work-grid">
              {t.work.items.map((item) => (
                <li key={item.title} className="work-card">
                  <div className="work-thumb" aria-hidden="true">
                    <span className="thumb-shape" />
                  </div>
                  <div className="work-body">
                    <span className="badge">{t.work.conceptBadge}</span>
                    <h3>
                      <a href={item.href}>{item.title}</a>
                    </h3>
                    <p>{item.summary}</p>
                    <ul className="tag-list">
                      {item.tags.map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="why" className="section" aria-labelledby="why-title">
          <div className="shell why-layout">
            <header className="section-head">
              <p className="eyebrow">{t.why.eyebrow}</p>
              <h2 id="why-title">{t.why.title}</h2>
              <p className="lead">{t.why.lead}</p>
            </header>
            <ul className="why-grid">
              {t.why.points.map((point) => (
                <li key={point.title}>
                  <h3>{point.title}</h3>
                  <p>{point.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="process" className="section section-process" aria-labelledby="process-title">
          <div className="shell">
            <header className="section-head">
              <p className="eyebrow">{t.process.eyebrow}</p>
              <h2 id="process-title">{t.process.title}</h2>
              <p className="lead">{t.process.lead}</p>
            </header>
            <ol className="process-grid">
              {t.process.steps.map((step) => (
                <li key={step.n}>
                  <p className="step-n">
                    <span>{step.n}</span>
                  </p>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="contact" className="section section-contact" aria-labelledby="contact-title">
          <div className="shell contact-layout">
            <div>
              <p className="eyebrow accent">{t.contact.eyebrow}</p>
              <h2 id="contact-title">{t.contact.title}</h2>
              <p className="lead on-dark">{t.contact.lead}</p>
              <p className="contact-email">
                <span>{t.contact.emailLabel}</span>
                <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
              </p>
              {site.links.whatsapp || site.links.linkedin || site.links.github ? (
                <ul className="social-list">
                  {site.links.whatsapp ? (
                    <li>
                      <a href={site.links.whatsapp} rel="noopener noreferrer">
                        WhatsApp
                      </a>
                    </li>
                  ) : null}
                  {site.links.linkedin ? (
                    <li>
                      <a href={site.links.linkedin} rel="noopener noreferrer">
                        LinkedIn
                      </a>
                    </li>
                  ) : null}
                  {site.links.github ? (
                    <li>
                      <a href={site.links.github} rel="noopener noreferrer">
                        GitHub
                      </a>
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </div>
            <ContactForm t={t.contact} />
          </div>
        </section>
      </main>

      <SiteFooter locale={locale} t={t} />
    </>
  );
}
