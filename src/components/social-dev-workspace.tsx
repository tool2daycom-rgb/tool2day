"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { beginToolUse, setDownloadRatingContext } from "@/lib/ratings";
import {
  contentIdeasToSeoText,
  decodeHtml,
  encodeHtml,
  extractYoutubeId,
  formatJson,
  generateHashtags,
  generateVideoContentIdeas,
  looksLikeInstagram,
  minifyJson,
  youtubeThumbnailUrls,
  type SocialPlatform,
} from "@/lib/processors/social-dev-tools";

export type SocialDevKind =
  | "thumbnail-downloader"
  | "hashtag-generator"
  | "code-formatter"
  | "video-content-ideas";

type Props = {
  kind: SocialDevKind;
  slug: string;
  title: string;
  description: string;
};

const field =
  "mt-1 block w-full rounded-md border border-[#ddd] bg-white px-3 py-2 text-sm font-semibold text-[#222]";
const btnPrimary =
  "inline-flex items-center justify-center rounded-md bg-[#111] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#333] disabled:cursor-not-allowed disabled:bg-[#bbb]";
const btnGhost =
  "inline-flex items-center justify-center rounded-md border border-[#ddd] bg-white px-3 py-2 text-sm font-bold text-[#333] transition hover:bg-[#f5f5f5]";

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

export function SocialDevWorkspace({ kind, slug, title, description }: Props) {
  useEffect(() => {
    setDownloadRatingContext(slug);
    return () => setDownloadRatingContext(null);
  }, [slug]);

  if (kind === "thumbnail-downloader") {
    return (
      <ThumbnailPanel slug={slug} title={title} description={description} />
    );
  }
  if (kind === "hashtag-generator") {
    return (
      <HashtagPanel slug={slug} title={title} description={description} />
    );
  }
  if (kind === "code-formatter") {
    return <CodePanel slug={slug} title={title} description={description} />;
  }
  return <IdeasPanel slug={slug} title={title} description={description} />;
}

function ThumbnailPanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<
    { label: string; url: string; title?: string }[]
  >([]);

  async function run() {
    setBusy(true);
    setError(null);
    setItems([]);
    beginToolUse(slug);
    try {
      const yt = extractYoutubeId(url);
      if (yt) {
        setItems(youtubeThumbnailUrls(yt));
        return;
      }
      if (looksLikeInstagram(url) || url.trim()) {
        const res = await fetch("/api/thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = (await res.json()) as {
          thumbnail?: string;
          title?: string;
          error?: string;
        };
        if (!res.ok || !data.thumbnail) {
          throw new Error(data.error || "فشل استخراج الصورة");
        }
        setItems([
          {
            label: data.title || "الصورة المصغّرة",
            url: data.thumbnail,
            title: data.title,
          },
        ]);
        return;
      }
      throw new Error("الصق رابط يوتيوب أو انستغرام");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل");
    } finally {
      setBusy(false);
    }
  }

  async function downloadImage(src: string, name: string) {
    beginToolUse(slug);
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const { downloadBlob } = await import("@/lib/processors/ffmpeg-client");
      const ext = blob.type.includes("png")
        ? "png"
        : blob.type.includes("webp")
          ? "webp"
          : "jpg";
      await downloadBlob(blob, `${name}.${ext}`);
    } catch {
      window.open(src, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <Shell title={title} description={description}>
      <label className="block text-xs font-bold text-[#444]">
        رابط يوتيوب أو انستغرام
        <input
          className={field}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=… أو منشور انستغرام"
          dir="ltr"
        />
      </label>
      <button
        type="button"
        className={btnPrimary}
        disabled={busy || !url.trim()}
        onClick={() => void run()}
      >
        {busy ? "جارٍ الاستخراج…" : "استخرج الصور المصغّرة"}
      </button>
      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
      {items.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.url}
              className="overflow-hidden rounded-xl border border-[#eee] bg-[#fafafa]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.label}
                className="aspect-video w-full object-cover bg-[#eee]"
              />
              <div className="flex items-center justify-between gap-2 p-3">
                <span className="text-xs font-bold text-[#444]">{item.label}</span>
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() =>
                    void downloadImage(item.url, `thumbnail-${Date.now()}`)
                  }
                >
                  تنزيل
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </Shell>
  );
}

function HashtagPanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [topic, setTopic] = useState("تطوير الويب");
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [copied, setCopied] = useState(false);

  const tags = useMemo(
    () => generateHashtags(topic, platform, 36),
    [topic, platform],
  );
  const flat = tags.map((t) => t.tag).join(" ");

  return (
    <Shell title={title} description={description}>
      <label className="block text-xs font-bold text-[#444]">
        الموضوع / الكلمة المفتاحية
        <input
          className={field}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="مثال: الربح من الإنترنت"
        />
      </label>
      <label className="block text-xs font-bold text-[#444]">
        المنصة
        <select
          className={field}
          value={platform}
          onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
        >
          <option value="instagram">انستغرام</option>
          <option value="tiktok">تيك توك</option>
          <option value="youtube">يوتيوب</option>
          <option value="x">إكس (تويتر)</option>
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btnPrimary}
          onClick={() => {
            beginToolUse(slug);
            void copyText(flat).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          {copied ? "تم النسخ ✓" : "نسخ كل الهاشتاغات"}
        </button>
        <button
          type="button"
          className={btnGhost}
          onClick={() => void downloadTxt(slug, flat, "hashtags-tool2day.txt")}
        >
          تنزيل نص
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <button
            key={t.tag}
            type="button"
            title={t.group}
            className="rounded-full border border-[#ddd] bg-[#f8f8f8] px-3 py-1 text-xs font-bold text-[#2563eb] hover:border-[#2563eb]"
            onClick={() => void copyText(t.tag)}
          >
            {t.tag}
          </button>
        ))}
      </div>
      <p className="text-[11px] font-semibold text-[#888]">
        اضغط هاشتاغاً لنسخه منفرداً. المجموعات: أساسي · تريند · منصة · عربي
      </p>
    </Shell>
  );
}

function CodePanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [tab, setTab] = useState<"json" | "html">("json");
  const [input, setInput] = useState('{\n  "hello": "tool2day",\n  "ok": true\n}');
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  function runJson(mode: "pretty" | "minify") {
    setError(null);
    beginToolUse(slug);
    try {
      setOutput(mode === "pretty" ? formatJson(input, true) : minifyJson(input));
    } catch (e) {
      setError(e instanceof Error ? e.message : "JSON غير صالح");
      setOutput("");
    }
  }

  function runHtml(mode: "encode" | "decode") {
    setError(null);
    beginToolUse(slug);
    setOutput(mode === "encode" ? encodeHtml(input) : decodeHtml(input));
  }

  return (
    <Shell title={title} description={description}>
      <div className="flex gap-2">
        <button
          type="button"
          className={tab === "json" ? btnPrimary : btnGhost}
          onClick={() => {
            setTab("json");
            setError(null);
            setOutput("");
            setInput('{\n  "hello": "tool2day",\n  "ok": true\n}');
          }}
        >
          JSON Formatter
        </button>
        <button
          type="button"
          className={tab === "html" ? btnPrimary : btnGhost}
          onClick={() => {
            setTab("html");
            setError(null);
            setOutput("");
            setInput('<div class="box">مرحبا</div>');
          }}
        >
          HTML Encoder
        </button>
      </div>
      <label className="block text-xs font-bold text-[#444]">
        الإدخال
        <textarea
          className={`${field} min-h-40 font-mono text-xs`}
          dir="ltr"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {tab === "json" ? (
          <>
            <button type="button" className={btnPrimary} onClick={() => runJson("pretty")}>
              تنسيق JSON
            </button>
            <button type="button" className={btnGhost} onClick={() => runJson("minify")}>
              تصغير (Minify)
            </button>
          </>
        ) : (
          <>
            <button type="button" className={btnPrimary} onClick={() => runHtml("encode")}>
              ترميز HTML
            </button>
            <button type="button" className={btnGhost} onClick={() => runHtml("decode")}>
              فك الترميز
            </button>
          </>
        )}
        {output ? (
          <>
            <button
              type="button"
              className={btnGhost}
              onClick={() => void copyText(output)}
            >
              نسخ الناتج
            </button>
            <button
              type="button"
              className={btnGhost}
              onClick={() =>
                void downloadTxt(
                  slug,
                  output,
                  tab === "json" ? "formatted.json" : "encoded.txt",
                )
              }
            >
              تنزيل
            </button>
          </>
        ) : null}
      </div>
      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
      {output ? (
        <pre
          className="max-h-96 overflow-auto rounded-lg border border-[#eee] bg-[#0a0a0a] p-4 text-xs text-[#e5e5e5]"
          dir="ltr"
        >
          {output}
        </pre>
      ) : null}
    </Shell>
  );
}

function IdeasPanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [topic, setTopic] = useState("تطوير الويب");
  const [openLetter, setOpenLetter] = useState<string | null>("أ");
  const ideas = useMemo(() => generateVideoContentIdeas(topic), [topic]);
  const seoText = useMemo(() => contentIdeasToSeoText(ideas), [ideas]);

  return (
    <Shell title={title} description={description}>
      <label className="block text-xs font-bold text-[#444]">
        الكلمة المفتاحية / الموضوع
        <input
          className={field}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder='مثال: "الربح من الإنترنت" أو "تطوير الويب"'
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btnPrimary}
          onClick={() => {
            beginToolUse(slug);
            void copyText(seoText);
          }}
        >
          نسخ كل الأفكار (نص SEO)
        </button>
        <button
          type="button"
          className={btnGhost}
          onClick={() =>
            void downloadTxt(slug, seoText, `video-ideas-${Date.now()}.txt`)
          }
        >
          تنزيل ملف نصي
        </button>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-extrabold text-[#111]">
          الأسئلة (ماذا · كيف · لماذا · أين · متى)
        </h3>
        <ul className="space-y-1.5 rounded-lg border border-[#eee] bg-[#fafafa] p-3 text-sm font-semibold text-[#333]">
          {ideas.questions.map((q) => (
            <li key={q} className="flex items-start justify-between gap-2">
              <span>{q}</span>
              <button
                type="button"
                className="shrink-0 text-xs font-bold text-[#2563eb]"
                onClick={() => void copyText(q)}
              >
                نسخ
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-extrabold text-[#111]">
          حروف الجر والمقارنات
        </h3>
        <ul className="space-y-1.5 rounded-lg border border-[#eee] bg-[#fafafa] p-3 text-sm font-semibold text-[#333]">
          {ideas.comparisons.map((c) => (
            <li key={c} className="flex items-start justify-between gap-2">
              <span>{c}</span>
              <button
                type="button"
                className="shrink-0 text-xs font-bold text-[#2563eb]"
                onClick={() => void copyText(c)}
              >
                نسخ
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-extrabold text-[#111]">
          عناوين جاهزة للفيديوهات
        </h3>
        <ul className="space-y-1.5 rounded-lg border border-[#eee] bg-[#fafafa] p-3 text-sm font-semibold text-[#333]">
          {ideas.titles.map((t) => (
            <li key={t} className="flex items-start justify-between gap-2">
              <span>{t}</span>
              <button
                type="button"
                className="shrink-0 text-xs font-bold text-[#2563eb]"
                onClick={() => void copyText(t)}
              >
                نسخ
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-extrabold text-[#111]">
          الأبجدية — أفكار لا تنتهي
        </h3>
        <div className="mb-3 flex flex-wrap gap-1">
          {ideas.alphabetical.slice(0, 35).map((b) => (
            <button
              key={b.letter}
              type="button"
              onClick={() =>
                setOpenLetter((cur) => (cur === b.letter ? null : b.letter))
              }
              className={`min-w-8 rounded-md px-2 py-1 text-xs font-extrabold ${
                openLetter === b.letter
                  ? "bg-[#111] text-white"
                  : "border border-[#ddd] bg-white text-[#333]"
              }`}
            >
              {b.letter}
            </button>
          ))}
        </div>
        {openLetter
          ? ideas.alphabetical
              .filter((b) => b.letter === openLetter)
              .map((b) => (
                <ul
                  key={b.letter}
                  className="space-y-1.5 rounded-lg border border-[#eee] bg-[#fafafa] p-3 text-sm font-semibold text-[#333]"
                >
                  {b.ideas.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              ))
          : null}
      </section>

      {/* نص غني بالكلمات المفتاحية لأرشفة أفضل عند مشاركة/فهرسة الصفحة */}
      <details className="rounded-lg border border-[#eee] bg-white p-3">
        <summary className="cursor-pointer text-sm font-extrabold text-[#111]">
          عرض نص SEO الكامل للفهرسة والنسخ
        </summary>
        <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs leading-6 text-[#444]">
          {seoText}
        </pre>
      </details>
    </Shell>
  );
}
