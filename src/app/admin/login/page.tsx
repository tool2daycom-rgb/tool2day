import { connection } from "next/server";
import { redirect } from "next/navigation";
import { adminAr } from "@/content/admin-ar";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { adminAuthConfigured, getAdminSession } from "@/lib/auth";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AdminLoginPage({ searchParams }: Props) {
  await connection();
  const session = await getAdminSession();
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/admin") ? params.next : "/admin";

  if (session) {
    redirect(nextPath);
  }

  return (
    <main className="admin-main admin-main-center">
      <div className="admin-login-wrap">
        <p className="admin-kicker">{adminAr.brand}</p>
        <h1>{adminAr.loginTitle}</h1>
        <p className="admin-lead">{adminAr.loginLead}</p>
        {!adminAuthConfigured() ? (
          <div className="admin-card admin-warning">
            <h2>{adminAr.setupTitle}</h2>
            <p>{adminAr.setupLead}</p>
          </div>
        ) : (
          <AdminLoginForm nextPath={nextPath} />
        )}
      </div>
    </main>
  );
}
