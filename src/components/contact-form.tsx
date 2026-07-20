"use client";

import Link from "next/link";
import { Paperclip, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { BrandMarkAnimated } from "@/components/brand-mark-animated";

export function ContactForm() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function onPickFiles(list: FileList | null) {
    if (!list?.length) return;
    const next = [...files, ...Array.from(list)].slice(0, 3);
    setFiles(next);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    setError("");

    startTransition(async () => {
      try {
        const body = new FormData();
        body.append("message", message);
        body.append("email", email);
        for (const file of files) body.append("files", file);

        const res = await fetch("/api/contact", { method: "POST", body });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          ok?: boolean;
        };

        if (!res.ok) {
          setStatus("error");
          setError(data.error || "تعذّر الإرسال");
          return;
        }

        setStatus("ok");
        setMessage("");
        setEmail("");
        setFiles([]);
        if (fileRef.current) fileRef.current.value = "";
      } catch {
        setStatus("error");
        setError("تعذّر الاتصال بالخادم");
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-12 sm:px-6 sm:py-16">
      <BrandMarkAnimated size={64} motion="morph" className="mb-8" />

      <div className="relative w-full rounded-2xl border border-[#ececec] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)] sm:p-8">
        <Link
          href="/"
          className="absolute end-4 top-4 rounded-md p-1.5 text-[#999] transition hover:bg-[#f3f3f3] hover:text-[#333]"
          aria-label="إغلاق"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </Link>

        <h1 className="pe-8 text-2xl font-bold text-[#111]">تواصل معنا</h1>
        <p className="mt-1.5 text-sm text-[#888]">
          اطرح سؤالاً، أبلغ عن خطأ، أو اقترح ميزة
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <textarea
            required
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="رسالتك"
            className="w-full resize-y rounded-lg border border-[#ddd] bg-white px-3.5 py-3 text-[15px] text-[#222] outline-none placeholder:text-[#aaa] focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20"
          />

          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="بريدك الإلكتروني"
            dir="ltr"
            className="w-full rounded-lg border border-[#ddd] bg-white px-3.5 py-3 text-start text-[15px] text-[#222] outline-none placeholder:text-[#aaa] focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20"
          />

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2563eb] transition hover:underline"
            >
              <Paperclip className="h-4 w-4" />
              إرفاق الملفات
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf,.txt,.zip"
              multiple
              className="hidden"
              onChange={(e) => onPickFiles(e.target.files)}
            />
            <span className="text-xs text-[#999]">حتى 3 ملفات · 2.5MB لكل ملف</span>
          </div>

          {files.length > 0 ? (
            <ul className="space-y-1.5 rounded-lg bg-[#f7f7f7] px-3 py-2 text-sm text-[#444]">
              {files.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="shrink-0 text-[#999] hover:text-[#333]"
                    aria-label="إزالة الملف"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {status === "ok" ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              تم إرسال رسالتك بنجاح. سنرد في أقرب وقت.
            </p>
          ) : null}
          {status === "error" ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 w-full rounded-lg bg-[#3b82f6] py-3 text-[15px] font-bold text-white transition hover:bg-[#2563eb] disabled:opacity-60"
          >
            {pending ? "جارٍ الإرسال…" : "إرسال رسالة"}
          </button>
        </form>
      </div>
    </div>
  );
}
