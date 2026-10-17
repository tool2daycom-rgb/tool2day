"use client";

import { FormEvent, useState } from "react";
import type { Dictionary } from "@/content";
import { site } from "@/content";

type Props = {
  t: Dictionary["contact"];
};

export function ContactForm({ t }: Props) {
  const [status, setStatus] = useState<"idle" | "ready">("idle");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const service = String(data.get("service") || "").trim();
    const message = String(data.get("message") || "").trim();

    const subject = encodeURIComponent(`tool2day — ${service || "Enquiry"}`);
    const body = encodeURIComponent(
      [
        `Name: ${name}`,
        `Email: ${email}`,
        `Service: ${service}`,
        "",
        message,
      ].join("\n"),
    );

    window.location.href = `mailto:${site.contactEmail}?subject=${subject}&body=${body}`;
    setStatus("ready");
  }

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate={false}>
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
      <p className="form-note">{t.note}</p>
      <button type="submit" className="btn btn-primary btn-wide">
        {t.submit}
      </button>
      {status === "ready" ? (
        <p className="form-status" role="status">
          mailto:{site.contactEmail}
        </p>
      ) : null}
    </form>
  );
}
