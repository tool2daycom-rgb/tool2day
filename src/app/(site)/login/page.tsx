import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: "سجّل الدخول إلى Tool2Day عبر Google أو Facebook أو GitHub",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string; next?: string }>;
}) {
  const params = await searchParams;
  const returnTo = params.returnTo || params.next;
  return <LoginForm error={params.error} returnTo={returnTo} />;
}
