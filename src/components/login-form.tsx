"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandMarkAnimated } from "@/components/brand-mark-animated";
import { createClient } from "@/lib/supabase/client";

type Provider = "google" | "facebook" | "github";

const providers: {
  id: Provider;
  label: string;
  className: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "google",
    label: "المتابعة مع Google",
    className:
      "border border-[#dadce0] bg-white text-[#3c4043] hover:bg-[#f8f9fa]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path
          fill="#EA4335"
          d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.5 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12S6.9 21.3 12 21.3c5.4 0 9-3.8 9-9.1 0-.6-.1-1.1-.2-1.6H12z"
        />
        <path
          fill="#34A853"
          d="M3.9 7.4l3 2.2C7.7 7.5 9.7 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.5 2.7 12 2.7 8.4 2.7 5.3 4.7 3.9 7.4z"
        />
        <path
          fill="#4A90E2"
          d="M12 21.3c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-3.5 0-6.5-2.4-7.5-5.6l-3 2.3C3.2 18.5 7.2 21.3 12 21.3z"
        />
        <path
          fill="#FBBC05"
          d="M4.5 14.2c-.2-.6-.4-1.3-.4-2s.1-1.4.4-2l-3-2.3C1.2 9.1 1 10.5 1 12s.2 2.9.9 4.2l2.6-2z"
        />
      </svg>
    ),
  },
  {
    id: "facebook",
    label: "المتابعة مع Facebook",
    className: "bg-[#1877F2] text-white hover:bg-[#166fe5]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden>
        <path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 5.02 3.66 9.18 8.44 9.93v-7.02H7.9v-2.91h2.4V9.84c0-2.37 1.41-3.68 3.56-3.68 1.03 0 2.11.18 2.11.18v2.32h-1.19c-1.17 0-1.54.73-1.54 1.48v1.78h2.62l-.42 2.91h-2.2V22c4.78-.75 8.44-4.91 8.44-9.93z" />
      </svg>
    ),
  },
  {
    id: "github",
    label: "المتابعة مع GitHub",
    className: "bg-[#24292f] text-white hover:bg-[#1b1f23]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden>
        <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6a4.6 4.6 0 0 1 1.3-3.2 4.3 4.3 0 0 1 .1-3.2s1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2a4.6 4.6 0 0 1 1.3 3.2c0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3z" />
      </svg>
    ),
  },
];

export function LoginForm({
  error,
  returnTo,
}: {
  error?: string;
  returnTo?: string;
}) {
  const [loading, setLoading] = useState<Provider | null>(null);
  const [localError, setLocalError] = useState("");

  async function signIn(provider: Provider) {
    setLocalError("");
    setLoading(provider);
    try {
      const supabase = createClient();
      const origin =
        process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const callback = new URL(
        `${origin.replace(/\/$/, "")}/auth/callback`,
      );
      if (returnTo) {
        callback.searchParams.set("next", returnTo);
      }
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callback.toString(),
        },
      });
      if (oauthError) {
        setLocalError(oauthError.message);
        setLoading(null);
      }
    } catch (e) {
      setLocalError(
        e instanceof Error
          ? e.message
          : "تعذّر بدء تسجيل الدخول. تحقق من إعدادات Supabase.",
      );
      setLoading(null);
    }
  }

  const backHref =
    returnTo &&
    (() => {
      try {
        const u = new URL(returnTo, "https://www.tool2day.com");
        const host = u.hostname;
        if (
          host === "lookup.tool2day.com" ||
          host === "www.tool2day.com" ||
          host === "tool2day.com" ||
          host === "aman.tool2day.com" ||
          returnTo.startsWith("/")
        ) {
          return returnTo.startsWith("/") ? returnTo : u.toString();
        }
      } catch {
        /* ignore */
      }
      return "/";
    })();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-14 sm:px-6">
      <BrandMarkAnimated size={56} motion="morph" className="mb-6" />

      <div className="w-full rounded-2xl border border-[#ececec] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)] sm:p-8">
        <h1 className="text-2xl font-bold text-[#111]">تسجيل الدخول</h1>
        <p className="mt-1.5 text-sm text-[#888]">
          سجّل الدخول بحسابك للمتابعة على Tool2Day
        </p>

        {(error || localError) && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {localError ||
              "فشل تسجيل الدخول. حاول مرة أخرى أو اختر مزوّداً آخر."}
          </p>
        )}

        <div className="mt-6 space-y-3">
          {providers.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={loading !== null}
              onClick={() => signIn(p.id)}
              className={`flex w-full items-center justify-center gap-3 rounded-lg px-4 py-3 text-[15px] font-bold transition disabled:opacity-60 ${p.className}`}
            >
              {p.icon}
              <span>
                {loading === p.id ? "جارٍ التحويل…" : p.label}
              </span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-[#999]">
          بالمتابعة، أنت توافق على{" "}
          <Link href="/terms" className="text-[#2563eb] hover:underline">
            الشروط والأحكام
          </Link>{" "}
          و
          <Link href="/privacy" className="text-[#2563eb] hover:underline">
            الخصوصية
          </Link>
          .
        </p>
      </div>

      <Link
        href={backHref || "/"}
        className="mt-8 text-sm font-semibold text-[#2563eb] hover:underline"
      >
        {backHref && backHref.includes("lookup.tool2day.com")
          ? "← العودة لنتائج Lookup"
          : "← العودة للرئيسية"}
      </Link>
    </div>
  );
}
