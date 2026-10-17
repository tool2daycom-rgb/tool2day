import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { updateInquiryAction } from "@/app/admin/actions";
import { adminAr, statusLabel, typeLabel } from "@/content/admin-ar";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminReplyForm } from "@/components/admin/AdminReplyForm";
import { hasDatabaseUrl } from "@/db/client";
import { getAdminSession } from "@/lib/auth";
import {
  defaultReplyBody,
  defaultReplySubject,
  displayValue,
  getInquiry,
  listInquiryReplies,
} from "@/lib/inquiries";
import { mailConfigured } from "@/lib/mail";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; replied?: string }>;
};

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("ar", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

function Field({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="admin-field">
      <dt>{label}</dt>
      <dd>{displayValue(value)}</dd>
    </div>
  );
}

function customerMessageText(
  type: "contact" | "project",
  payload: Record<string, unknown>,
) {
  if (type === "contact") {
    const service = displayValue(payload.service);
    const message = displayValue(payload.message);
    return [`${adminAr.service}: ${service}`, "", message].join("\n");
  }
  const details = displayValue(payload.details);
  const types = displayValue(payload.projectTypes);
  return [`${adminAr.projectTypes}: ${types}`, "", details].join("\n");
}

export default async function AdminInquiryPage({ params, searchParams }: Props) {
  await connection();
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!hasDatabaseUrl()) {
    return (
      <main className="admin-main">
        <div className="admin-card admin-warning">
          <p>{adminAr.dbMissing}</p>
        </div>
      </main>
    );
  }

  const { id } = await params;
  const inquiry = await getInquiry(id);
  if (!inquiry) notFound();
  const sp = await searchParams;
  const payload = inquiry.payload || {};
  const replies = await listInquiryReplies(inquiry.id);
  const mailReady = mailConfigured();

  return (
    <main className="admin-main">
      <header className="admin-top">
        <div>
          <p className="admin-kicker">{adminAr.brand}</p>
          <h1>{adminAr.detailsTitle}</h1>
        </div>
        <div className="admin-top-actions">
          <Link href="/admin/inquiries" className="admin-link-btn">
            {adminAr.back}
          </Link>
          <AdminLogoutButton />
        </div>
      </header>

      {sp.saved ? <p className="admin-success">{adminAr.saved}</p> : null}
      {sp.replied ? <p className="admin-success">{adminAr.replySent}</p> : null}

      <section className="admin-card">
        <div className="admin-list-tags">
          <span className={`admin-pill type-${inquiry.type}`}>
            {typeLabel(inquiry.type)}
          </span>
          <span className={`admin-pill status-${inquiry.status}`}>
            {statusLabel(inquiry.status)}
          </span>
        </div>
        <h2>{inquiry.name}</h2>
        <p>{inquiry.email}</p>
        <p className="admin-muted">
          {adminAr.createdAt}: {formatWhen(inquiry.createdAt)}
        </p>
        <div className="admin-detail-actions">
          <AdminReplyForm
            inquiryId={inquiry.id}
            toEmail={inquiry.email}
            defaultSubject={defaultReplySubject(inquiry)}
            defaultBody={defaultReplyBody(inquiry)}
            mailReady={mailReady}
          />
        </div>
      </section>

      <section className="admin-card">
        <h3>{adminAr.conversation}</h3>
        <ol className="admin-thread">
          <li className="admin-thread-item is-customer">
            <div className="admin-thread-meta">
              <strong>{adminAr.conversationCustomer}</strong>
              <span>{formatWhen(inquiry.createdAt)}</span>
            </div>
            <p className="admin-thread-body">
              {customerMessageText(inquiry.type, payload)}
            </p>
          </li>
          {replies.map((reply) => (
            <li key={reply.id} className="admin-thread-item is-admin">
              <div className="admin-thread-meta">
                <strong>{adminAr.conversationAdmin}</strong>
                <span>{formatWhen(reply.sentAt)}</span>
              </div>
              <p className="admin-thread-subject">{reply.subject}</p>
              <p className="admin-thread-body">{reply.body}</p>
              <p className="admin-muted">
                {adminAr.replyFrom}: {reply.fromEmail} · {adminAr.replyTo}:{" "}
                {reply.toEmail}
              </p>
            </li>
          ))}
        </ol>
        {replies.length === 0 ? (
          <p className="admin-muted">{adminAr.conversationEmpty}</p>
        ) : null}
      </section>

      <section className="admin-card">
        <h3>{adminAr.meta}</h3>
        <dl className="admin-dl">
          <Field label={adminAr.locale} value={inquiry.locale} />
          <Field label={adminAr.name} value={inquiry.name} />
          <Field label={adminAr.email} value={inquiry.email} />
          <Field label={adminAr.phone} value={inquiry.phone} />
          <Field label={adminAr.company} value={inquiry.company} />
        </dl>
      </section>

      <section className="admin-card">
        <h3>{adminAr.answers}</h3>
        <dl className="admin-dl">
          {inquiry.type === "contact" ? (
            <>
              <Field label={adminAr.service} value={payload.service} />
              <Field label={adminAr.message} value={payload.message} />
            </>
          ) : (
            <>
              <Field label={adminAr.projectTypes} value={payload.projectTypes} />
              <Field label={adminAr.otherProjectNote} value={payload.otherProjectNote} />
              <Field label={adminAr.goals} value={payload.goals} />
              <Field label={adminAr.otherGoalNote} value={payload.otherGoalNote} />
              <Field label={adminAr.websiteFeatures} value={payload.websiteFeatures} />
              <Field label={adminAr.webappFeatures} value={payload.webappFeatures} />
              <Field label={adminAr.mobileFeatures} value={payload.mobileFeatures} />
              <Field label={adminAr.hostingFeatures} value={payload.hostingFeatures} />
              <Field label={adminAr.timeline} value={payload.timeline} />
              <Field label={adminAr.details} value={payload.details} />
              <Field label={adminAr.contactMethod} value={payload.contactMethod} />
            </>
          )}
        </dl>
      </section>

      <section className="admin-card">
        <h3>{adminAr.status}</h3>
        <form action={updateInquiryAction} className="admin-edit-form">
          <input type="hidden" name="id" value={inquiry.id} />
          <label>
            <span>{adminAr.status}</span>
            <select name="status" defaultValue={inquiry.status}>
              <option value="new">{adminAr.statusNew}</option>
              <option value="in_progress">{adminAr.statusInProgress}</option>
              <option value="replied">{adminAr.statusReplied}</option>
              <option value="archived">{adminAr.statusArchived}</option>
            </select>
          </label>
          <label>
            <span>{adminAr.note}</span>
            <textarea
              name="internalNote"
              rows={5}
              defaultValue={inquiry.internalNote}
              placeholder={adminAr.notePlaceholder}
            />
          </label>
          <button type="submit" className="btn btn-primary">
            {adminAr.save}
          </button>
        </form>
      </section>
    </main>
  );
}
