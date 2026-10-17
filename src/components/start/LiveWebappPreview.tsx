"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/content";
import { getWebappPreviewCopy } from "@/content/webapp-preview-i18n";
import type { getStartFormCopy } from "@/content/start-form";

type FormCopy = ReturnType<typeof getStartFormCopy>;

type Props = {
  locale: Locale;
  selected: string[];
  featureLabels: FormCopy["webappFeatures"];
};

export function LiveWebappPreview({ locale, selected, featureLabels }: Props) {
  const p = getWebappPreviewCopy(locale);
  const [tab, setTab] = useState<"preview" | "examples">("preview");
  const has = (id: string) => selected.includes(id);

  const rows = useMemo(
    () => [
      { id: "A-102", customer: "Studio Holm", status: p.statusOpen, amount: "420 €" },
      { id: "A-103", customer: "Café Nord", status: p.statusWait, amount: "180 €" },
      { id: "A-104", customer: "Werkstatt Süd", status: p.statusDone, amount: "960 €" },
    ],
    [p.statusDone, p.statusOpen, p.statusWait],
  );

  return (
    <div className="live-preview live-webapp">
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

          <div className="app-shell">
            <aside className="app-sidebar" aria-label="App navigation">
              <strong>{p.appName}</strong>
              <nav>
                <span className="is-active">{p.navOverview}</span>
                <span>{p.navOrders}</span>
                <span>{p.navCustomers}</span>
                <span>{p.navSettings}</span>
              </nav>
            </aside>

            <div className="app-main">
              <header className="app-topbar">
                <label className="app-search">
                  <span className="sr-only">{p.searchPlaceholder}</span>
                  <input type="search" placeholder={p.searchPlaceholder} />
                </label>
                <div className="app-user" aria-hidden="true">
                  <span className="app-avatar" />
                  <span>{p.userName}</span>
                </div>
              </header>

              <div className="app-content">
                {!selected.length ? (
                  <section className="app-welcome reveal-block">
                    <h3>{p.welcomeTitle}</h3>
                    <p>{p.emptyHint}</p>
                    <p className="demo-meta">{p.welcomeLead}</p>
                    <div className="app-kpi-grid muted">
                      <div>
                        <span>{p.kpiOrders}</span>
                        <strong>24</strong>
                      </div>
                      <div>
                        <span>{p.kpiOpen}</span>
                        <strong>7</strong>
                      </div>
                      <div>
                        <span>{p.kpiCustomers}</span>
                        <strong>58</strong>
                      </div>
                    </div>
                  </section>
                ) : null}

                {has("auth") ? (
                  <section className="app-panel reveal-block">
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

                {has("dashboard") ? (
                  <section className="app-panel reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.dashboardTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <div className="app-kpi-grid">
                      <div>
                        <span>{p.kpiOrders}</span>
                        <strong>128</strong>
                      </div>
                      <div>
                        <span>{p.kpiRevenue}</span>
                        <strong>12.4k €</strong>
                      </div>
                      <div>
                        <span>{p.kpiOpen}</span>
                        <strong>19</strong>
                      </div>
                      <div>
                        <span>{p.kpiCustomers}</span>
                        <strong>86</strong>
                      </div>
                    </div>
                  </section>
                ) : null}

                {has("data") ? (
                  <section className="app-panel reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.dataTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <div className="app-table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>{p.colId}</th>
                            <th>{p.colCustomer}</th>
                            <th>{p.colStatus}</th>
                            <th>{p.colAmount}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row) => (
                            <tr key={row.id}>
                              <td>{row.id}</td>
                              <td>{row.customer}</td>
                              <td>{row.status}</td>
                              <td>{row.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <form
                      className="app-inline-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                      }}
                    >
                      <input placeholder={p.dataName} aria-label={p.dataName} />
                      <input placeholder={p.dataCategory} aria-label={p.dataCategory} />
                      <button type="submit">{p.dataAdd}</button>
                    </form>
                  </section>
                ) : null}

                {has("roles") ? (
                  <section className="app-panel reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.rolesTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <p className="demo-meta">{p.rolesLead}</p>
                    <ul className="app-roles">
                      <li>
                        <strong>{p.roleAdmin}</strong>
                        <span>CRUD · Billing · Users</span>
                      </li>
                      <li>
                        <strong>{p.roleEditor}</strong>
                        <span>CRUD · No billing</span>
                      </li>
                      <li>
                        <strong>{p.roleViewer}</strong>
                        <span>Read only</span>
                      </li>
                    </ul>
                  </section>
                ) : null}

                {has("payments") ? (
                  <section className="app-panel reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.paymentsTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <p className="demo-meta">{p.paymentsLead}</p>
                    <ol className="app-pay-steps">
                      <li>{p.payStep1}</li>
                      <li>{p.payStep2}</li>
                      <li>{p.payStep3}</li>
                    </ol>
                    <p className="demo-meta">{p.payNote}</p>
                  </section>
                ) : null}

                {has("reports") ? (
                  <section className="app-panel reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.reportsTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <p className="demo-meta">{p.reportsLead}</p>
                    <div className="app-chart" aria-hidden="true">
                      {[42, 58, 36, 70, 48, 82, 64].map((h, i) => (
                        <span key={i} style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </section>
                ) : null}

                {has("api") ? (
                  <section className="app-panel reveal-block">
                    <div className="demo-section-head">
                      <h4>{p.apiTitle}</h4>
                      <span className="demo-badge">{p.demoBadge}</span>
                    </div>
                    <p className="demo-meta">{p.apiLead}</p>
                    <div className="app-api">
                      <div className="app-api-node">Werkdesk</div>
                      <div className="app-api-line" aria-hidden="true" />
                      <div className="app-api-node external">CRM / ERP / Payment</div>
                    </div>
                    <p className="demo-meta">
                      {p.apiEndpoint}: <code>/api/v1/orders</code> · {p.apiStatus}
                    </p>
                  </section>
                ) : null}

                {selected.length && !has("data") ? (
                  <section className="app-panel">
                    <h4>{p.tableTitle}</h4>
                    <div className="app-table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>{p.colId}</th>
                            <th>{p.colCustomer}</th>
                            <th>{p.colStatus}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.slice(0, 2).map((row) => (
                            <tr key={row.id}>
                              <td>{row.id}</td>
                              <td>{row.customer}</td>
                              <td>{row.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ) : null}
              </div>
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
