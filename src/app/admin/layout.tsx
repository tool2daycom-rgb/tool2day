import type { Metadata } from "next";
import "@/app/globals.css";

export const instant = false;

export const metadata: Metadata = {
  title: "إدارة tool2day",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell" lang="ar" dir="rtl">
      {children}
    </div>
  );
}
