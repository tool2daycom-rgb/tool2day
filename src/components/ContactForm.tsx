"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Dictionary, Locale } from "@/content";
import { site } from "@/content";

type Props = {
  locale: Locale;
  t: Dictionary["contact"];
};

export function ContactForm({ locale, t }: Props) {
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const [startedAt, setStartedAt] = useState(0);

  useEffect(() => {
    setStartedAt(Date.now());
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("pending");
    setError("");

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contact",
          locale,
          name: String(data.get("name") || "").trim(),
          email: String(data.get("email") || "").trim(),
          service: String(data.get("service") || "").trim(),
          message: String(data.get("message") || "").trim(),
          privacy: data.get("privacy") === "on",
          website: String(data.get("website") || ""),
          formStartedAt: startedAt || Date.now(),
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!res.ok || !json.ok) {
        setStatus("error");
        setError(json.message || t.errorMessage);
        return;
      }

      form.reset();
      setStartedAt(Date.now());
      setStatus("success");
    } catch {
      setStatus("error");
      setError(t.errorMessage);
    }
  }

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate={false}>
      <div className="field honeypot" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <div className="field">
        <label htmlFor="name">{t.fields.name}</label>
        <input id="name" name="name" type="text" autoComplete="name" required />
      </div>
      <div className="field">
        <label htmlFor="email">{t.fields.email}</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="service">{t.fields.service}</label>
        <select id="service" name="service" required defaultValue="">
          <option value="" disabled>
            —
          </option>
          {t.fields.serviceOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="message">{t.fields.message}</label>
        <textarea id="message" name="message" rows={5} required />
      </div>
      <label className="contact-privacy">
        <input type="checkbox" name="privacy" required />
        <span>
          {t.privacyBefore}
          <a href={site.legal.privacy} target="_blank" rel="noopener noreferrer">
            {t.privacyLink}
          </a>
          {t.privacyAfter}
        </span>
      </label>
      <p className="form-note">{t.note}</p>
      <button
        type="submit"
        className="btn btn-primary btn-wide"
        disabled={status === "pending"}
      >
        {status === "pending" ? t.submitting : t.submit}
      </button>
      {status === "success" ? (
        <p className="form-status is-success" role="status">
          {t.successMessage}
        </p>
      ) : null}
      {status === "error" ? (
        <p className="form-status is-error" role="alert">
          {error || t.errorMessage}
        </p>
      ) : null}
    </form>
  );
}
