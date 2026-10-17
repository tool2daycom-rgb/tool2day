"use client";

import { useState } from "react";
import type { Locale } from "@/content";
import { getMobilePreviewCopy } from "@/content/mobile-preview-i18n";
import type { getStartFormCopy } from "@/content/start-form";

type FormCopy = ReturnType<typeof getStartFormCopy>;

type Props = {
  locale: Locale;
  selected: string[];
  featureLabels: FormCopy["mobileFeatures"];
};

export function LiveMobilePreview({ locale, selected, featureLabels }: Props) {
  const p = getMobilePreviewCopy(locale);
  const [tab, setTab] = useState<"preview" | "examples">("preview");
  const has = (id: string) => selected.includes(id);

  return (
    <div className="live-preview live-mobile">
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
        <div className="live-frame mobile-frame-wrap" role="tabpanel">
          <div className="phone-bezel" aria-label={p.appName}>
            <div className="phone-notch" aria-hidden="true" />
            <div className="phone-screen">
              {has("push") ? (
                <div className="phone-toast reveal-block" role="status">
                  <strong>{p.pushTitle}</strong>
                  <span>{p.pushBody}</span>
                  <em>{p.pushTime}</em>
                </div>
              ) : null}

              {has("offline") ? (
                <div className="phone-offline-bar reveal-block">{p.offlineBadge}</div>
              ) : null}

              <header className="phone-header">
                <strong>{p.appName}</strong>
                {has("auth") ? <span className="phone-chip">{p.profileTitle}</span> : null}
              </header>

              <div className="phone-body">
                {!selected.length ? (
                  <section className="phone-card">
                    <h3>{p.homeTitle}</h3>
                    <p>{p.emptyHint}</p>
                    <p className="demo-meta">{p.homeLead}</p>
                  </section>
                ) : null}

                {has("auth") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.authTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <form
                      className="demo-login"
                      onSubmit={(e) => {
                        e.preventDefault();
                      }}
                    >
                      <label>
                        <span>{p.authEmail}</span>
                        <input type="email" autoComplete="off" />
                      </label>
                      <label>
                        <span>{p.authPassword}</span>
                        <input type="password" autoComplete="off" />
                      </label>
                      <button type="submit">{p.authBtn}</button>
                    </form>
                    <p className="demo-meta">{p.authNote}</p>
                  </section>
                ) : null}

                {has("camera") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.cameraTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <p className="demo-meta">{p.cameraLead}</p>
                    <div className="phone-camera" aria-hidden="true">
                      <span className="phone-lens" />
                    </div>
                    <button type="button" className="demo-btn solid" onClick={(e) => e.preventDefault()}>
                      {p.cameraBtn}
                    </button>
                    <p className="demo-meta">{p.cameraNote}</p>
                  </section>
                ) : null}

                {has("location") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.locationTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <p className="demo-meta">{p.locationLead}</p>
                    <div className="demo-map phone-map" aria-hidden="true">
                      <span className="demo-pin" />
                    </div>
                    <p className="demo-meta">{p.locationStatus}</p>
                  </section>
                ) : null}

                {has("offline") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.offlineTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <p className="demo-meta">{p.offlineLead}</p>
                  </section>
                ) : null}

                {has("iap") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.payTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <p className="demo-meta">{p.payLead}</p>
                    <div className="phone-plan">
                      <strong>{p.payPlan}</strong>
                      <span>{p.payPrice}</span>
                    </div>
                    <button type="button" className="demo-btn solid" onClick={(e) => e.preventDefault()}>
                      {p.payBtn}
                    </button>
                    <p className="demo-meta">{p.payNote}</p>
                  </section>
                ) : null}

                {has("api") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.apiTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <p className="demo-meta">{p.apiLead}</p>
                    <ul className="phone-feed">
                      <li>{p.apiItem1}</li>
                      <li>{p.apiItem2}</li>
                      <li>{p.apiItem3}</li>
                    </ul>
                  </section>
                ) : null}

                {has("stores") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.storesTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <p className="demo-meta">{p.storesLead}</p>
                    <div className="phone-stores">
                      <span>{p.storeApple}</span>
                      <span>{p.storeGoogle}</span>
                    </div>
                    <p className="demo-meta">{p.storesNote}</p>
                  </section>
                ) : null}

                {selected.length && !has("auth") && !has("api") ? (
                  <section className="phone-card">
                    <h4>{p.homeTitle}</h4>
                    <p className="demo-meta">{p.homeLead}</p>
                  </section>
                ) : null}
              </div>

              <nav className="phone-tabs" aria-label="App tabs">
                <span className="is-active">{p.tabHome}</span>
                <span>{p.tabExplore}</span>
                <span>{p.tabProfile}</span>
              </nav>
            </div>
          </div>
        </div>
      ) : (
        <div className="live-examples" role="tabpanel">
          <p className="live-examples-lead">{p.examplesLead}</p>
          <ul className="live-example-list">
            {p.examples.map((example) => (
              <li key={example.id}>
                <div>
                  <strong>{example.title}</strong>
                  <p>{example.audience}</p>
                  <p>{example.problem}</p>
                </div>
                <details>
                  <summary>{p.viewExample}</summary>
                  {example.href ? (
                    <p className="demo-meta">
                      <a href={example.href} target="_blank" rel="noopener noreferrer">
                        {example.href}
                      </a>
                      <br />
                      {p.externalNote}
                    </p>
                  ) : (
                    <p className="demo-meta">
                      <span className="demo-badge">{p.demoBadge}</span> {p.demoOnly}
                    </p>
                  )}
                </details>
              </li>
            ))}
          </ul>
          {selected.length ? (
            <ul className="live-example-list selected-features">
              {selected.map((id) => (
                <li key={id}>
                  <strong>{featureLabels[id]?.label ?? id}</strong>
                  <p>{featureLabels[id]?.desc}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="demo-empty">{p.examplesEmpty}</p>
          )}
        </div>
      )}
    </div>
  );
}
