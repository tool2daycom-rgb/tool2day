"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { beginToolUse, setDownloadRatingContext } from "@/lib/ratings";
import {
  buildCvPlainText,
  CV_TEMPLATES,
  cvLabels,
  emptyCv,
  emptyEducation,
  emptyExperience,
  hardenCloneColors,
  MARITAL_OPTIONS_AR,
  MARITAL_OPTIONS_EN,
  toggleLanguageLine,
  WORLD_LANGUAGES,
  type CvData,
  type CvLang,
  type CvTemplateId,
} from "@/lib/processors/cv-builder";
import { CvTemplateView } from "@/components/cv-templates";

type Props = {
  slug: string;
  title: string;
  description: string;
};

const field =
  "w-full rounded-md border border-[#ddd] bg-white px-3 py-2 text-sm text-[#222] outline-none focus:border-[#2563eb]";

export function CvBuilderWorkspace({ slug, title, description }: Props) {
  const previewRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<CvData>(emptyCv);
  const [lang, setLang] = useState<CvLang>("ar");
  const [template, setTemplate] = useState<CvTemplateId>("navy-sidebar");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const L = cvLabels(lang);

  useEffect(() => {
    setDownloadRatingContext(slug);
    return () => setDownloadRatingContext(null);
  }, [slug]);

  function patch<K extends keyof CvData>(key: K, value: CvData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function onPhoto(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(lang === "ar" ? "اختر صورة فقط" : "Choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(lang === "ar" ? "الصورة أكبر من 5MB" : "Image larger than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      patch("photoDataUrl", String(reader.result || ""));
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  async function downloadPdf() {
    beginToolUse(slug);
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const el = previewRef.current;
      if (!el) throw new Error("لا توجد معاينة");
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        foreignObjectRendering: false,
        onclone: (_doc, cloned) => {
          hardenCloneColors(el, cloned as HTMLElement);
        },
      });
      const img = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      pdf.addImage(img, "JPEG", (pageW - w) / 2, 0, w, h);
      const blob = pdf.output("blob");
      const { downloadBlob } = await import("@/lib/processors/ffmpeg-client");
      const name = `${data.fullName.trim() || "cv"}-tool2day.pdf`;
      await downloadBlob(blob, name);
      setNote(lang === "ar" ? "تم تنزيل PDF" : "PDF downloaded");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل التنزيل");
    } finally {
      setBusy(false);
    }
  }

  async function downloadTxt() {
    beginToolUse(slug);
    const { downloadBlob } = await import("@/lib/processors/ffmpeg-client");
    await downloadBlob(
      new Blob([buildCvPlainText(data, lang)], {
        type: "text/plain;charset=utf-8",
      }),
      `${data.fullName.trim() || "cv"}-tool2day.txt`,
    );
    setNote(lang === "ar" ? "تم تنزيل TXT" : "TXT downloaded");
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#e8e8e8] bg-white p-5 shadow-sm sm:p-6">
        <p className="text-lg font-semibold text-[#111]">{title}</p>
        <p className="mt-1 text-sm leading-7 text-[#666]">{description}</p>
        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-950">
          املأ المستطيلات، ارفع صورتك، اختر القالب واللغة — المعاينة تتحدث مباشرة
          ثم نزّل PDF أو TXT.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-[#555]">
            {L.template}
            <select
              className={`${field} mt-1`}
              value={template}
              onChange={(e) => setTemplate(e.target.value as CvTemplateId)}
            >
              {CV_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {lang === "ar" ? t.labelAr : t.labelEn}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#555]">
            {L.language}
            <select
              className={`${field} mt-1`}
              value={lang}
              onChange={(e) => setLang(e.target.value as CvLang)}
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>

        <label className="mt-4 block text-xs font-semibold text-[#555]">
          {L.photo}
          <div className="mt-1 flex flex-wrap items-center gap-3">
            {data.photoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.photoDataUrl}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eee] text-[10px] text-[#888]">
                —
              </div>
            )}
            <button
              type="button"
              className="rounded-md border border-[#ddd] bg-white px-3 py-2 text-xs font-bold"
              onClick={() => photoRef.current?.click()}
            >
              {lang === "ar" ? "رفع صورة" : "Upload photo"}
            </button>
            {data.photoDataUrl ? (
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={() => patch("photoDataUrl", "")}
              >
                {lang === "ar" ? "إزالة" : "Remove"}
              </button>
            ) : null}
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPhoto(e.target.files?.[0] || null)}
            />
          </div>
        </label>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(
            [
              ["fullName", L.fullName],
              ["title", L.title],
              ["email", L.email],
              ["phone", L.phone],
              ["phone2", L.phone2],
              ["address", L.address],
              ["city", L.city],
              ["website", L.website],
              ["age", L.age],
              ["children", L.children],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-xs font-semibold text-[#555]">
              {label}
              <input
                className={`${field} mt-1`}
                value={data[key]}
                onChange={(e) => patch(key, e.target.value)}
              />
            </label>
          ))}
          <label className="block text-xs font-semibold text-[#555]">
            {L.maritalStatus}
            <select
              className={`${field} mt-1`}
              value={data.maritalStatus}
              onChange={(e) => patch("maritalStatus", e.target.value)}
            >
              {(lang === "ar" ? MARITAL_OPTIONS_AR : MARITAL_OPTIONS_EN).map(
                (opt) => (
                  <option key={opt || "_"} value={opt}>
                    {opt || (lang === "ar" ? "— اختر —" : "— Select —")}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>

        <label className="mt-3 block text-xs font-semibold text-[#555]">
          {L.summary}
          <textarea
            className={`${field} mt-1 min-h-24`}
            value={data.summary}
            onChange={(e) => patch("summary", e.target.value)}
          />
        </label>

        <SectionTitle>{L.experience}</SectionTitle>
        {data.experience.map((exp, idx) => (
          <div
            key={idx}
            className="mb-3 space-y-2 rounded-lg border border-[#eee] bg-[#fafafa] p-3"
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["role", L.role],
                  ["company", L.company],
                  ["location", L.location],
                  ["start", L.start],
                  ["end", L.end],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="block text-[11px] font-semibold text-[#666]"
                >
                  {label}
                  <input
                    className={`${field} mt-1`}
                    value={exp[key]}
                    onChange={(e) => {
                      const next = [...data.experience];
                      next[idx] = { ...exp, [key]: e.target.value };
                      patch("experience", next);
                    }}
                  />
                </label>
              ))}
            </div>
            <label className="block text-[11px] font-semibold text-[#666]">
              {L.details}
              <textarea
                className={`${field} mt-1 min-h-20`}
                value={exp.details}
                onChange={(e) => {
                  const next = [...data.experience];
                  next[idx] = { ...exp, details: e.target.value };
                  patch("experience", next);
                }}
              />
            </label>
          </div>
        ))}
        <button
          type="button"
          className="text-xs font-bold text-[#2563eb]"
          onClick={() =>
            patch("experience", [...data.experience, emptyExperience()])
          }
        >
          + {L.addExperience}
        </button>

        <SectionTitle>{L.education}</SectionTitle>
        {data.education.map((edu, idx) => (
          <div
            key={idx}
            className="mb-3 space-y-2 rounded-lg border border-[#eee] bg-[#fafafa] p-3"
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["degree", L.degree],
                  ["school", L.school],
                  ["location", L.location],
                  ["start", L.start],
                  ["end", L.end],
                  ["note", L.note],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="block text-[11px] font-semibold text-[#666]"
                >
                  {label}
                  <input
                    className={`${field} mt-1`}
                    value={edu[key]}
                    onChange={(e) => {
                      const next = [...data.education];
                      next[idx] = { ...edu, [key]: e.target.value };
                      patch("education", next);
                    }}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
        <button
          type="button"
          className="text-xs font-bold text-[#2563eb]"
          onClick={() =>
            patch("education", [...data.education, emptyEducation()])
          }
        >
          + {L.addEducation}
        </button>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-[#555]">
            {L.skills}
            <textarea
              className={`${field} mt-1 min-h-24`}
              value={data.skills}
              onChange={(e) => patch("skills", e.target.value)}
              placeholder={lang === "ar" ? "سطر لكل مهارة" : "One skill per line"}
            />
          </label>
          <label className="block text-xs font-semibold text-[#555]">
            {L.languages}
            <textarea
              className={`${field} mt-1 min-h-24`}
              value={data.languages}
              onChange={(e) => patch("languages", e.target.value)}
              placeholder={
                lang === "ar" ? "العربية\nEnglish (B2)" : "Arabic\nEnglish (B2)"
              }
            />
            <p className="mt-2 text-[11px] font-semibold text-[#777]">
              {L.pickLanguages}
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {WORLD_LANGUAGES.map((w) => {
                const active = data.languages
                  .split(/\r?\n/)
                  .some(
                    (l) =>
                      l.trim() === w ||
                      l.trim().startsWith(`${w} `) ||
                      l.trim().startsWith(`${w}(`),
                  );
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() =>
                      patch("languages", toggleLanguageLine(data.languages, w))
                    }
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                      active
                        ? "border-[#111] bg-[#111] text-white"
                        : "border-[#ddd] bg-white text-[#444] hover:bg-[#f5f5f5]"
                    }`}
                  >
                    {w}
                  </button>
                );
              })}
            </div>
          </label>
          <label className="block text-xs font-semibold text-[#555]">
            {L.hobbies}
            <textarea
              className={`${field} mt-1 min-h-20`}
              value={data.hobbies}
              onChange={(e) => patch("hobbies", e.target.value)}
            />
          </label>
          <label className="block text-xs font-semibold text-[#555]">
            {L.courses}
            <textarea
              className={`${field} mt-1 min-h-20`}
              value={data.courses}
              onChange={(e) => patch("courses", e.target.value)}
            />
          </label>
        </div>

        <SectionTitle>{L.hardSkills}</SectionTitle>
        {data.hardSkills.map((s, idx) => (
          <div key={idx} className="mb-2 flex flex-wrap items-center gap-2">
            <input
              className={`${field} max-w-xs`}
              value={s.name}
              placeholder={L.hardSkills}
              onChange={(e) => {
                const next = [...data.hardSkills];
                next[idx] = { ...s, name: e.target.value };
                patch("hardSkills", next);
              }}
            />
            <label className="text-[11px] text-[#666]">
              {L.level}: {s.level}
              <input
                type="range"
                min={1}
                max={5}
                value={s.level}
                className="ms-2 align-middle"
                onChange={(e) => {
                  const next = [...data.hardSkills];
                  next[idx] = { ...s, level: Number(e.target.value) };
                  patch("hardSkills", next);
                }}
              />
            </label>
          </div>
        ))}
        <button
          type="button"
          className="text-xs font-bold text-[#2563eb]"
          onClick={() =>
            patch("hardSkills", [...data.hardSkills, { name: "", level: 4 }])
          }
        >
          + {L.addSkill}
        </button>

        <SectionTitle>{L.softSkills}</SectionTitle>
        {data.softSkills.map((s, idx) => (
          <div key={idx} className="mb-2 flex flex-wrap items-center gap-2">
            <input
              className={`${field} max-w-xs`}
              value={s.name}
              placeholder={L.softSkills}
              onChange={(e) => {
                const next = [...data.softSkills];
                next[idx] = { ...s, name: e.target.value };
                patch("softSkills", next);
              }}
            />
            <label className="text-[11px] text-[#666]">
              {L.level}: {s.level}
              <input
                type="range"
                min={1}
                max={5}
                value={s.level}
                className="ms-2 align-middle"
                onChange={(e) => {
                  const next = [...data.softSkills];
                  next[idx] = { ...s, level: Number(e.target.value) };
                  patch("softSkills", next);
                }}
              />
            </label>
          </div>
        ))}
        <button
          type="button"
          className="text-xs font-bold text-[#2563eb]"
          onClick={() =>
            patch("softSkills", [...data.softSkills, { name: "", level: 4 }])
          }
        >
          + {L.addSkill}
        </button>

        <label className="mt-4 block text-xs font-semibold text-[#555]">
          {L.certificates}
          <textarea
            className={`${field} mt-1 min-h-20`}
            value={data.certificates}
            onChange={(e) => patch("certificates", e.target.value)}
          />
        </label>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void downloadPdf()}
            className="rounded-md bg-[#111] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {busy ? "…" : L.downloadPdf}
          </button>
          <button
            type="button"
            onClick={() => void downloadTxt()}
            className="rounded-md border border-[#ddd] bg-white px-4 py-2.5 text-xs font-bold"
          >
            {L.downloadTxt}
          </button>
        </div>
        {note ? <p className="mt-2 text-xs text-emerald-700">{note}</p> : null}
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="rounded-2xl border border-[#e8e8e8] bg-[#f3f4f6] p-4 shadow-sm sm:p-6">
        <p className="mb-3 text-sm font-bold text-[#333]">{L.preview}</p>
        <div className="mx-auto max-w-[794px] overflow-auto rounded bg-white shadow">
          <div ref={previewRef} className="w-[794px] origin-top">
            <CvTemplateView data={data} lang={lang} template={template} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-5 mb-2 flex items-center gap-2 border-b border-[#eee] pb-1 text-base font-extrabold text-[#111]">
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#111]" />
      {children}
    </h3>
  );
}
