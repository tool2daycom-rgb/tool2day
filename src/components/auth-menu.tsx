"use client";

import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import type { User as AuthUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function AuthMenu() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let subscription: { unsubscribe: () => void } | undefined;

    try {
      const supabase = createClient();

      supabase.auth.getUser().then(({ data }) => {
        if (!cancelled) {
          setUser(data.user);
          setReady(true);
        }
      });

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setReady(true);
      });
      subscription = data.subscription;
    } catch {
      if (!cancelled) setReady(true);
    }

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  async function signOut() {
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      setOpen(false);
      window.location.href = "/";
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <span className="inline-flex h-8 w-28 animate-pulse rounded-md bg-white/10" />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 transition hover:opacity-80"
      >
        <User className="h-4 w-4" strokeWidth={2.25} />
        <span className="hidden sm:inline">تسجيل الدخول</span>
      </Link>
    );
  }

  const label =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "حسابي";
  const avatar = user.user_metadata?.avatar_url as string | undefined;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex max-w-[10rem] items-center gap-2 transition hover:opacity-80"
        aria-expanded={open}
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt=""
            className="h-7 w-7 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <User className="h-4 w-4" strokeWidth={2.25} />
        )}
        <span className="hidden truncate sm:inline">{label}</span>
      </button>
      {open ? (
        <div
          dir="rtl"
          className="absolute end-0 top-full z-50 mt-2 min-w-44 rounded-md border border-white/10 bg-[#1c1c1c] py-1 shadow-xl"
        >
          <p className="truncate px-3 py-2 text-xs text-white/50">
            {user.email}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={signOut}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </button>
        </div>
      ) : null}
    </div>
  );
}
