"use client";

import { useRouter } from "next/navigation";
import { adminAr } from "@/content/admin-ar";

export function AdminLogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button type="button" className="admin-link-btn" onClick={logout}>
      {adminAr.logout}
    </button>
  );
}
