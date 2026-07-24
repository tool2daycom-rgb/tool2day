"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocale } from "@/components/locale-provider";
import { beginToolUse, setDownloadRatingContext } from "@/lib/ratings";
import {
  buildCssGradient,
  cmykToRgb,
  extractPaletteFromImage,
  formatsFromRgb,
  hslToRgb,
  parseHex,
  type ColorFormats,
  type GradientStop,
  type Rgb,
} from "@/lib/processors/color-tools";

export type ColorToolKind =
  | "color-converter"
  | "color-palette-extractor"
  | "css-gradient-generator";

type Props = {
  kind: ColorToolKind;
  slug: string;
  title: string;
  description: string;
};

const field =
  "mt-1 block w-full rounded-md border border-[#ddd] bg-white px-3 py-2 text-sm font-semibold text-[#222]";
const btnPrimary =
  "inline-flex items-center justify-center rounded-md bg-[#111] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#333] disabled:opacity-50";
const btnGhost =
  "inline-flex items-center justify-center rounded-md border border-[#ddd] bg-white px-3 py-2 text-sm font-bold text-[#333] hover:bg-[#f5f5f5]";

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
      {description ? (
        <p className="mt-1 text-sm leading-7 text-[#666]">{description}</p>
      ) : null}
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export function ColorToolsWorkspace({ kind, slug, title, description }: Props) {
  useEffect(() => {
    setDownloadRatingContext(slug);
    return () => setDownloadRatingContext(null);
  }, [slug]);

  if (kind === "color-converter") {
    return <ConverterPanel slug={slug} title={title} description={description} />;
  }
  if (kind === "color-palette-extractor") {
    return <PalettePanel slug={slug} title={title} description={description} />;
  }
  return <GradientPanel slug={slug} title={title} description={description} />;
}

function ConverterPanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [rgb, setRgb] = useState<Rgb>({ r: 37, g: 99, b: 235 });
  const fmt = useMemo(() => formatsFromRgb(rgb), [rgb]);
  const [hexInput, setHexInput] = useState(fmt.hex);
  const [copied, setCopied] = useState<string | null>(null);

  function applyRgb(next: Rgb) {
    setRgb(next);
    setHexInput(formatsFromRgb(next).hex);
  }

  async function copy(label: string, value: string) {
    beginToolUse(slug);
    await copyText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1200);
  }

  const rows: { label: string; value: string }[] = [
    { label: "HEX", value: fmt.hex },
    { label: "RGB", value: fmt.cssRgb },
    { label: "HSL", value: fmt.cssHsl },
    {
      label: "CMYK",
      value: `cmyk(${fmt.cmyk.c}%, ${fmt.cmyk.m}%, ${fmt.cmyk.y}%, ${fmt.cmyk.k}%)`,
    },
  ];

  return (
    <Shell title={title} description={description}>
      <div className="flex flex-wrap items-center gap-4">
        <label className="text-xs font-bold text-[#444]">
          اختر لوناً
          <input
            type="color"
            className="mt-1 block h-12 w-20 cursor-pointer rounded border border-[#ddd] bg-white p-1"
            value={fmt.hex}
            onChange={(e) => {
              const p = parseHex(e.target.value);
              if (p) applyRgb(p);
            }}
          />
        </label>
        <div
          className="h-16 flex-1 rounded-xl border border-[#eee] shadow-inner"
          style={{ background: fmt.hex }}
        />
      </div>

      <label className="block text-xs font-bold text-[#444]">
        HEX
        <input
          className={field}
          dir="ltr"
          value={hexInput}
          onChange={(e) => {
            setHexInput(e.target.value);
            const p = parseHex(e.target.value);
            if (p) setRgb(p);
          }}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        {(["r", "g", "b"] as const).map((k) => (
          <label key={k} className="block text-xs font-bold uppercase text-[#444]">
            {k}
            <input
              type="number"
              min={0}
              max={255}
              className={field}
              value={rgb[k]}
              onChange={(e) =>
                applyRgb({
                  ...rgb,
                  [k]: Math.min(255, Math.max(0, Number(e.target.value) || 0)),
                })
              }
            />
          </label>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            ["h", 360],
            ["s", 100],
            ["l", 100],
          ] as const
        ).map(([k, max]) => (
          <label key={k} className="block text-xs font-bold uppercase text-[#444]">
            HSL · {k}
            <input
              type="number"
              min={0}
              max={max}
              step={k === "h" ? 1 : 0.1}
              className={field}
              value={fmt.hsl[k]}
              onChange={(e) =>
                applyRgb(
                  hslToRgb({
                    ...fmt.hsl,
                    [k]: Number(e.target.value) || 0,
                  }),
                )
              }
            />
          </label>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {(
          [
            ["c", "C"],
            ["m", "M"],
            ["y", "Y"],
            ["k", "K"],
          ] as const
        ).map(([k, label]) => (
          <label key={k} className="block text-xs font-bold text-[#444]">
            CMYK · {label}
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              className={field}
              value={fmt.cmyk[k]}
              onChange={(e) =>
                applyRgb(
                  cmykToRgb({
                    ...fmt.cmyk,
                    [k]: Number(e.target.value) || 0,
                  }),
                )
              }
            />
          </label>
        ))}
      </div>

      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between gap-3 rounded-lg border border-[#eee] bg-[#fafafa] px-3 py-2"
          >
            <div dir="ltr" className="min-w-0">
              <div className="text-[11px] font-bold text-[#888]">{row.label}</div>
              <code className="text-sm font-semibold text-[#111]">{row.value}</code>
            </div>
            <button
              type="button"
              className={btnGhost}
              onClick={() => void copy(row.label, row.value)}
            >
              {copied === row.label ? "تم ✓" : "نسخ"}
            </button>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function PalettePanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const { messages } = useLocale();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [palette, setPalette] = useState<ColorFormats[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function run(f: File) {
    setBusy(true);
    setError(null);
    beginToolUse(slug);
    try {
      const colors = await extractPaletteFromImage(f, 8);
      setPalette(colors);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الاستخراج");
      setPalette([]);
    } finally {
      setBusy(false);
    }
  }

  function onPick(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    void run(f);
  }

  async function copy(label: string, value: string) {
    beginToolUse(slug);
    await copyText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1200);
  }

  return (
    <Shell title={title} description={description}>
      <div
        className="rounded-xl border-2 border-dashed border-[#c7d2fe] bg-[#f8faff] px-4 py-8 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onPick(e.dataTransfer.files);
        }}
      >
        <p className="text-sm font-bold text-[#333]">
          {messages.dragFile}
        </p>
        <label className="mt-3 inline-flex cursor-pointer rounded-md bg-[#2563eb] px-5 py-2 text-sm font-bold text-white hover:bg-[#1d4ed8]">
          {messages.chooseImage}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              onPick(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        {file ? (
          <p className="mt-2 text-xs font-semibold text-[#666]">{file.name}</p>
        ) : null}
      </div>

      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="معاينة"
          className="mx-auto max-h-56 rounded-lg object-contain"
        />
      ) : null}

      {busy ? (
        <p className="text-sm font-bold text-[#555]">جارٍ استخراج الألوان…</p>
      ) : null}
      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}

      {palette.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {palette.map((c) => (
              <button
                key={c.hex}
                type="button"
                className="overflow-hidden rounded-xl border border-[#eee] text-left transition hover:shadow-md"
                onClick={() => void copy(c.hex, c.hex)}
                title="انقر للنسخ"
              >
                <div className="h-20 w-full" style={{ background: c.hex }} />
                <div className="space-y-0.5 p-2" dir="ltr">
                  <div className="text-xs font-extrabold text-[#111]">{c.hex}</div>
                  <div className="text-[10px] font-semibold text-[#666]">
                    {c.cssRgb}
                  </div>
                  <div className="text-[10px] font-semibold text-[#666]">
                    {c.cssHsl}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button
            type="button"
            className={btnPrimary}
            onClick={() =>
              void copy(
                "all",
                palette
                  .map(
                    (c) =>
                      `${c.hex} | ${c.cssRgb} | ${c.cssHsl} | cmyk(${c.cmyk.c}%, ${c.cmyk.m}%, ${c.cmyk.y}%, ${c.cmyk.k}%)`,
                  )
                  .join("\n"),
              )
            }
          >
            {copied === "all" ? "تم نسخ اللوحة ✓" : "نسخ كل الأكواد"}
          </button>
        </>
      ) : null}
    </Shell>
  );
}

function GradientPanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [type, setType] = useState<"linear" | "radial">("linear");
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState<GradientStop[]>([
    { color: "#2563EB", pos: 0 },
    { color: "#06B6D4", pos: 50 },
    { color: "#A78BFA", pos: 100 },
  ]);
  const [copied, setCopied] = useState(false);

  const css = useMemo(
    () => buildCssGradient({ type, angle, stops }),
    [type, angle, stops],
  );
  const fullCss = `background: ${css};`;

  function updateStop(i: number, patch: Partial<GradientStop>) {
    setStops((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  return (
    <Shell title={title} description={description}>
      <div
        className="h-40 rounded-xl border border-[#eee] shadow-inner"
        style={{ background: css }}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={type === "linear" ? btnPrimary : btnGhost}
          onClick={() => setType("linear")}
        >
          Linear
        </button>
        <button
          type="button"
          className={type === "radial" ? btnPrimary : btnGhost}
          onClick={() => setType("radial")}
        >
          Radial
        </button>
      </div>

      {type === "linear" ? (
        <label className="block text-xs font-bold text-[#444]">
          الزاوية: {angle}°
          <input
            type="range"
            min={0}
            max={360}
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="mt-2 w-full"
          />
        </label>
      ) : null}

      <div className="space-y-3">
        {stops.map((s, i) => (
          <div
            key={i}
            className="flex flex-wrap items-end gap-3 rounded-lg border border-[#eee] bg-[#fafafa] p-3"
          >
            <label className="text-xs font-bold text-[#444]">
              اللون
              <input
                type="color"
                className="mt-1 block h-10 w-14 cursor-pointer rounded border border-[#ddd] bg-white p-1"
                value={parseHex(s.color) ? s.color : "#000000"}
                onChange={(e) => updateStop(i, { color: e.target.value.toUpperCase() })}
              />
            </label>
            <label className="min-w-[8rem] flex-1 text-xs font-bold text-[#444]">
              HEX
              <input
                className={field}
                dir="ltr"
                value={s.color}
                onChange={(e) => updateStop(i, { color: e.target.value })}
              />
            </label>
            <label className="min-w-[8rem] flex-1 text-xs font-bold text-[#444]">
              الموضع {s.pos}%
              <input
                type="range"
                min={0}
                max={100}
                value={s.pos}
                onChange={(e) => updateStop(i, { pos: Number(e.target.value) })}
                className="mt-2 w-full"
              />
            </label>
            {stops.length > 2 ? (
              <button
                type="button"
                className={btnGhost}
                onClick={() => setStops((prev) => prev.filter((_, j) => j !== i))}
              >
                حذف
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <button
        type="button"
        className={btnGhost}
        disabled={stops.length >= 6}
        onClick={() =>
          setStops((prev) => [
            ...prev,
            { color: "#F59E0B", pos: Math.min(100, (prev.at(-1)?.pos ?? 50) + 10) },
          ])
        }
      >
        + إضافة لون
      </button>

      <pre
        className="overflow-x-auto rounded-lg border border-[#eee] bg-[#0a0a0a] p-4 text-xs text-[#e5e5e5]"
        dir="ltr"
      >
        {fullCss}
      </pre>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btnPrimary}
          onClick={() => {
            beginToolUse(slug);
            void copyText(fullCss).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            });
          }}
        >
          {copied ? "تم النسخ ✓" : "نسخ CSS"}
        </button>
        <button
          type="button"
          className={btnGhost}
          onClick={() => {
            beginToolUse(slug);
            void copyText(css);
          }}
        >
          نسخ التدرج فقط
        </button>
      </div>
    </Shell>
  );
}
