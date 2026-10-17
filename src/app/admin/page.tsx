import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { adminAr, statusLabel, typeLabel } from "@/content/admin-ar";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { hasDatabaseUrl } from "@/db/client";
import type { InquiryStatus, InquiryType } from "@/db/schema";
import { adminAuthConfigured, getAdminSession } from "@/lib/auth";
import { listInquiries } from "@/lib/inquiries";

type Props = {
  searchParams: Promise<{
    type?: string;
    status?: string;
    q?: string;
  }>;
};

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("ar", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminHomePage({ searchParams }: Props) {
  await connection();
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  if (!adminAuthConfigured() || !hasDatabaseUrl()) {
    return (
      <main className="admin-main">
        <header className="admin-top">
          <div>
            <p className="admin-kicker">{adminAr.brand}</p>
            <h1>{adminAr.listTitle}</h1>
          </div>
          <AdminLogoutButton />
        </header>
        <div className="admin-card admin-warning">
          <h2>{adminAr.setupTitle}</h2>
          <p>{!hasDatabaseUrl() ? adminAr.dbMissing : adminAr.setupLead}</p>
        </div>
      </main>
    );
  }

  const params = await searchParams;
  const type =
    params.type === "contact" || params.type === "project"
      ? (params.type as InquiryType)
      : "all";
  const status =
    params.status === "new" ||
    params.status === "in_progress" ||
    params.status === "replied" ||
    params.status === "archived"
      ? (params.status as InquiryStatus)
      : "all";
  const q = params.q?.trim() || "";

  const rows = await listInquiries({ type, status, q });

  return (
    <main className="admin-main">
      <header className="admin-top">
        <div>
          <p className="admin-kicker">{adminAr.brand}</p>
          <h1>{adminAr.listTitle}</h1>
        </div>
        <AdminLogoutButton />
      </header>

      <form className="admin-filters" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={adminAr.search}
          aria-label={adminAr.search}
        />
        <select name="type" defaultValue={type} aria-label={adminAr.allTypes}>
          <option value="all">{adminAr.allTypes}</option>
          <option value="contact">{adminAr.typeContact}</option>
          <option value="project">{adminAr.typeProject}</option>
        </select>
        <select name="status" defaultValue={status} aria-label={adminAr.allStatuses}>
          <option value="all">{adminAr.allStatuses}</option>
          <option value="new">{adminAr.statusNew}</option>
          <option value="in_progress">{adminAr.statusInProgress}</option>
          <option value="replied">{adminAr.statusReplied}</option>
          <option value="archived">{adminAr.statusArchived}</option>
        </select>
        <button type="submit" className="btn btn-primary">
          {adminAr.searchBtn}
        </button>
      </form>

      {rows.length === 0 ? (
        <p className="admin-empty">{adminAr.listEmpty}</p>
      ) : (
        <ul className="admin-list">
          {rows.map((row) => (
            <li key={row.id} className="admin-card admin-list-item">
              <div className="admin-list-main">
                <div className="admin-list-tags">
                  <span className={`admin-pill type-${row.type}`}>
                    {typeLabel(row.type)}
                  </span>
                  <span className={`admin-pill status-${row.status}`}>
                    {statusLabel(row.status)}
                  </span>
                </div>
                <h2>{row.name}</h2>
                <p>{row.email}</p>
                <p className="admin-muted">{formatWhen(row.createdAt)}</p>
              </div>
              <Link className="btn btn-ghost" href={`/admin/${row.id}`}>
                {adminAr.open}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
