"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/content";
import { site } from "@/content";
import {
  CONTACT_METHODS,
  GOALS,
  HOSTING_FEATURES,
  MOBILE_FEATURES,
  PROJECT_TYPES,
  TIMELINES,
  WEBSITE_FEATURES,
  WEBAPP_FEATURES,
  getStartFormCopy,
  showsHostingFeatures,
  showsMobileFeatures,
  showsWebappFeatures,
  showsWebsiteFeatures,
  type GoalId,
  type SizeHint,
  type TimelineId,
} from "@/content/start-form";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { Logo } from "@/components/Logo";
import { LiveSitePreview } from "./LiveSitePreview";
import {
  clearFormState,
  initialFormState,
  isValidEmail,
  loadFormState,
  saveFormState,
  toggleInList,
  type FormState,
} from "./formState";
import { getPreviewCopy } from "@/content/preview-i18n";

const TOTAL_STEPS = 5;

type Props = {
  locale: Locale;
};

export function StartProjectForm({ locale }: Props) {
  const t = getStartFormCopy(locale);
  const [step, setStep] = useState(1);
  const [state, setState] = useState<FormState>(initialFormState);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [mobilePane, setMobilePane] = useState<"options" | "preview">("options");
  const previewCopy = getPreviewCopy(locale);
  const showLivePreview = showsWebsiteFeatures(state.projectTypes);

  useEffect(() => {
    setState(loadFormState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || submitted) return;
    saveFormState(state);
  }, [state, hydrated, submitted]);

  const percent = Math.round((step / TOTAL_STEPS) * 100);

  const sizeLabel = (size: SizeHint) => {
    if (size === "basic") return t.sizeBasic;
    if (size === "medium") return t.sizeMedium;
    return t.sizeCustom;
  };

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "projectTypes") {
        const types = value as FormState["projectTypes"];
        if (!showsWebsiteFeatures(types)) next.websiteFeatures = [];
        if (!showsWebappFeatures(types)) next.webappFeatures = [];
        if (!showsMobileFeatures(types)) next.mobileFeatures = [];
        if (!showsHostingFeatures(types)) next.hostingFeatures = [];
        if (!types.includes("other")) next.otherProjectNote = "";
      }
      if (key === "goals") {
        const goals = value as FormState["goals"];
        if (!goals.includes("other")) next.otherGoalNote = "";
      }
      return next;
    });
    setError("");
  }

  function validateStep(current: number): string {
    if (current === 1 && state.projectTypes.length === 0) return t.errors.projectTypes;
    if (current === 3 && !state.timeline) return t.errors.timeline;
    if (current === 5) {
      if (!state.name.trim()) return t.errors.name;
      if (!state.email.trim()) return t.errors.email;
      if (!isValidEmail(state.email)) return t.errors.emailInvalid;
      if (!state.contactMethod) return t.errors.contactMethod;
      if (!state.privacy) return t.errors.privacy;
    }
    return "";
  }

  function goNext() {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function goBack() {
    setError("");
    setStep((s) => Math.max(1, s - 1));
  }

  function buildMailBody() {
    const lines: string[] = [
      `tool2day project enquiry (${locale})`,
      "",
      `== ${t.summary.types} ==`,
      ...state.projectTypes.map((id) => `- ${t.projectTypes[id]}`),
      state.otherProjectNote ? `Note: ${state.otherProjectNote}` : "",
      "",
      `== ${t.summary.goals} ==`,
      ...(state.goals.length
        ? state.goals.map((id) => `- ${t.goals[id].label}`)
        : [`- ${t.summary.none}`]),
      state.otherGoalNote ? `Note: ${state.otherGoalNote}` : "",
      "",
      `== ${t.summary.features} ==`,
    ];

    const pushFeatures = (
      title: string,
      ids: string[],
      labels: Record<string, { label: string }>,
    ) => {
      if (!ids.length) return;
      lines.push(title);
      ids.forEach((id) => lines.push(`- ${labels[id]?.label ?? id}`));
    };

    pushFeatures(t.steps[2].websiteTitle, state.websiteFeatures, t.websiteFeatures);
    pushFeatures(t.steps[2].webappTitle, state.webappFeatures, t.webappFeatures);
    pushFeatures(t.steps[2].mobileTitle, state.mobileFeatures, t.mobileFeatures);
    pushFeatures(t.steps[2].hostingTitle, state.hostingFeatures, t.hostingFeatures);
    if (
      !state.websiteFeatures.length &&
      !state.webappFeatures.length &&
      !state.mobileFeatures.length &&
      !state.hostingFeatures.length
    ) {
      lines.push(`- ${t.summary.none}`);
    }

    lines.push(
      "",
      `== ${t.summary.timeline} ==`,
      state.timeline ? t.timelines[state.timeline] : t.summary.none,
      "",
      `== ${t.summary.details} ==`,
      state.details.trim() || t.summary.none,
      "",
      `== ${t.summary.contact} ==`,
      `Name: ${state.name}`,
      `Email: ${state.email}`,
      `Phone: ${state.phone || t.summary.none}`,
      `Company: ${state.company || t.summary.none}`,
      `Preferred: ${state.contactMethod ? t.contactMethods[state.contactMethod] : t.summary.none}`,
    );

    return lines.filter((line, i, arr) => !(line === "" && arr[i - 1] === "")).join("\n");
  }

  function onSubmit() {
    const message = validateStep(5);
    if (message) {
      setError(message);
      return;
    }

    const subject = encodeURIComponent(
      `tool2day — ${locale === "de" ? "Projektanfrage" : "Project enquiry"} — ${state.name}`,
    );
    const body = encodeURIComponent(buildMailBody());
    window.location.href = `mailto:${site.contactEmail}?subject=${subject}&body=${body}`;
    clearFormState();
    setSubmitted(true);
  }

  const summaryBits = useMemo(() => {
    return {
      types: state.projectTypes.map((id) => t.projectTypes[id]),
      goals: state.goals.map((id) => t.goals[id].label),
      features: [
        ...state.websiteFeatures.map((id) => t.websiteFeatures[id]?.label),
        ...state.webappFeatures.map((id) => t.webappFeatures[id]?.label),
        ...state.mobileFeatures.map((id) => t.mobileFeatures[id]?.label),
        ...state.hostingFeatures.map((id) => t.hostingFeatures[id]?.label),
      ].filter(Boolean) as string[],
      timeline: state.timeline ? t.timelines[state.timeline] : "",
    };
  }, [state, t]);

  if (submitted) {
    return (
      <div className="start-shell">
        <StartTop locale={locale} t={t} />
        <div className="start-card success-card">
          <h1>{t.successTitle}</h1>
          <p>{t.successBody}</p>
          <div className="start-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setState(initialFormState);
                setStep(1);
                setSubmitted(false);
                setError("");
              }}
            >
              {t.successAgain}
            </button>
            <Link className="btn btn-ghost" href={`/${locale}`}>
              {t.backHome}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`start-shell ${step === 2 && showLivePreview ? "is-wide" : ""}`}>
      <StartTop locale={locale} t={t} />

      <header className="start-hero">
        <h1>{t.pageTitle}</h1>
        <p>{t.pageLead}</p>
      </header>

      <div className="start-progress" aria-hidden="true">
        <div className="start-progress-meta">
          <span>
            {t.stepOf
              .replace("{current}", String(step))
              .replace("{total}", String(TOTAL_STEPS))}
          </span>
          <span>{t.progress.replace("{percent}", String(percent))}</span>
        </div>
        <div
          className="start-progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <span style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="start-card">
        {step === 1 ? (
          <section aria-labelledby="step1-title">
            <p className="start-kicker">{t.steps[1].title}</p>
            <h2 id="step1-title">{t.steps[1].question}</h2>
            <p className="start-hint">{t.multiSelectHint}</p>
            <div className="option-grid" role="group" aria-label={t.steps[1].question}>
              {PROJECT_TYPES.map((id) => (
                <OptionCard
                  key={id}
                  selected={state.projectTypes.includes(id)}
                  label={t.projectTypes[id]}
                  onToggle={() =>
                    update("projectTypes", toggleInList(state.projectTypes, id))
                  }
                />
              ))}
            </div>
            {state.projectTypes.includes("other") ? (
              <label className="start-field">
                <span>{t.otherOptional}</span>
                <textarea
                  rows={3}
                  value={state.otherProjectNote}
                  onChange={(e) => update("otherProjectNote", e.target.value)}
                />
              </label>
            ) : null}
          </section>
        ) : null}

        {step === 2 ? (
          <section aria-labelledby="step2-title" className="step2-section">
            <p className="start-kicker">{t.steps[2].title}</p>
            <h2 id="step2-title">{t.steps[2].goalsTitle}</h2>
            <p className="start-hint">{t.multiSelectHint}</p>
            <div className="option-grid">
              {GOALS.map((id) => (
                <OptionCard
                  key={id}
                  selected={state.goals.includes(id)}
                  label={t.goals[id].label}
                  onToggle={() => update("goals", toggleInList(state.goals, id as GoalId))}
                />
              ))}
            </div>
            {state.goals.includes("other") ? (
              <label className="start-field">
                <span>{t.otherOptional}</span>
                <textarea
                  rows={3}
                  value={state.otherGoalNote}
                  onChange={(e) => update("otherGoalNote", e.target.value)}
                />
              </label>
            ) : null}

            <p className="start-note">{t.unsureNote}</p>
            <p className="start-note muted">{t.sizeNote}</p>

            {showLivePreview ? (
              <>
                <div className="step2-mobile-toggle" role="tablist" aria-label="Step 2 view">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mobilePane === "options"}
                    className={mobilePane === "options" ? "is-active" : undefined}
                    onClick={() => setMobilePane("options")}
                  >
                    {previewCopy.mobileOptions}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mobilePane === "preview"}
                    className={mobilePane === "preview" ? "is-active" : undefined}
                    onClick={() => setMobilePane("preview")}
                  >
                    {previewCopy.mobilePreview}
                  </button>
                </div>

                <div className="step2-split">
                  <div
                    className={`step2-options ${mobilePane === "options" ? "is-mobile-active" : ""}`}
                  >
                    <FeatureGroup
                      title={t.steps[2].websiteTitle}
                      features={WEBSITE_FEATURES}
                      labels={t.websiteFeatures}
                      selected={state.websiteFeatures}
                      sizeLabel={sizeLabel}
                      viewExampleLabel={previewCopy.viewExample}
                      demoOnlyLabel={previewCopy.demoOnly}
                      demoBadge={previewCopy.demoBadge}
                      onToggle={(id) =>
                        update("websiteFeatures", toggleInList(state.websiteFeatures, id))
                      }
                    />
                  </div>
                  <aside
                    className={`step2-preview ${mobilePane === "preview" ? "is-mobile-active" : ""}`}
                    aria-label={previewCopy.tabPreview}
                  >
                    <LiveSitePreview
                      locale={locale}
                      selected={state.websiteFeatures}
                      featureLabels={t.websiteFeatures}
                    />
                  </aside>
                </div>
              </>
            ) : null}

            {showsWebappFeatures(state.projectTypes) ? (
              <FeatureGroup
                title={t.steps[2].webappTitle}
                features={WEBAPP_FEATURES}
                labels={t.webappFeatures}
                selected={state.webappFeatures}
                sizeLabel={sizeLabel}
                onToggle={(id) =>
                  update("webappFeatures", toggleInList(state.webappFeatures, id))
                }
              />
            ) : null}

            {showsMobileFeatures(state.projectTypes) ? (
              <FeatureGroup
                title={t.steps[2].mobileTitle}
                features={MOBILE_FEATURES}
                labels={t.mobileFeatures}
                selected={state.mobileFeatures}
                sizeLabel={sizeLabel}
                onToggle={(id) =>
                  update("mobileFeatures", toggleInList(state.mobileFeatures, id))
                }
              />
            ) : null}

            {showsHostingFeatures(state.projectTypes) ? (
              <FeatureGroup
                title={t.steps[2].hostingTitle}
                features={HOSTING_FEATURES}
                labels={t.hostingFeatures}
                selected={state.hostingFeatures}
                sizeLabel={sizeLabel}
                onToggle={(id) =>
                  update("hostingFeatures", toggleInList(state.hostingFeatures, id))
                }
              />
            ) : null}
          </section>
        ) : null}

        {step === 3 ? (
          <section aria-labelledby="step3-title">
            <p className="start-kicker">{t.steps[3].title}</p>
            <h2 id="step3-title">{t.steps[3].question}</h2>
            <div className="option-grid single" role="radiogroup" aria-label={t.steps[3].question}>
              {TIMELINES.map((id) => (
                <OptionCard
                  key={id}
                  selected={state.timeline === id}
                  label={t.timelines[id]}
                  radio
                  onToggle={() => update("timeline", id as TimelineId)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section aria-labelledby="step4-title">
            <p className="start-kicker">{t.steps[4].title}</p>
            <h2 id="step4-title">{t.steps[4].question}</h2>
            <p className="start-hint">{t.steps[4].hint}</p>
            <label className="start-field">
              <span className="sr-only">{t.steps[4].question}</span>
              <textarea
                rows={8}
                placeholder={t.steps[4].placeholder}
                value={state.details}
                onChange={(e) => update("details", e.target.value)}
              />
            </label>
          </section>
        ) : null}

        {step === 5 ? (
          <section aria-labelledby="step5-title">
            <p className="start-kicker">{t.steps[5].title}</p>
            <h2 id="step5-title">{t.steps[5].title}</h2>

            <div className="start-fields">
              <label className="start-field">
                <span>
                  {t.steps[5].name} <abbr title="required">*</abbr>
                </span>
                <input
                  type="text"
                  autoComplete="name"
                  required
                  value={state.name}
                  onChange={(e) => update("name", e.target.value)}
                />
              </label>
              <label className="start-field">
                <span>
                  {t.steps[5].email} <abbr title="required">*</abbr>
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={state.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </label>
              <label className="start-field">
                <span>{t.steps[5].phone}</span>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={state.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </label>
              <label className="start-field">
                <span>{t.steps[5].company}</span>
                <input
                  type="text"
                  autoComplete="organization"
                  value={state.company}
                  onChange={(e) => update("company", e.target.value)}
                />
              </label>
            </div>

            <fieldset className="start-fieldset">
              <legend>
                {t.steps[5].contactMethod} <abbr title="required">*</abbr>
              </legend>
              <div className="option-grid single">
                {CONTACT_METHODS.map((id) => (
                  <OptionCard
                    key={id}
                    selected={state.contactMethod === id}
                    label={t.contactMethods[id]}
                    radio
                    onToggle={() => update("contactMethod", id)}
                  />
                ))}
              </div>
            </fieldset>

            <label className="privacy-check">
              <input
                type="checkbox"
                checked={state.privacy}
                onChange={(e) => update("privacy", e.target.checked)}
              />
              <span>
                {t.steps[5].privacyBefore}
                <Link href={site.legal.privacy} target="_blank" rel="noopener noreferrer">
                  {t.steps[5].privacyLink}
                </Link>
                {t.steps[5].privacyAfter}
              </span>
            </label>

            <div className="summary-box">
              <h3>{t.summaryTitle}</h3>
              <SummaryRow label={t.summary.types} values={summaryBits.types} empty={t.summary.none} />
              <SummaryRow label={t.summary.goals} values={summaryBits.goals} empty={t.summary.none} />
              <SummaryRow
                label={t.summary.features}
                values={summaryBits.features}
                empty={t.summary.none}
              />
              <p>
                <strong>{t.summary.timeline}:</strong>{" "}
                {summaryBits.timeline || t.summary.none}
              </p>
              {state.details.trim() ? (
                <p>
                  <strong>{t.summary.details}:</strong> {state.details.trim()}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        {error ? (
          <p className="start-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="start-actions">
          {step > 1 ? (
            <button type="button" className="btn btn-ghost" onClick={goBack}>
              {t.back}
            </button>
          ) : (
            <span />
          )}
          {step < TOTAL_STEPS ? (
            <button type="button" className="btn btn-primary" onClick={goNext}>
              {t.continue}
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={onSubmit}>
              {t.submit}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StartTop({
  locale,
  t,
}: {
  locale: Locale;
  t: ReturnType<typeof getStartFormCopy>;
}) {
  return (
    <div className="start-top">
      <Logo locale={locale} />
      <div className="start-top-actions">
        <LanguageSwitch
          locale={locale}
          pathSuffix="/start"
          ariaLabel={locale === "de" ? "Sprache wählen" : "Choose language"}
        />
        <Link className="start-home-link" href={`/${locale}`}>
          {t.backHome}
        </Link>
      </div>
    </div>
  );
}

function OptionCard({
  label,
  selected,
  onToggle,
  radio = false,
  desc,
  badge,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  radio?: boolean;
  desc?: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      className={`option-card ${selected ? "is-selected" : ""}`}
      onClick={onToggle}
      aria-pressed={radio ? undefined : selected}
      aria-checked={radio ? selected : undefined}
      role={radio ? "radio" : undefined}
    >
      <span className="option-check" aria-hidden="true" />
      <span className="option-body">
        <span className="option-label">{label}</span>
        {desc ? <span className="option-desc">{desc}</span> : null}
        {badge ? <span className="option-badge">{badge}</span> : null}
      </span>
    </button>
  );
}

function FeatureGroup({
  title,
  features,
  labels,
  selected,
  onToggle,
  sizeLabel,
  viewExampleLabel,
  demoOnlyLabel,
  demoBadge,
}: {
  title: string;
  features: { id: string; size: SizeHint }[];
  labels: Record<string, { label: string; desc: string }>;
  selected: string[];
  onToggle: (id: string) => void;
  sizeLabel: (size: SizeHint) => string;
  viewExampleLabel?: string;
  demoOnlyLabel?: string;
  demoBadge?: string;
}) {
  return (
    <div className="feature-group">
      <h3>{title}</h3>
      <div className="option-grid features">
        {features.map((feature) => {
          const isOn = selected.includes(feature.id);
          return (
            <div key={feature.id} className="feature-item">
              <OptionCard
                selected={isOn}
                label={labels[feature.id].label}
                desc={labels[feature.id].desc}
                badge={sizeLabel(feature.size)}
                onToggle={() => onToggle(feature.id)}
              />
              {isOn && viewExampleLabel && demoOnlyLabel ? (
                <details className="feature-example">
                  <summary>{viewExampleLabel}</summary>
                  <p>
                    {demoBadge ? <span className="option-badge">{demoBadge}</span> : null}{" "}
                    {demoOnlyLabel}
                  </p>
                </details>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  values,
  empty,
}: {
  label: string;
  values: string[];
  empty: string;
}) {
  return (
    <p>
      <strong>{label}:</strong> {values.length ? values.join(", ") : empty}
    </p>
  );
}
