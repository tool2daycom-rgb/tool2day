"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { beginToolUse, setDownloadRatingContext } from "@/lib/ratings";
import {
  analyzeText,
  collapseSpaces,
  detectErrors,
  findReplace,
  removeEmptyLines,
  reverseText,
  sortLines,
  toLower,
  toTitleCase,
  toUpper,
  uniqueLines,
} from "@/lib/processors/text-utils";

type Kind = "text-tools" | "error-detector" | "speed-test";

type Props = {
  kind: Kind;
  slug: string;
  title: string;
  description: string;
};

const field =
  "w-full rounded-md border border-[#ddd] bg-white px-3 py-2 text-sm text-[#222] outline-none focus:border-[#2563eb]";

export function UtilityToolWorkspace({ kind, slug, title, description }: Props) {
  useEffect(() => {
    setDownloadRatingContext(slug);
    return () => setDownloadRatingContext(null);
  }, [slug]);

  if (kind === "speed-test") {
    return <SpeedTestPanel slug={slug} title={title} description={description} />;
  }
  if (kind === "error-detector") {
    return (
      <ErrorDetectorPanel slug={slug} title={title} description={description} />
    );
  }
  return <TextToolsPanel slug={slug} title={title} description={description} />;
}

function PanelShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#e8e8e8] bg-white p-5 shadow-sm sm:p-6">
      <p className="text-lg font-semibold text-[#111]">{title}</p>
      <p className="mt-1 text-sm leading-7 text-[#666]">{description}</p>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function TextToolsPanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [text, setText] = useState("");
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const stats = useMemo(() => analyzeText(text), [text]);

  function apply(fn: (t: string) => string, label: string) {
    beginToolUse(slug);
    setText(fn(text));
    setNote(label);
  }

  async function copyOut() {
    beginToolUse(slug);
    await navigator.clipboard.writeText(text);
    setNote("تم النسخ");
  }

  async function downloadTxt() {
    beginToolUse(slug);
    const { downloadBlob } = await import("@/lib/processors/ffmpeg-client");
    await downloadBlob(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
      "tool2day-text.txt",
    );
    setNote("تم التنزيل");
  }

  return (
    <PanelShell title={title} description={description}>
      <textarea
        className={`${field} min-h-44 leading-7`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="الصق النص هنا…"
        dir="auto"
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["أحرف", stats.chars],
          ["بدون مسافات", stats.charsNoSpaces],
          ["كلمات", stats.words],
          ["أسطر", stats.lines],
          ["جمل", stats.sentences],
          ["فقرات", stats.paragraphs],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-lg bg-[#f7f7f7] px-3 py-2 text-center"
          >
            <p className="text-lg font-bold text-[#111]">{value}</p>
            <p className="text-[11px] text-[#777]">{label}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Action onClick={() => apply(toUpper, "أحرف كبيرة")}>أحرف كبيرة</Action>
        <Action onClick={() => apply(toLower, "أحرف صغيرة")}>أحرف صغيرة</Action>
        <Action onClick={() => apply(toTitleCase, "عنوان")}>عنوان</Action>
        <Action onClick={() => apply(reverseText, "عكس")}>عكس النص</Action>
        <Action onClick={() => apply(collapseSpaces, "تنظيف مسافات")}>
          تنظيف المسافات
        </Action>
        <Action onClick={() => apply(removeEmptyLines, "حذف أسطر فارغة")}>
          حذف الأسطر الفارغة
        </Action>
        <Action onClick={() => apply((t) => sortLines(t, false), "ترتيب")}>
          ترتيب الأسطر
        </Action>
        <Action onClick={() => apply(uniqueLines, "فريدة")}>أسطر فريدة</Action>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input
          className={field}
          value={find}
          onChange={(e) => setFind(e.target.value)}
          placeholder="بحث…"
        />
        <input
          className={field}
          value={replace}
          onChange={(e) => setReplace(e.target.value)}
          placeholder="استبدال بـ…"
        />
        <Action
          onClick={() =>
            apply((t) => findReplace(t, find, replace, true), "استبدال")
          }
        >
          استبدال الكل
        </Action>
      </div>
      <div className="flex flex-wrap gap-2">
        <Action onClick={() => void copyOut()} primary>
          نسخ
        </Action>
        <Action onClick={() => void downloadTxt()} primary>
          تنزيل TXT
        </Action>
        <Action onClick={() => setText("")}>مسح</Action>
      </div>
      {note ? <p className="text-xs text-emerald-700">{note}</p> : null}
    </PanelShell>
  );
}

function ErrorDetectorPanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [mode, setMode] = useState("json");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ReturnType<typeof detectErrors> | null>(
    null,
  );

  function runCheck() {
    beginToolUse(slug);
    setResult(detectErrors(input, mode));
  }

  return (
    <PanelShell title={title} description={description}>
      <label className="block text-sm font-semibold text-[#333]">
        نوع الفحص
        <select
          className={`${field} mt-1`}
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="json">JSON</option>
          <option value="url">رابط URL</option>
          <option value="email">بريد إلكتروني</option>
          <option value="js">صياغة JavaScript</option>
          <option value="html">هيكل HTML</option>
        </select>
      </label>
      <textarea
        className={`${field} min-h-44 font-mono text-[13px] leading-6`}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="الصق المحتوى للفحص…"
        dir="ltr"
      />
      <Action onClick={runCheck} primary>
        فحص الأخطاء
      </Action>
      {result ? (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            result.ok
              ? "bg-emerald-50 text-emerald-900"
              : "bg-red-50 text-red-900"
          }`}
        >
          <p className="font-bold">{result.message}</p>
          {result.details ? (
            <pre className="mt-2 whitespace-pre-wrap text-xs opacity-90">
              {result.details}
            </pre>
          ) : null}
          {result.formatted ? (
            <textarea
              className={`${field} mt-3 min-h-40 font-mono text-[12px]`}
              readOnly
              value={result.formatted}
              dir="ltr"
            />
          ) : null}
        </div>
      ) : null}
    </PanelShell>
  );
}

function SpeedTestPanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [busy, setBusy] = useState(false);
  const [ping, setPing] = useState<number | null>(null);
  const [down, setDown] = useState<number | null>(null);
  const [up, setUp] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function runTest() {
    beginToolUse(slug);
    setBusy(true);
    setError(null);
    setPing(null);
    setDown(null);
    setUp(null);
    try {
      setStatus("قياس زمن الاستجابة…");
      const pings: number[] = [];
      for (let i = 0; i < 4; i++) {
        const t0 = performance.now();
        const res = await fetch(`/api/speed-test?ping=1&n=${i}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("فشل قياس الاستجابة");
        await res.json();
        pings.push(performance.now() - t0);
      }
      pings.sort((a, b) => a - b);
      setPing(Math.round(pings[1] ?? pings[0] ?? 0));

      setStatus("قياس سرعة التنزيل…");
      const downBytes = 4 * 1024 * 1024;
      const t1 = performance.now();
      const dRes = await fetch(`/api/speed-test?bytes=${downBytes}`, {
        cache: "no-store",
      });
      if (!dRes.ok) throw new Error("فشل قياس التنزيل");
      const buf = await dRes.arrayBuffer();
      const dt = (performance.now() - t1) / 1000;
      setDown(Number(((buf.byteLength * 8) / dt / 1_000_000).toFixed(1)));

      setStatus("قياس سرعة الرفع…");
      const upBytes = 1 * 1024 * 1024;
      const payload = new Uint8Array(upBytes);
      crypto.getRandomValues(payload);
      const t2 = performance.now();
      const uRes = await fetch("/api/speed-test", {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/octet-stream" },
        cache: "no-store",
      });
      if (!uRes.ok) throw new Error("فشل قياس الرفع");
      await uRes.json();
      const ut = (performance.now() - t2) / 1000;
      setUp(Number(((upBytes * 8) / ut / 1_000_000).toFixed(1)));
      setStatus("اكتمل الفحص");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل فحص السرعة");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelShell title={title} description={description}>
      <Action onClick={() => void runTest()} primary disabled={busy}>
        {busy ? "جارٍ الفحص…" : "ابدأ فحص السرعة"}
      </Action>
      {status ? <p className="text-xs text-[#666]">{status}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="الاستجابة (Ping)" value={ping != null ? `${ping} ms` : "—"} />
        <Metric
          label="التنزيل"
          value={down != null ? `${down} Mbps` : "—"}
        />
        <Metric label="الرفع" value={up != null ? `${up} Mbps` : "—"} />
      </div>
      <p className="text-[11px] leading-5 text-[#888]">
        القياس يتم عبر خوادم Tool2Day ويعكس سرعة اتصالك بالموقع — قد يختلف عن
        اختبارات مزوّد الإنترنت العامة.
      </p>
    </PanelShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#eee] bg-[#fafafa] px-4 py-5 text-center">
      <p className="text-2xl font-bold text-[#111]">{value}</p>
      <p className="mt-1 text-xs text-[#777]">{label}</p>
    </div>
  );
}

function Action({
  children,
  onClick,
  primary,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md px-3 py-2 text-xs font-bold disabled:opacity-50 ${
        primary
          ? "bg-[#111] text-white hover:bg-[#333]"
          : "border border-[#ddd] bg-white text-[#333] hover:bg-[#f5f5f5]"
      }`}
    >
      {children}
    </button>
  );
}
