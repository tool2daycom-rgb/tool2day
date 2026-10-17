import Link from "next/link";
import type { Locale } from "@/content";
import { getDictionary } from "@/content";
import { getMobileAppsCopy } from "@/content/mobile-apps";
import { Header } from "./Header";
import { SiteFooter } from "./SiteFooter";

type Props = {
  locale: Locale;
};

export function MobileAppsPage({ locale }: Props) {
  const t = getDictionary(locale);
  const m = getMobileAppsCopy(locale);

  return (
    <>
      <Header locale={locale} t={t} />
      <main className="service-page">
        <section className="service-hero">
          <div className="shell">
            <nav className="project-breadcrumb" aria-label="Breadcrumb">
              <Link href={`/${locale}`}>{m.breadcrumbHome}</Link>
              <span>/</span>
              <Link href={`/${locale}#services`}>{m.breadcrumbServices}</Link>
              <span>/</span>
              <span>{m.breadcrumbCurrent}</span>
            </nav>

            <p className="service-hero-badge">{m.eyebrow}</p>
            <h1>{m.title}</h1>
            <p className="project-hero-lead">{m.lead}</p>

            <div className="service-hero-actions">
              <Link className="btn btn-primary" href={`/${locale}/start`}>
                {m.primaryCta}
                <span aria-hidden="true"> →</span>
              </Link>
              <Link className="btn btn-ghost service-hero-ghost" href={`/${locale}#work`}>
                {m.secondaryCta}
              </Link>
            </div>

            <ul className="project-stats service-hero-stats">
              {m.stats.map((stat) => (
                <li key={stat.label}>
                  <strong>{stat.value}</strong>
                  <p>{stat.label}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section">
          <div className="shell">
            <p className="service-intro">{m.intro}</p>
          </div>
        </section>

        <section className="section section-muted" aria-labelledby="build-title">
          <div className="shell">
            <header className="section-head">
              <h2 id="build-title">{m.buildTitle}</h2>
            </header>
            <ul className="service-build-grid">
              {m.buildItems.map((item) => (
                <li
                  key={item.title}
                  className={`service-build-card ${item.featured ? "is-featured" : ""}`}
                >
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section" aria-labelledby="when-title">
          <div className="shell">
            <header className="section-head">
              <h2 id="when-title">{m.whenTitle}</h2>
              <p className="lead">{m.whenLead}</p>
            </header>
            <ul className="service-when-grid">
              {m.whenItems.map((item) => (
                <li key={item}>
                  <span className="service-check" aria-hidden="true">
                    ✓
                  </span>
                  <p>{item}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="service-case" aria-labelledby="case-title">
          <div className="shell service-case-layout">
            <div className="service-case-visual" aria-hidden="true">
              <div className="service-case-window">
                <span>MOOVY</span>
              </div>
            </div>
            <div className="service-case-copy">
              <p className="service-case-eyebrow">{m.caseEyebrow}</p>
              <h2 id="case-title">{m.caseTitle}</h2>
              <p>{m.caseText}</p>
              <Link className="service-case-link" href={`/${locale}/start`}>
                {m.caseCta}
                <span aria-hidden="true"> →</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="included-title">
          <div className="shell">
            <header className="section-head">
              <h2 id="included-title">{m.includedTitle}</h2>
            </header>
            <ul className="service-included-grid">
              {m.included.map((group) => (
                <li key={group.title}>
                  <h3>{group.title}</h3>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item}>
                        <span className="service-check" aria-hidden="true">
                          ✓
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section section-muted" aria-labelledby="pricing-title">
          <div className="shell service-pricing">
            <header className="section-head">
              <h2 id="pricing-title">{m.pricingTitle}</h2>
            </header>
            <div className="service-pricing-card">
              <p className="service-pricing-label">{m.pricingLabel}</p>
              <p className="service-pricing-value">{m.pricingValue}</p>
              <p>{m.pricingText}</p>
            </div>
            <p className="service-pricing-note">{m.pricingNote}</p>
            <Link className="btn btn-primary" href={`/${locale}/start`}>
              {m.pricingCta}
              <span aria-hidden="true"> →</span>
            </Link>
          </div>
        </section>

        <section className="section" aria-labelledby="faq-title">
          <div className="shell service-faq">
            <header className="section-head">
              <h2 id="faq-title">{m.faqTitle}</h2>
            </header>
            <div className="service-faq-list">
              {m.faq.map((item) => (
                <details key={item.q} className="service-faq-item">
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-process" aria-labelledby="service-process-title">
          <div className="shell">
            <header className="section-head">
              <h2 id="service-process-title">{m.processTitle}</h2>
            </header>
            <ol className="service-process-grid">
              {m.process.map((step) => (
                <li key={step.n}>
                  <div className="service-process-n">
                    <span>{step.n}</span>
                    <i aria-hidden="true" />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} t={t} />
    </>
  );
}
