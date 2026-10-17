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
  const largeText = has("a11y");

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
          <div className="iphone-frame" aria-label={p.appName}>
            <div className="iphone-side-btn iphone-silent" aria-hidden="true" />
            <div className="iphone-side-btn iphone-vol-up" aria-hidden="true" />
            <div className="iphone-side-btn iphone-vol-down" aria-hidden="true" />
            <div className="iphone-side-btn iphone-power" aria-hidden="true" />

            <div className={`iphone-screen ${largeText ? "is-a11y" : ""}`}>
              <div className="iphone-status" aria-hidden="true">
                <span className="iphone-time">9:41</span>
                <span className="iphone-island" />
                <span className="iphone-status-icons">
                  <span className="iphone-signal" />
                  <span className="iphone-wifi" />
                  <span className="iphone-battery" />
                </span>
              </div>

              {has("in-app-notify") ? (
                <div className="phone-toast reveal-block" role="status">
                  <strong>{p.pushTitle}</strong>
                  <span>{p.pushBody}</span>
                  <em>{p.pushTime}</em>
                </div>
              ) : null}

              {has("offline-sync") ? (
                <div className="phone-offline-bar reveal-block">{p.offlineBadge}</div>
              ) : null}

              <header className="phone-header">
                <strong>{p.appName}</strong>
                <div className="phone-header-actions">
                  {has("multilang") ? (
                    <span className="phone-chip reveal-block">
                      {locale === "de" ? p.langDe : p.langEn}
                    </span>
                  ) : null}
                  {has("profile") || has("auth-login") ? (
                    <span className="phone-chip">{p.profileTitle}</span>
                  ) : null}
                </div>
              </header>

              <div className="phone-body">
                {!selected.length ? (
                  <section className="phone-card">
                    <h3>{p.homeTitle}</h3>
                    <p>{p.emptyHint}</p>
                    <p className="demo-meta">{p.homeLead}</p>
                  </section>
                ) : null}

                {has("auth-login") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.authTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <form className="demo-login" onSubmit={(e) => e.preventDefault()}>
                      <label>
                        <span>{p.authEmail}</span>
                        <input type="email" autoComplete="off" />
                      </label>
                      <label>
                        <span>{p.authPassword}</span>
                        <input type="password" autoComplete="off" />
                      </label>
                      <button type="submit">{p.authBtn}</button>
                      <button type="button" className="demo-btn" onClick={(e) => e.preventDefault()}>
                        {p.authSocial}
                      </button>
                    </form>
                    <p className="demo-meta">{p.authNote}</p>
                  </section>
                ) : null}

                {has("biometrics") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.bioTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <p className="demo-meta">{p.bioLead}</p>
                    <button type="button" className="demo-btn solid" onClick={(e) => e.preventDefault()}>
                      {p.bioBtn}
                    </button>
                  </section>
                ) : null}

                {has("profile") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.profileTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <div className="phone-profile">
                      <span className="app-avatar" />
                      <div>
                        <strong>{p.profileName}</strong>
                        <p className="demo-meta">{p.profileEdit}</p>
                      </div>
                    </div>
                  </section>
                ) : null}

                {has("chat") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.chatTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <div className="phone-chat">
                      <p className="bubble in">{p.chatSample}</p>
                      <p className="bubble out">{p.chatReply}</p>
                    </div>
                  </section>
                ) : null}

                {has("in-app-messages") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.messagesTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <ul className="phone-feed">
                      <li>{p.messagesItem}</li>
                    </ul>
                  </section>
                ) : null}

                {has("reviews") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.reviewsTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <p className="demo-meta">{p.reviewsSample}</p>
                  </section>
                ) : null}

                {has("search-filters") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.searchTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <input
                      className="phone-search-input"
                      placeholder={p.searchPlaceholder}
                      aria-label={p.searchPlaceholder}
                      readOnly
                    />
                    <p className="demo-meta">{p.searchResult}</p>
                  </section>
                ) : null}

                {has("favorites") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.favoritesTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <ul className="phone-feed">
                      <li>{p.favoritesItem}</li>
                    </ul>
                  </section>
                ) : null}

                {has("file-transfer") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.filesTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <ul className="phone-feed">
                      <li>{p.filesItem}</li>
                    </ul>
                    <button type="button" className="demo-btn solid" onClick={(e) => e.preventDefault()}>
                      {p.filesBtn}
                    </button>
                  </section>
                ) : null}

                {has("maps-directions") || has("live-tracking") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{has("live-tracking") ? p.trackingTitle : p.mapsTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <p className="demo-meta">{p.mapsLead}</p>
                    <div className="demo-map phone-map" aria-hidden="true">
                      <span className="demo-pin" />
                    </div>
                    {has("live-tracking") ? (
                      <p className="demo-meta">{p.trackingStatus}</p>
                    ) : null}
                  </section>
                ) : null}

                {has("qr-scan") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.qrTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <p className="demo-meta">{p.qrLead}</p>
                    <div className="phone-qr" aria-hidden="true" />
                  </section>
                ) : null}

                {has("camera-upload") ? (
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

                {has("cart-orders") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.cartTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <ul className="phone-feed">
                      <li>{p.cartItem}</li>
                    </ul>
                    <p className="demo-meta">
                      <strong>{p.cartTotal}</strong>
                    </p>
                  </section>
                ) : null}

                {has("payments") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.payTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <p className="demo-meta">{p.payLead}</p>
                    <button type="button" className="demo-btn solid" onClick={(e) => e.preventDefault()}>
                      {p.payBtn}
                    </button>
                    <p className="demo-meta">{p.payNote}</p>
                  </section>
                ) : null}

                {has("subscriptions") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.subTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <div className="phone-plan">
                      <strong>{p.subPlan}</strong>
                      <span>{p.subPrice}</span>
                    </div>
                  </section>
                ) : null}

                {has("coupons") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.couponTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <div className="demo-coupon">
                      <code>{p.couponCode}</code>
                    </div>
                  </section>
                ) : null}

                {has("order-status") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.orderTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <p className="demo-meta">{p.orderStep}</p>
                    <div className="phone-progress" aria-hidden="true">
                      <span className="is-on" />
                      <span className="is-on" />
                      <span />
                    </div>
                  </section>
                ) : null}

                {has("offline-sync") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.offlineTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <p className="demo-meta">{p.offlineLead}</p>
                  </section>
                ) : null}

                {has("external-api") ? (
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

                {has("admin-dashboard") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.adminTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <div className="app-kpi-grid">
                      <div>
                        <span>{p.adminUsers}</span>
                      </div>
                      <div>
                        <span>{p.adminOrders}</span>
                      </div>
                    </div>
                  </section>
                ) : null}

                {has("analytics") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.analyticsTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <p className="demo-meta">{p.analyticsLead}</p>
                    <div className="app-chart" aria-hidden="true">
                      {[40, 55, 35, 70, 48, 80, 60].map((h, i) => (
                        <span key={i} style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </section>
                ) : null}

                {has("device-sync") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.syncTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <p className="demo-meta">{p.syncLead}</p>
                  </section>
                ) : null}

                {has("a11y") ? (
                  <section className="phone-card reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.a11yTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <p className="demo-meta">{p.a11yLead}</p>
                    <p>
                      <strong>{p.a11yLarge}</strong>
                    </p>
                  </section>
                ) : null}
              </div>

              <nav className="phone-tabs" aria-label="App tabs">
                <span className="is-active">{p.tabHome}</span>
                <span>{p.tabExplore}</span>
                <span>{p.tabProfile}</span>
              </nav>

              <div className="iphone-home-indicator" aria-hidden="true" />
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
