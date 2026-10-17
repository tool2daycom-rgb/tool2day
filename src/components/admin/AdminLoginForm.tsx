"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { adminAr } from "@/content/admin-ar";

type Props = {
  nextPath: string;
};

export function AdminLoginForm({ nextPath }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.get("username"),
          password: data.get("password"),
        }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !json.ok) {
        setError(json.message || "تعذّر تسجيل الدخول.");
        return;
      }
      router.replace(nextPath.startsWith("/admin") ? nextPath : "/admin");
      router.refresh();
    } catch {
      setError("تعذّر الاتصال بالخادم.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="admin-card admin-login-form" onSubmit={onSubmit}>
      <label>
        <span>{adminAr.username}</span>
        <input name="username" autoComplete="username" required />
      </label>
      <label>
        <span>{adminAr.password}</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {error ? (
        <p className="admin-error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "..." : adminAr.login}
      </button>
    </form>
  );
}
