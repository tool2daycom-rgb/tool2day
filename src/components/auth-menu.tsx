"use client";

import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import type { User as AuthUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

function getAvatarUrl(user: AuthUser): string | null {
  const meta = user.user_metadata || {};
  const candidates = [
    meta.avatar_url,
    meta.picture,
    meta.avatar,
    meta.profile_image_url,
    user.identities?.[0]?.identity_data?.avatar_url,
    user.identities?.[0]?.identity_data?.picture,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && /^https?:\/\//i.test(c)) return c;
  }
  return null;
}

function getDisplayName(user: AuthUser): string {
  const meta = user.user_metadata || {};
  return (
    meta.full_name ||
    meta.name ||
    meta.preferred_username ||
    user.email?.split("@")[0] ||
    "حسابي"
  );
}

export function AuthMenu() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let subscription: { unsubscribe: () => void } | undefined;

    try {
      const supabase = createClient();

      supabase.auth.getUser().then(({ data }) => {
        if (!cancelled) {
          setUser(data.user);
          setAvatarBroken(false);
          setReady(true);
        }
      });

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setAvatarBroken(false);
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

  const label = getDisplayName(user);
  const avatar = getAvatarUrl(user);
  const showPhoto = Boolean(avatar) && !avatarBroken;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex max-w-[12rem] items-center gap-2 transition hover:opacity-90"
        aria-expanded={open}
        aria-label={label}
      >
        {showPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar!}
            alt={label}
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-white/25"
            referrerPolicy="no-referrer"
            onError={() => setAvatarBroken(true)}
          />
        ) : (
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/25">
            <User className="h-4 w-4" strokeWidth={2.25} />
          </span>
        )}
        <span className="hidden truncate text-sm font-bold sm:inline">
          {label}
        </span>
      </button>
      {open ? (
        <div
          dir="rtl"
          className="absolute end-0 top-full z-50 mt-2 min-w-52 overflow-hidden rounded-lg border border-white/10 bg-[#1c1c1c] py-1 shadow-xl"
        >
          <div className="flex items-center gap-3 border-b border-white/10 px-3 py-3">
            {showPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar!}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setAvatarBroken(true)}
              />
            ) : (
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
                <User className="h-5 w-5" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{label}</p>
              <p className="truncate text-xs text-white/50">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={signOut}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-white/10 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </button>
        </div>
      ) : null}
    </div>
  );
}
