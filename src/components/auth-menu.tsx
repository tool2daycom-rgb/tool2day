"use client";

import Link from "next/link";
import {
  Camera,
  Check,
  LogOut,
  Pencil,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { User as AuthUser } from "@supabase/supabase-js";
import { useLocale } from "@/components/locale-provider";
import { createClient } from "@/lib/supabase/client";
import {
  findCountry,
  PROFILE_COUNTRIES,
} from "@/lib/profile-countries";

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
    if (typeof c === "string" && c.startsWith("data:image/")) return c;
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
    "Account"
  );
}

function getCountryCode(user: AuthUser): string {
  const meta = user.user_metadata || {};
  return typeof meta.country_code === "string" ? meta.country_code : "";
}

async function fileToAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const size = 192;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  const min = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - min) / 2;
  const sy = (bitmap.height - min) / 2;
  ctx.drawImage(bitmap, sx, sy, min, min, 0, 0, size, size);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function AuthMenu() {
  const { messages, localeDef } = useLocale();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [nameDraft, setNameDraft] = useState("");
  const [countryDraft, setCountryDraft] = useState("");
  const [avatarDraft, setAvatarDraft] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});

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

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setEditing(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function placePanel() {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const width = Math.min(288, window.innerWidth - 16);
    let right = Math.max(8, window.innerWidth - rect.right);
    if (right + width > window.innerWidth - 8) {
      right = 8;
    }
    const top = Math.min(rect.bottom + 8, window.innerHeight - 24);
    setPanelStyle({
      position: "fixed",
      top,
      right,
      width,
      maxHeight: "min(80vh, 560px)",
      zIndex: 80,
    });
  }

  useEffect(() => {
    if (!open) return;
    placePanel();
    window.addEventListener("resize", placePanel);
    window.addEventListener("scroll", placePanel, true);
    return () => {
      window.removeEventListener("resize", placePanel);
      window.removeEventListener("scroll", placePanel, true);
    };
  }, [open, editing]);

  function startEdit() {
    if (!user) return;
    setNameDraft(getDisplayName(user));
    setCountryDraft(getCountryCode(user));
    setAvatarDraft(getAvatarUrl(user));
    setSaveNote(null);
    setError(null);
    setEditing(true);
  }

  async function onPickAvatar(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setAvatarDraft(dataUrl);
      setAvatarBroken(false);
    } catch {
      setError(messages.profileSaveFailed);
    }
  }

  async function saveProfile() {
    if (!user || busy) return;
    const name = nameDraft.trim().slice(0, 60);
    if (!name) {
      setError(messages.profileNameRequired);
      return;
    }
    const country = findCountry(countryDraft);
    setBusy(true);
    setError(null);
    setSaveNote(null);
    try {
      const supabase = createClient();
      const { data, error: upErr } = await supabase.auth.updateUser({
        data: {
          full_name: name,
          name,
          avatar_url: avatarDraft || undefined,
          picture: avatarDraft || undefined,
          country_code: country?.code || "",
          country_flag: country?.flag || "",
          country_name: country?.nameAr || "",
        },
      });
      if (upErr) throw upErr;
      if (data.user) setUser(data.user);
      setSaveNote(messages.profileSaved);
      setEditing(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : messages.profileSaveFailed,
      );
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      setOpen(false);
      setEditing(false);
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
        <span className="hidden sm:inline">{messages.login}</span>
      </Link>
    );
  }

  const label = getDisplayName(user);
  const avatar = getAvatarUrl(user);
  const showPhoto = Boolean(avatar) && !avatarBroken;
  const country = findCountry(getCountryCode(user));
  const isAr = localeDef.code === "ar" || localeDef.dir === "rtl";

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            if (!next) setEditing(false);
            return next;
          });
        }}
        className="inline-flex max-w-[12rem] flex-row items-center gap-2 transition hover:opacity-90"
        aria-expanded={open}
        aria-label={label}
      >
        <span className="hidden truncate text-sm font-bold sm:inline">
          {country ? `${country.flag} ` : ""}
          {label}
        </span>
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
      </button>

      {open ? (
        <div
          dir={localeDef.dir}
          style={panelStyle}
          className="overflow-y-auto rounded-xl border border-white/10 bg-[#1c1c1c] py-1 shadow-2xl"
        >
          {!editing ? (
            <>
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
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {country ? `${country.flag} ` : ""}
                    {label}
                  </p>
                  <p className="truncate text-xs text-white/50">{user.email}</p>
                  {country ? (
                    <p className="mt-0.5 truncate text-[11px] text-white/60">
                      {country.flag}{" "}
                      {isAr ? country.nameAr : country.nameEn}
                    </p>
                  ) : null}
                </div>
              </div>
              {saveNote ? (
                <p className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  {saveNote}
                </p>
              ) : null}
              <button
                type="button"
                onClick={startEdit}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-white/10"
              >
                <Pencil className="h-4 w-4" />
                {messages.editProfile}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void signOut()}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-white/10 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {messages.logout}
              </button>
            </>
          ) : (
            <div className="space-y-3 px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-extrabold text-white">
                  {messages.editProfile}
                </p>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white"
                  aria-label="close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  {avatarDraft && !avatarBroken ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarDraft}
                      alt=""
                      width={72}
                      height={72}
                      className="h-[72px] w-[72px] rounded-full object-cover ring-2 ring-white/20"
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarBroken(true)}
                    />
                  ) : (
                    <span className="inline-flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white/15">
                      <User className="h-8 w-8" />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1 -end-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#E8874A] text-white shadow"
                    aria-label={messages.changePhoto}
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      void onPickAvatar(e.target.files?.[0] || null)
                    }
                  />
                </div>
                <p className="text-[11px] text-white/45">{messages.changePhotoHint}</p>
              </div>

              <label className="block text-[11px] font-bold text-white/70">
                {messages.profileName}
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-[#E8874A]"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  maxLength={60}
                  disabled={busy}
                />
              </label>

              <label className="block text-[11px] font-bold text-white/70">
                {messages.profileCountry}
                <select
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-[#E8874A]"
                  value={countryDraft}
                  onChange={(e) => setCountryDraft(e.target.value)}
                  disabled={busy}
                >
                  <option value="">{messages.profileCountryNone}</option>
                  {PROFILE_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {isAr ? c.nameAr : c.nameEn}
                    </option>
                  ))}
                </select>
              </label>

              {error ? (
                <p className="text-xs font-bold text-red-400">{error}</p>
              ) : null}

              <button
                type="button"
                disabled={busy || !nameDraft.trim()}
                onClick={() => void saveProfile()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E8874A] px-3 py-2.5 text-sm font-extrabold text-white disabled:opacity-40"
              >
                {busy ? messages.saving : messages.saveProfile}
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
