"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  sendReplyAction,
  type SendReplyState,
} from "@/app/admin/actions";
import { buildReplyTemplate } from "@/content/admin-reply-templates";
import { adminAr } from "@/content/admin-ar";

type Props = {
  inquiryId: string;
  toEmail: string;
  locale: string;
  customerName: string;
  projectTypeLabel: string;
  defaultSubject: string;
  defaultBody: string;
  mailReady: boolean;
};

const initialState: SendReplyState = { ok: false };

export function AdminReplyForm({
  inquiryId,
  toEmail,
  locale,
  customerName,
  projectTypeLabel,
  defaultSubject,
  defaultBody,
  mailReady,
}: Props) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const panelRef = useRef<HTMLDivElement>(null);
  const [state, action, pending] = useActionState(sendReplyAction, initialState);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [open]);

  function applyTemplate() {
    const draft = buildReplyTemplate({
      locale,
      name: customerName,
      projectType: projectTypeLabel,
    });
    setSubject(draft.subject);
    setBody(draft.body);
  }

  return (
    <div className="admin-reply">
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="admin-reply-panel"
      >
        {adminAr.reply}
      </button>

      {open ? (
        <div
          id="admin-reply-panel"
          ref={panelRef}
          className="admin-card admin-reply-panel"
        >
          <h3>{adminAr.replyComposerTitle}</h3>

          {!mailReady ? (
            <div className="admin-warning admin-reply-setup">
              <p className="admin-reply-setup-title">{adminAr.mailSetupTitle}</p>
              <p>{adminAr.mailSetupLead}</p>
              <ul>
                <li>
                  <code>SMTP_HOST</code> — smtp.zoho.eu أو smtp.zoho.com
                </li>
                <li>
                  <code>SMTP_PORT</code> — 465 (SSL) أو 587 (TLS)
                </li>
                <li>
                  <code>SMTP_USER</code> — support@tool2day.com
                </li>
                <li>
                  <code>SMTP_PASS</code> — App Password من Zoho
                </li>
                <li>
                  <code>MAIL_FROM</code> — tool2day &lt;support@tool2day.com&gt;
                </li>
              </ul>
              <p>{adminAr.mailSetupAfter}</p>
            </div>
          ) : (
            <form action={action} className="admin-edit-form">
              <input type="hidden" name="id" value={inquiryId} />
              <p className="admin-reply-meta">
                <span>{adminAr.replyTo}</span>
                <strong>{toEmail}</strong>
              </p>
              <p className="admin-reply-meta">
                <span>{adminAr.replyFrom}</span>
                <strong>support@tool2day.com</strong>
              </p>
              <div className="admin-reply-toolbar">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={applyTemplate}
                >
                  {adminAr.replyUseTemplate}
                </button>
              </div>
              <label>
                <span>{adminAr.replySubject}</span>
                <input
                  name="subject"
                  required
                  maxLength={200}
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                />
              </label>
              <label>
                <span>{adminAr.replyBody}</span>
                <textarea
                  name="body"
                  required
                  rows={14}
                  maxLength={20000}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                />
              </label>
              {state.error ? <p className="admin-error">{state.error}</p> : null}
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? adminAr.replySending : adminAr.replySend}
              </button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}
