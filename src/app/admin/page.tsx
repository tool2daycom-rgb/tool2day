import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { adminAr } from "@/content/admin-ar";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { hasDatabaseUrl } from "@/db/client";
import { adminAuthConfigured, getAdminSession } from "@/lib/auth";
import {
  getInquiryDashboardStats,
  type InquiryDashboardStats,
} from "@/lib/inquiries";

type DashCard = {
  id: string;
  title: string;
  count: number;
  href: string;
  badge?: string;
};

function buildCards(stats: InquiryDashboardStats): DashCard[] {
  return [
    {
      id: "all",
      title: adminAr.cardAll,
      count: stats.total,
      href: "/admin/inquiries",
    },
    {
      id: "new-projects",
      title: adminAr.cardNewProjects,
      count: stats.newProjects,
      href: "/admin/inquiries?type=project&status=new",
    },
    {
      id: "new-contacts",
      title: adminAr.cardNewContacts,
      count: stats.newContacts,
      href: "/admin/inquiries?type=contact&status=new",
    },
    {
      id: "in-progress",
      title: adminAr.cardInProgress,
      count: stats.inProgress,
      href: "/admin/inquiries?status=in_progress",
    },
    {
      id: "replied",
      title: adminAr.cardReplied,
      count: stats.replied,
      href: "/admin/inquiries?status=replied",
    },
    {
      id: "archived",
      title: adminAr.cardArchived,
      count: stats.archived,
      href: "/admin/inquiries?status=archived",
    },
    {
      id: "week",
      title: adminAr.cardThisWeek,
      count: stats.thisWeek,
      href: "/admin/inquiries?period=week",
      badge: stats.thisWeek > 0 ? adminAr.weekBadge : undefined,
    },
  ];
}

export default async function AdminHomePage() {
  await connection();
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  if (!adminAuthConfigured() || !hasDatabaseUrl()) {
    return (
      <main className="admin-main">
        <header className="admin-top">
          <div>
            <p className="admin-kicker">{adminAr.brand}</p>
            <h1>{adminAr.homeTitle}</h1>
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

  const stats = await getInquiryDashboardStats();
  const cards = buildCards(stats);

  return (
    <main className="admin-main">
      <header className="admin-top">
        <div>
          <p className="admin-kicker">{adminAr.brand}</p>
          <h1>{adminAr.homeTitle}</h1>
          <p className="admin-lead">{adminAr.homeLead}</p>
        </div>
        <AdminLogoutButton />
      </header>

      <ul className="admin-dash-grid">
        {cards.map((card) => (
          <li key={card.id}>
            <Link className="admin-dash-card" href={card.href}>
              <span className="admin-dash-card-title">{card.title}</span>
              <span className="admin-dash-card-count">{card.count}</span>
              {card.badge ? (
                <span className="admin-dash-card-badge">↑ {card.badge}</span>
              ) : null}
              <span className="admin-dash-card-link">{adminAr.openSection}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
