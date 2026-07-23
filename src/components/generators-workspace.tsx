"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { beginToolUse, setDownloadRatingContext } from "@/lib/ratings";
import { generateAllFancy } from "@/lib/processors/fancy-text";
import {
  buildEmail,
  emailKinds,
  type EmailFields,
  type EmailKind,
} from "@/lib/processors/email-templates";
import {
  buildCss,
  cssPresets,
  type CssOptions,
  type CssPreset,
} from "@/lib/processors/css-generator";
import { CvBuilderWorkspace } from "@/components/cv-builder-workspace";

export type GeneratorKind =
  | "cv-builder"
  | "fancy-text"
  | "email-generator"
  | "css-generator";

type Props = {
  kind: GeneratorKind;
  slug: string;
  title: string;
  description: string;
};

const field =
  "w-full rounded-md border border-[#ddd] bg-white px-3 py-2 text-sm text-[#222] outline-none focus:border-[#2563eb]";

export function GeneratorsWorkspace({ kind, slug, title, description }: Props) {
  useEffect(() => {
    setDownloadRatingContext(slug);
    return () => setDownloadRatingContext(null);
  }, [slug]);

  if (kind === "cv-builder") {
    return (
      <CvBuilderWorkspace slug={slug} title={title} description={description} />
    );
  }
  if (kind === "fancy-text") {
    return <FancyPanel slug={slug} title={title} description={description} />;
  }
  if (kind === "email-generator") {
    return <EmailPanel slug={slug} title={title} description={description} />;
  }
  return <CssPanel slug={slug} title={title} description={description} />;
}

function Shell({
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

function Btn({
  children,
  onClick,
  primary,
}: {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-2 text-xs font-bold ${
        primary
          ? "bg-[#111] text-white hover:bg-[#333]"
          : "border border-[#ddd] bg-white text-[#333] hover:bg-[#f5f5f5]"
      }`}
    >
      {children}
    </button>
  );
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

async function downloadTxt(slug: string, text: string, name: string) {
  beginToolUse(slug);
  const { downloadBlob } = await import("@/lib/processors/ffmpeg-client");
  await downloadBlob(
    new Blob([text], { type: "text/plain;charset=utf-8" }),
    name,
  );
}

function FancyPanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [text, setText] = useState("Tool2Day");
  const [note, setNote] = useState<string | null>(null);
  const styles = useMemo(() => generateAllFancy(text), [text]);

  return (
    <Shell title={title} description={description}>
      <label className="block text-xs font-semibold text-[#555]">
        الاسم أو النص
        <input
          className={`${field} mt-1 text-base`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب اسمك أو أي نص…"
          dir="auto"
        />
      </label>
      <ul className="space-y-2">
        {styles.map((s) => (
          <li
            key={s.id}
            className="flex flex-col gap-2 rounded-lg border border-[#eee] bg-[#fafafa] p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-[11px] text-[#888]">{s.label}</p>
              <p className="mt-1 break-all text-lg leading-8 text-[#111]" dir="auto">
                {s.value}
              </p>
            </div>
            <Btn
              primary
              onClick={() => {
                beginToolUse(slug);
                void copyText(s.value).then(() => setNote(`نُسخ: ${s.label}`));
              }}
            >
              نسخ
            </Btn>
          </li>
        ))}
      </ul>
      {note ? <p className="text-xs text-emerald-700">{note}</p> : null}
    </Shell>
  );
}

function EmailPanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [fields, setFields] = useState<EmailFields>({
    kind: "job",
    senderName: "",
    recipientName: "",
    company: "",
    role: "",
    topic: "",
    extra: "",
  });
  const [note, setNote] = useState<string | null>(null);
  const mail = useMemo(() => buildEmail(fields), [fields]);

  function set<K extends keyof EmailFields>(key: K, value: EmailFields[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  return (
    <Shell title={title} description={description}>
      <label className="block text-xs font-semibold text-[#555]">
        نوع الرسالة
        <select
          className={`${field} mt-1`}
          value={fields.kind}
          onChange={(e) => set("kind", e.target.value as EmailKind)}
        >
          {emailKinds.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ["senderName", "اسمك"],
            ["recipientName", "اسم المستلم"],
            ["company", "الشركة / الجهة"],
            ["role", "المسمى / الوظيفة"],
            ["topic", "الموضوع"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-xs font-semibold text-[#555]">
            {label}
            <input
              className={`${field} mt-1`}
              value={fields[key]}
              onChange={(e) => set(key, e.target.value)}
            />
          </label>
        ))}
      </div>
      <label className="block text-xs font-semibold text-[#555]">
        تفاصيل إضافية (اختياري)
        <textarea
          className={`${field} mt-1 min-h-24`}
          value={fields.extra}
          onChange={(e) => set("extra", e.target.value)}
        />
      </label>
      <div className="rounded-lg border border-[#eee] bg-[#f7f7f7] p-4">
        <p className="text-xs font-bold text-[#888]">الموضوع</p>
        <p className="mt-1 text-sm font-semibold text-[#111]">{mail.subject}</p>
        <pre className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#222]">
          {mail.body}
        </pre>
      </div>
      <div className="flex flex-wrap gap-2">
        <Btn
          primary
          onClick={() => {
            beginToolUse(slug);
            void copyText(`الموضوع: ${mail.subject}\n\n${mail.body}`).then(() =>
              setNote("تم نسخ الرسالة"),
            );
          }}
        >
          نسخ الرسالة
        </Btn>
        <Btn
          onClick={() =>
            void downloadTxt(
              slug,
              `الموضوع: ${mail.subject}\n\n${mail.body}`,
              "email-tool2day.txt",
            ).then(() => setNote("تم التنزيل"))
          }
        >
          تنزيل TXT
        </Btn>
      </div>
      {note ? <p className="text-xs text-emerald-700">{note}</p> : null}
    </Shell>
  );
}

function CssPanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [opts, setOpts] = useState<CssOptions>({
    preset: "button",
    color: "#2563eb",
    color2: "#06b6d4",
    radius: 10,
    shadow: 12,
    text: "اضغط هنا",
  });
  const [note, setNote] = useState<string | null>(null);
  const built = useMemo(() => buildCss(opts), [opts]);

  return (
    <Shell title={title} description={description}>
      <label className="block text-xs font-semibold text-[#555]">
        النوع
        <select
          className={`${field} mt-1`}
          value={opts.preset}
          onChange={(e) =>
            setOpts((o) => ({ ...o, preset: e.target.value as CssPreset }))
          }
        >
          {cssPresets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-[#555]">
          اللون الأساسي
          <input
            type="color"
            className="mt-1 h-10 w-full cursor-pointer rounded-md border border-[#ddd]"
            value={opts.color}
            onChange={(e) => setOpts((o) => ({ ...o, color: e.target.value }))}
          />
        </label>
        <label className="block text-xs font-semibold text-[#555]">
          اللون الثاني (للتدرج)
          <input
            type="color"
            className="mt-1 h-10 w-full cursor-pointer rounded-md border border-[#ddd]"
            value={opts.color2}
            onChange={(e) => setOpts((o) => ({ ...o, color2: e.target.value }))}
          />
        </label>
        <label className="block text-xs font-semibold text-[#555]">
          الاستدارة: {opts.radius}px
          <input
            type="range"
            min={0}
            max={40}
            className="mt-2 w-full"
            value={opts.radius}
            onChange={(e) =>
              setOpts((o) => ({ ...o, radius: Number(e.target.value) }))
            }
          />
        </label>
        <label className="block text-xs font-semibold text-[#555]">
          قوة الظل: {opts.shadow}
          <input
            type="range"
            min={0}
            max={40}
            className="mt-2 w-full"
            value={opts.shadow}
            onChange={(e) =>
              setOpts((o) => ({ ...o, shadow: Number(e.target.value) }))
            }
          />
        </label>
      </div>
      {(opts.preset === "button" || opts.preset === "gradient") && (
        <label className="block text-xs font-semibold text-[#555]">
          نص المعاينة
          <input
            className={`${field} mt-1`}
            value={opts.text}
            onChange={(e) => setOpts((o) => ({ ...o, text: e.target.value }))}
          />
        </label>
      )}

      <div className="rounded-xl border border-[#eee] bg-[#f3f4f6] p-8 text-center">
        {opts.preset === "button" ? (
          <span style={{ ...parseStyle(built.previewStyle) }}>{opts.text}</span>
        ) : opts.preset === "input" ? (
          <input
            readOnly
            value="معاينة الحقل"
            style={{ ...parseStyle(built.previewStyle) }}
          />
        ) : opts.preset === "card" ? (
          <div style={{ ...parseStyle(built.previewStyle) }} className="text-start">
            <h3 style={{ color: opts.color, margin: "0 0 0.5rem" }}>عنوان البطاقة</h3>
            <p style={{ margin: 0, color: "#555" }}>{opts.text || "محتوى تجريبي"}</p>
          </div>
        ) : (
          <div style={{ ...parseStyle(built.previewStyle) }}>
            {opts.text || "معاينة"}
          </div>
        )}
      </div>

      <pre
        className="overflow-x-auto rounded-lg bg-[#111] p-4 text-[12px] leading-6 text-[#e5e5e5]"
        dir="ltr"
      >
        {built.css}
      </pre>
      <div className="flex flex-wrap gap-2">
        <Btn
          primary
          onClick={() => {
            beginToolUse(slug);
            void copyText(built.css).then(() => setNote("تم نسخ CSS"));
          }}
        >
          نسخ CSS
        </Btn>
        <Btn
          onClick={() =>
            void downloadTxt(slug, built.css, "styles-tool2day.css").then(() =>
              setNote("تم التنزيل"),
            )
          }
        >
          تنزيل ملف CSS
        </Btn>
      </div>
      {note ? <p className="text-xs text-emerald-700">{note}</p> : null}
    </Shell>
  );
}

function parseStyle(cssInline: string): CSSProperties {
  const style: Record<string, string> = {};
  for (const part of cssInline.split(";")) {
    const [k, ...rest] = part.split(":");
    if (!k || !rest.length) continue;
    const key = k.trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    style[key] = rest.join(":").trim();
  }
  return style as CSSProperties;
}
