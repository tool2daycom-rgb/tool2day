import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { adminAr, statusLabel, typeLabel } from "@/content/admin-ar";
import { AdminInquiryFilters } from "@/components/admin/AdminInquiryFilters";
import { AdminInquiryRowActions } from "@/components/admin/AdminInquiryRowActions";
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
    period?: string;
    archived?: string;
    deleted?: string;
  }>;
};

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("ar", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function currentListHref(input: {
  type: string;
  status: string;
  q: string;
  period: string;
}) {
  const params = new URLSearchParams();
  if (input.type !== "all") params.set("type", input.type);
  if (input.status !== "all") params.set("status", input.status);
  if (input.period === "week") params.set("period", "week");
  if (input.q) params.set("q", input.q);
  const query = params.toString();
  return query ? `/admin/inquiries?${query}` : "/admin/inquiries";
}

export default async function AdminInquiriesPage({ searchParams }: Props) {
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
  const period = params.period === "week" ? "week" : "all";
  const q = params.q?.trim() || "";
  const listHref = currentListHref({ type, status, q, period });

  const rows = await listInquiries({ type, status, q, period });

  return (
    <main className="admin-main">
      <header className="admin-top">
        <div>
          <p className="admin-kicker">{adminAr.brand}</p>
          <h1>{adminAr.listTitle}</h1>
          <p className="admin-lead">
            <Link className="admin-link-btn" href="/admin">
              {adminAr.backHome}
            </Link>
          </p>
        </div>
        <AdminLogoutButton />
      </header>

      {params.archived ? <p className="admin-success">{adminAr.archivedDone}</p> : null}
      {params.deleted ? <p className="admin-success">{adminAr.deletedDone}</p> : null}

      <AdminInquiryFilters type={type} status={status} q={q} period={period} />

      {period === "week" ? (
        <p className="admin-filter-hint">{adminAr.cardThisWeek}</p>
      ) : null}

      {status !== "all" || type !== "all" || q || period === "week" ? (
        <p className="admin-filter-hint">
          النتائج: {rows.length}
          {status !== "all" ? ` · ${statusLabel(status)}` : ""}
          {type !== "all" ? ` · ${typeLabel(type)}` : ""}
        </p>
      ) : null}

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
              <AdminInquiryRowActions
                id={row.id}
                status={row.status}
                listHref={listHref}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
