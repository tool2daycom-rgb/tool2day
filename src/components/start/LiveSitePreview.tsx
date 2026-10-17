"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/content";
import { getPreviewCopy } from "@/content/preview-i18n";
import type { getStartFormCopy } from "@/content/start-form";

type FormCopy = ReturnType<typeof getStartFormCopy>;

type Props = {
  locale: Locale;
  selected: string[];
  featureLabels: FormCopy["websiteFeatures"];
};

export function LiveSitePreview({ locale, selected, featureLabels }: Props) {
  const p = getPreviewCopy(locale);
  const [tab, setTab] = useState<"preview" | "examples">("preview");
  const [galleryFilter, setGalleryFilter] = useState<"all" | "interior" | "outdoor">("all");
  const [hours, setHours] = useState(4);
  const [slot, setSlot] = useState("10:00");
  const [previewLang, setPreviewLang] = useState<"de" | "en">(locale);

  const has = (id: string) => selected.includes(id);
  const ordered = useMemo(
    () =>
      [
        "gallery",
        "map",
        "downloads",
        "blog",
        "newsletter",
        "cms",
        "tool",
        "booking",
        "coupons",
        "client-login",
      ].filter((id) => selected.includes(id)),
    [selected],
  );

  return (
    <div className="live-preview">
      <div className="live-tabs" role="tablist" aria-label={p.tabPreview}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "preview"}
          className={tab === "preview" ? "is-active" : undefined}
          onClick={() => setTab("preview")}
        >
          {p.tabPreview}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "examples"}
          className={tab === "examples" ? "is-active" : undefined}
          onClick={() => setTab("examples")}
        >
          {p.tabExamples}
        </button>
      </div>

      {tab === "preview" ? (
        <div className="live-frame" role="tabpanel">
          <div className="live-chrome" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="live-site">
            <header className="demo-nav">
              <strong>{p.siteName}</strong>
              <nav>
                <span>{p.navHome}</span>
                <span>{p.navServices}</span>
                <span>{p.navContact}</span>
                {has("multilingual") ? (
                  <span className="demo-lang reveal-block" aria-label="Language">
                    <button
                      type="button"
                      className={previewLang === "de" ? "is-active" : undefined}
                      onClick={() => setPreviewLang("de")}
                    >
                      {p.langDe}
                    </button>
                    <button
                      type="button"
                      className={previewLang === "en" ? "is-active" : undefined}
                      onClick={() => setPreviewLang("en")}
                    >
                      {p.langEn}
                    </button>
                  </span>
                ) : null}
              </nav>
            </header>

            {has("cms") ? (
              <p className="demo-cms reveal-block">{p.cmsBanner}</p>
            ) : null}

            <section className="demo-hero">
              <h3>{p.heroTitle}</h3>
              <p>{p.heroLead}</p>
              <span className="demo-btn">{p.heroCta}</span>
            </section>

            {!selected.length ? (
              <p className="demo-empty">{p.emptyHint}</p>
            ) : null}

            <section className="demo-services">
              <h4>{p.servicesTitle}</h4>
              <ul>
                <li>{p.servicesItem1}</li>
                <li>{p.servicesItem2}</li>
                <li>{p.servicesItem3}</li>
              </ul>
            </section>

            {has("gallery") ? (
              <section className="demo-section reveal-block">
                <div className="demo-section-head">
                  <h4>{p.galleryTitle}</h4>
                  <span className="demo-badge">{p.demoBadge}</span>
                </div>
                <div className="demo-filters">
                  {(
                    [
                      ["all", p.galleryAll],
                      ["interior", p.galleryInterior],
                      ["outdoor", p.galleryOutdoor],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={galleryFilter === id ? "is-active" : undefined}
                      onClick={() => setGalleryFilter(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="demo-gallery">
                  {[1, 2, 3, 4, 5, 6]
                    .filter((n) => {
                      if (galleryFilter === "all") return true;
                      if (galleryFilter === "interior") return n % 2 === 1;
                      return n % 2 === 0;
                    })
                    .map((n) => (
                      <div key={n} className={`demo-thumb tone-${n}`} />
                    ))}
                </div>
              </section>
            ) : null}

            {has("map") ? (
              <section className="demo-section reveal-block">
                <div className="demo-section-head">
                  <h4>{p.mapTitle}</h4>
                  <span className="demo-badge">{p.demoBadge}</span>
                </div>
                <div className="demo-map" aria-hidden="true">
                  <span className="demo-pin" />
                </div>
                <p className="demo-meta">{p.mapAddress}</p>
                <p className="demo-meta">{p.mapHours}</p>
              </section>
            ) : null}

            {has("downloads") ? (
              <section className="demo-section reveal-block">
                <div className="demo-section-head">
                  <h4>{p.downloadsTitle}</h4>
                  <span className="demo-badge">{p.demoBadge}</span>
                </div>
                <ul className="demo-files">
                  {[p.downloadPdf, p.downloadPrice, p.downloadGuide].map((file) => (
                    <li key={file}>
                      <span>{file}</span>
                      <button type="button" className="demo-mini-btn" onClick={(e) => e.preventDefault()}>
                        {p.downloadBtn}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {has("blog") ? (
              <section className="demo-section reveal-block">
                <div className="demo-section-head">
                  <h4>{p.blogTitle}</h4>
                  <span className="demo-badge">{p.demoBadge}</span>
                </div>
                <div className="demo-blog">
                  {[
                    [p.blog1, p.blog1Meta],
                    [p.blog2, p.blog2Meta],
                    [p.blog3, p.blog3Meta],
                  ].map(([title, meta]) => (
                    <article key={title}>
                      <h5>{title}</h5>
                      <p>{meta}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {has("newsletter") ? (
              <section className="demo-section reveal-block">
                <div className="demo-section-head">
                  <h4>{p.newsletterTitle}</h4>
                  <span className="demo-badge">{p.demoBadge}</span>
                </div>
                <p className="demo-meta">{p.newsletterLead}</p>
                <form
                  className="demo-newsletter"
                  onSubmit={(e) => {
                    e.preventDefault();
                  }}
                >
                  <input type="email" placeholder={p.newsletterPlaceholder} aria-label={p.newsletterPlaceholder} />
                  <button type="submit">{p.newsletterBtn}</button>
                </form>
              </section>
            ) : null}

            {has("tool") ? (
              <section className="demo-section reveal-block">
                <div className="demo-section-head">
                  <h4>{p.toolTitle}</h4>
                  <span className="demo-badge">{p.demoBadge}</span>
                </div>
                <p className="demo-meta">{p.toolLead}</p>
                <label className="demo-tool">
                  <span>{p.toolLabel}</span>
                  <input
                    type="range"
                    min={1}
                    max={12}
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                  />
                </label>
                <p className="demo-result">
                  {p.toolResult}: <strong>{hours * 45} €</strong>
                </p>
              </section>
            ) : null}

            {has("booking") ? (
              <section className="demo-section reveal-block">
                <div className="demo-section-head">
                  <h4>{p.bookingTitle}</h4>
                  <span className="demo-badge">{p.demoBadge}</span>
                </div>
                <p className="demo-meta">{p.bookingLead}</p>
                <label className="demo-tool">
                  <span>{p.bookingPick}</span>
                  <select value={slot} onChange={(e) => setSlot(e.target.value)}>
                    {["09:00", "10:00", "11:30", "14:00", "16:00"].map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" className="demo-btn solid" onClick={(e) => e.preventDefault()}>
                  {p.bookingConfirm}
                </button>
                <p className="demo-meta">{p.bookingNote}</p>
              </section>
            ) : null}

            {has("coupons") ? (
              <section className="demo-section reveal-block">
                <div className="demo-section-head">
                  <h4>{p.couponTitle}</h4>
                  <span className="demo-badge">{p.demoBadge}</span>
                </div>
                <div className="demo-coupon">
                  <code>{p.couponCode}</code>
                  <p>{p.couponLead}</p>
                </div>
              </section>
            ) : null}

            {has("client-login") ? (
              <section className="demo-section reveal-block">
                <div className="demo-section-head">
                  <h4>{p.loginTitle}</h4>
                  <span className="demo-badge">{p.demoBadge}</span>
                </div>
                <form
                  className="demo-login"
                  onSubmit={(e) => {
                    e.preventDefault();
                  }}
                >
                  <label>
                    <span>{p.loginEmail}</span>
                    <input type="email" autoComplete="off" />
                  </label>
                  <label>
                    <span>{p.loginPassword}</span>
                    <input type="password" autoComplete="off" />
                  </label>
                  <button type="submit">{p.loginBtn}</button>
                </form>
                <p className="demo-meta">{p.loginNote}</p>
              </section>
            ) : null}

            <section className="demo-contact">
              <h4>{p.contactTitle}</h4>
              <p>{p.contactLead}</p>
            </section>
          </div>
        </div>
      ) : (
        <div className="live-examples" role="tabpanel">
          <p className="live-examples-lead">{p.examplesLead}</p>
          {!ordered.length ? (
            <p className="demo-empty">{p.examplesEmpty}</p>
          ) : (
            <ul className="live-example-list">
              {ordered.map((id) => (
                <li key={id}>
                  <div>
                    <strong>{featureLabels[id]?.label ?? id}</strong>
                    <p>{p.exampleBlurb[id]}</p>
                  </div>
                  <details>
                    <summary>{p.viewExample}</summary>
                    <p className="demo-meta">
                      <span className="demo-badge">{p.demoBadge}</span> {p.demoOnly}
                    </p>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
