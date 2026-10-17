import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { updateInquiryAction } from "@/app/admin/actions";
import { adminAr, statusLabel, typeLabel } from "@/content/admin-ar";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { hasDatabaseUrl } from "@/db/client";
import { getAdminSession } from "@/lib/auth";
import { displayValue, getInquiry } from "@/lib/inquiries";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
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

  const replyHref = `mailto:${encodeURIComponent(inquiry.email)}?subject=${encodeURIComponent(
    `Re: tool2day — ${inquiry.name}`,
  )}`;

  return (
    <main className="admin-main">
      <header className="admin-top">
        <div>
          <p className="admin-kicker">{adminAr.brand}</p>
          <h1>{adminAr.detailsTitle}</h1>
        </div>
        <div className="admin-top-actions">
          <Link href="/admin" className="admin-link-btn">
            {adminAr.back}
          </Link>
          <AdminLogoutButton />
        </div>
      </header>

      {sp.saved ? <p className="admin-success">{adminAr.saved}</p> : null}

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
        <p>
          <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
        </p>
        <p className="admin-muted">
          {adminAr.createdAt}: {formatWhen(inquiry.createdAt)}
        </p>
        <div className="admin-detail-actions">
          <a className="btn btn-primary" href={replyHref}>
            {adminAr.reply}
          </a>
        </div>
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
