"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  getToolKind,
  MAX_CLIENT_FILE_MB,
  type ActiveToolKind,
} from "@/lib/processors/active-tools";
import { setDownloadRatingContext, beginToolUse } from "@/lib/ratings";

type Props = {
  slug: string;
  title: string;
  description: string;
  accept: string;
};

function formatBytes(n: number) {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const multiKinds = new Set<ActiveToolKind>([
  "pdf-merge",
  "video-merge",
  "audio-join",
  "jpg-to-pdf",
  "video-add-audio",
  "video-add-image",
]);

const noFileKinds = new Set<ActiveToolKind>([
  "screen-recorder",
  "voice-recorder",
  "video-recorder",
  "tts",
]);

const sel = "block w-full rounded-md border border-[#ddd] bg-white px-3 py-2";

export function ToolWorkspace({ slug, title, description, accept }: Props) {
  const kind = useMemo(() => getToolKind(slug), [slug]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDownloadRatingContext(slug);
    return () => setDownloadRatingContext(null);
  }, [slug]);

  const [videoFormat, setVideoFormat] = useState<"mp4" | "webm" | "mov">("mp4");
  const [audioFormat, setAudioFormat] = useState<"mp3" | "wav" | "aac" | "ogg">("mp3");
  const [imageFormat, setImageFormat] = useState<"jpeg" | "png" | "webp">("jpeg");
  const [fontTarget, setFontTarget] = useState<"ttf" | "otf" | "woff">("woff");
  const [startSec, setStartSec] = useState("0");
  const [endSec, setEndSec] = useState("10");
  const [splitMode, setSplitMode] = useState<"all" | "range">("all");
  const [pageFrom, setPageFrom] = useState("1");
  const [pageTo, setPageTo] = useState("1");
  const [rotateDeg, setRotateDeg] = useState<"90" | "180" | "270">("90");
  const [flipMode, setFlipMode] = useState<"h" | "v">("h");
  const [width, setWidth] = useState("1280");
  const [speed, setSpeed] = useState("1.5");
  const [volume, setVolume] = useState("1.5");
  const [loops, setLoops] = useState("2");
  const [pitch, setPitch] = useState("2");
  const [recordSecs, setRecordSecs] = useState("10");
  const [editRotate, setEditRotate] = useState<"0" | "90" | "180" | "270">("0");
  const [overlayText, setOverlayText] = useState("Tool2Day");
  const [ttsText, setTtsText] = useState("مرحباً بك في Tool2Day");
  const [ttsVoice, setTtsVoice] = useState("ar-SA-ZariyahNeural");
  const [ttsRate, setTtsRate] = useState("default");
  const [ttsFile, setTtsFile] = useState<File | null>(null);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsUrlRef = useRef<string | null>(null);
  const [password, setPassword] = useState("");
  const [cropX, setCropX] = useState("0");
  const [cropY, setCropY] = useState("0");
  const [cropW, setCropW] = useState("640");
  const [cropH, setCropH] = useState("360");

  function clearTtsPreview() {
    ttsAudioRef.current?.pause();
    ttsAudioRef.current = null;
    if (ttsUrlRef.current) {
      URL.revokeObjectURL(ttsUrlRef.current);
      ttsUrlRef.current = null;
    }
    setTtsFile(null);
    setTtsPlaying(false);
  }

  useEffect(() => {
    clearTtsPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsText, ttsVoice, ttsRate]);

  useEffect(() => {
    return () => {
      ttsAudioRef.current?.pause();
      if (ttsUrlRef.current) URL.revokeObjectURL(ttsUrlRef.current);
    };
  }, []);

  const multiple = multiKinds.has(kind);

  async function ensureTtsFile(): Promise<File> {
    if (ttsFile) return ttsFile;
    const { synthesizeToFile } = await import("@/lib/processors/tts");
    const file = await synthesizeToFile(ttsText, {
      voice: ttsVoice,
      rate: ttsRate,
    });
    setTtsFile(file);
    return file;
  }

  async function playTts() {
    beginToolUse(slug);
    setBusy(true);
    setError(null);
    setProgress(20);
    setStatus("جارٍ توليد الصوت للمعاينة…");
    try {
      const file = await ensureTtsFile();
      setProgress(70);
      ttsAudioRef.current?.pause();
      if (ttsUrlRef.current) URL.revokeObjectURL(ttsUrlRef.current);
      const url = URL.createObjectURL(file);
      ttsUrlRef.current = url;
      const audio = new Audio(url);
      ttsAudioRef.current = audio;
      audio.onended = () => setTtsPlaying(false);
      audio.onpause = () => setTtsPlaying(false);
      await audio.play();
      setTtsPlaying(true);
      setProgress(100);
      setStatus("جارٍ التشغيل — استمع ثم نزّل عند الجاهزية");
    } catch (err) {
      console.error(err);
      const { formatProcessError } = await import("@/lib/processors/ffmpeg-client");
      setError(formatProcessError(err));
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  async function stopTts() {
    ttsAudioRef.current?.pause();
    setTtsPlaying(false);
    setStatus("تم إيقاف التشغيل");
  }

  async function downloadTts() {
    if (!ttsFile) {
      setError("شغّل الصوت أولاً للمعاينة قبل التنزيل");
      return;
    }
    beginToolUse(slug);
    setBusy(true);
    setError(null);
    setStatus("جارٍ التنزيل…");
    try {
      const { downloadBlob } = await import("@/lib/processors/ffmpeg-client");
      await downloadBlob(ttsFile, ttsFile.name);
      setProgress(100);
      setStatus(`تم التنزيل: ${ttsFile.name}`);
    } catch (err) {
      console.error(err);
      const { formatProcessError } = await import("@/lib/processors/ffmpeg-client");
      setError(formatProcessError(err));
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  function setFromList(list: FileList | null) {
    if (!list?.length) return;
    const next = multiple ? Array.from(list) : [list[0]];
    const tooBig = next.find((f) => f.size > MAX_CLIENT_FILE_MB * 1024 * 1024);
    if (tooBig) {
      setError(`الملف كبير جداً (الحد ${MAX_CLIENT_FILE_MB}MB)`);
      return;
    }
    setError(null);
    setStatus(null);
    setFiles(next);
  }

  async function run() {
    beginToolUse(slug);
    setBusy(true);
    setError(null);
    setProgress(0);
    const onProgress = (p: number) => {
      setProgress(Math.round(p * 100));
      setStatus("جارٍ المعالجة…");
    };

    try {
      if (kind === "tts") {
        // التشغيل يتم عبر playTts / التنزيل عبر downloadTts
        return;
      }

      if (kind === "screen-recorder" || kind === "voice-recorder" || kind === "video-recorder") {
        const secs = Number(recordSecs) || 10;
        setStatus(`تسجيل ${secs} ثانية… اسمح بالصلاحية`);
        const rec = await import("@/lib/processors/record");
        if (kind === "screen-recorder") await rec.recordScreen(secs);
        else if (kind === "voice-recorder") await rec.recordVoice(secs);
        else await rec.recordCamera(secs);
        setProgress(100);
        setStatus("تم حفظ التسجيل");
        return;
      }

      if (!files.length) {
        setError("اختر ملفاً أولاً");
        return;
      }

      setStatus("تحميل المحرك…");
      const media = await import("@/lib/processors/media");
      const pdf = await import("@/lib/processors/pdf");
      const extra = await import("@/lib/processors/pdf-extra");
      const image = await import("@/lib/processors/image");
      const archive = await import("@/lib/processors/archive");

      switch (kind) {
        case "video-convert":
          await media.convertVideo(files[0], videoFormat, onProgress);
          break;
        case "video-trim":
          await media.trimMedia(files[0], Number(startSec), Number(endSec), "video", onProgress);
          break;
        case "video-rotate":
          await media.rotateVideo(files[0], Number(rotateDeg) as 90 | 180 | 270, onProgress);
          break;
        case "video-flip":
          await media.flipVideo(files[0], flipMode, onProgress);
          break;
        case "video-resize":
          await media.resizeVideo(files[0], Number(width), onProgress);
          break;
        case "video-speed":
          await media.changeVideoSpeed(files[0], Number(speed), onProgress);
          break;
        case "video-volume":
          await media.changeVideoVolume(files[0], Number(volume), onProgress);
          break;
        case "video-loop":
          await media.loopVideo(files[0], Number(loops), onProgress);
          break;
        case "video-merge":
          await media.mergeVideos(files, onProgress);
          break;
        case "video-editor":
          await media.editVideoBasic(
            files[0],
            {
              start: Number(startSec),
              end: Number(endSec),
              rotate: Number(editRotate) as 0 | 90 | 180 | 270,
              speed: Number(speed),
            },
            onProgress,
          );
          break;
        case "video-crop":
        case "video-delogo": {
          const box = {
            x: Number(cropX),
            y: Number(cropY),
            w: Number(cropW),
            h: Number(cropH),
          };
          if (kind === "video-crop") await media.cropVideo(files[0], box, onProgress);
          else await media.removeLogo(files[0], box, onProgress);
          break;
        }
        case "video-add-audio":
          if (files.length < 2) throw new Error("اختر فيديو ثم ملف صوت (ملفين)");
          await media.addAudioToVideo(files[0], files[1], onProgress);
          break;
        case "video-add-image":
          if (files.length < 2) throw new Error("اختر فيديو ثم صورة (ملفين)");
          await media.addImageToVideo(files[0], files[1], onProgress);
          break;
        case "video-add-text":
          await media.addTextToVideo(files[0], overlayText, onProgress);
          break;
        case "video-stabilize":
          await media.stabilizeVideo(files[0], onProgress);
          break;
        case "audio-convert":
          await media.convertAudio(files[0], audioFormat, onProgress);
          break;
        case "audio-trim":
          await media.trimMedia(files[0], Number(startSec), Number(endSec), "audio", onProgress);
          break;
        case "audio-volume":
          await media.changeAudioVolume(files[0], Number(volume), onProgress);
          break;
        case "audio-speed":
          await media.changeAudioSpeed(files[0], Number(speed), onProgress);
          break;
        case "audio-pitch":
          await media.changeAudioPitch(files[0], Number(pitch), onProgress);
          break;
        case "audio-reverse":
          await media.reverseAudio(files[0], onProgress);
          break;
        case "audio-join":
          await media.joinAudio(files, onProgress);
          break;
        case "audio-eq":
          await media.equalizeAudio(files[0], onProgress);
          break;
        case "pdf-merge":
          await pdf.mergePdfs(files);
          setProgress(100);
          break;
        case "pdf-split":
          await pdf.splitPdf(files[0], splitMode, Number(pageFrom), Number(pageTo));
          setProgress(100);
          break;
        case "pdf-rotate":
          await pdf.rotatePdf(files[0], Number(rotateDeg) as 90 | 180 | 270);
          setProgress(100);
          break;
        case "pdf-compress":
          await pdf.compressPdf(files[0]);
          setProgress(100);
          break;
        case "pdf-pages":
          await extra.addPdfPageNumbers(files[0]);
          setProgress(100);
          break;
        case "pdf-protect":
          await extra.protectPdf(files[0], password);
          setProgress(100);
          break;
        case "pdf-unlock":
          await extra.unlockPdf(files[0], password);
          setProgress(100);
          break;
        case "pdf-to-word":
          await extra.pdfToWord(files[0]);
          setProgress(100);
          break;
        case "pdf-to-excel":
          await extra.pdfToExcel(files[0]);
          setProgress(100);
          break;
        case "pdf-to-jpg":
          await extra.pdfToImages(files[0], "jpeg");
          setProgress(100);
          break;
        case "pdf-to-png":
          await extra.pdfToImages(files[0], "png");
          setProgress(100);
          break;
        case "jpg-to-pdf":
          await pdf.imagesToPdf(files);
          setProgress(100);
          break;
        case "word-to-pdf":
          await extra.wordToPdf(files[0]);
          setProgress(100);
          break;
        case "excel-to-pdf":
          await extra.excelToPdf(files[0]);
          setProgress(100);
          break;
        case "ppt-to-pdf":
          await extra.pptToPdf(files[0]);
          setProgress(100);
          break;
        case "doc-to-pdf":
          await extra.documentToPdf(files[0]);
          setProgress(100);
          break;
        case "image-convert":
          await image.convertImage(files[0], imageFormat);
          setProgress(100);
          break;
        case "archive-extract":
          await archive.extractArchive(files[0]);
          setProgress(100);
          break;
        case "archive-convert":
          await archive.convertArchiveToZip(files[0]);
          setProgress(100);
          break;
        case "ebook-convert":
          await archive.ebookToPdfStub(files[0]);
          setProgress(100);
          break;
        case "font-convert":
          await archive.convertFont(files[0], fontTarget);
          setProgress(100);
          break;
        default:
          throw new Error("أداة غير معروفة");
      }

      setStatus("تم! تم تنزيل/تشغيل النتيجة");
    } catch (err) {
      console.error(err);
      const { formatProcessError } = await import("@/lib/processors/ffmpeg-client");
      setError(formatProcessError(err));
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 sm:p-8">
      {kind === "tts" ? (
        <div className="space-y-4">
          <textarea
            className={`${sel} min-h-28`}
            value={ttsText}
            onChange={(e) => setTtsText(e.target.value)}
            placeholder="اكتب النص هنا…"
            maxLength={2500}
          />
          <p className="text-xs text-[#888]">{ttsText.length} / 2500 حرف</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="الصوت (عصبي — أقرب للواقع)">
              <select
                className={sel}
                value={ttsVoice}
                onChange={(e) => setTtsVoice(e.target.value)}
              >
                {(
                  [
                    ["ar-SA-ZariyahNeural", "زارية — أنثى (السعودية)"],
                    ["ar-SA-HamedNeural", "حامد — ذكر (السعودية)"],
                    ["ar-EG-SalmaNeural", "سلمى — أنثى (مصر)"],
                    ["ar-EG-ShakirNeural", "شاكر — ذكر (مصر)"],
                    ["ar-AE-FatimaNeural", "فاطمة — أنثى (الإمارات)"],
                    ["ar-AE-HamdanNeural", "حمدان — ذكر (الإمارات)"],
                    ["ar-JO-SanaNeural", "سناء — أنثى (الأردن)"],
                    ["ar-JO-TaimNeural", "تيم — ذكر (الأردن)"],
                    ["ar-MA-MounaNeural", "مونة — أنثى (المغرب)"],
                    ["ar-MA-JamalNeural", "جمال — ذكر (المغرب)"],
                  ] as const
                ).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="سرعة الكلام">
              <select
                className={sel}
                value={ttsRate}
                onChange={(e) => setTtsRate(e.target.value)}
              >
                <option value="slow">أبطأ قليلاً</option>
                <option value="default">طبيعي</option>
                <option value="fast">أسرع قليلاً</option>
              </select>
            </Field>
          </div>
        </div>
      ) : !noFileKinds.has(kind) ? (
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            setFromList(e.dataTransfer.files);
          }}
          className={`flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed px-4 text-center transition ${
            dragging ? "border-[#2563eb] bg-[#eff6ff]" : "border-[#d4d4d4] bg-[#fafafa]"
          }`}
        >
          <p className="text-base font-semibold text-[#111]">
            {multiple ? "اسحب الملفات هنا" : "اسحب الملف هنا أو اختر من جهازك"}
          </p>
          <p className="mt-2 max-w-sm text-sm leading-7 text-[#666]">{description}</p>
          {(kind === "video-add-audio" || kind === "video-add-image") && (
            <p className="mt-1 text-xs text-[#888]">
              اختر ملفين: الأول فيديو، الثاني{" "}
              {kind === "video-add-audio" ? "صوت" : "صورة"}
            </p>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="mt-5 rounded-md bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
          >
            اختيار {multiple ? "ملفات" : "ملف"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            className="hidden"
            onChange={(e) => setFromList(e.target.files)}
          />
        </div>
      ) : (
        <p className="rounded-lg bg-[#fafafa] px-4 py-3 text-sm text-[#555]">
          اضغط ابدأ واسمح للمتصفح بالصلاحيات المطلوبة.
        </p>
      )}

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((file) => (
            <li
              key={`${file.name}-${file.size}`}
              className="rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-4 py-2 text-sm"
            >
              {file.name}{" "}
              <span className="text-[#888]">({formatBytes(file.size)})</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {kind === "video-convert" && (
          <Field label="صيغة الفيديو">
            <select className={sel} value={videoFormat} onChange={(e) => setVideoFormat(e.target.value as "mp4" | "webm" | "mov")}>
              <option value="mp4">MP4</option>
              <option value="webm">WebM</option>
              <option value="mov">MOV</option>
            </select>
          </Field>
        )}
        {kind === "audio-convert" && (
          <Field label="صيغة الصوت">
            <select className={sel} value={audioFormat} onChange={(e) => setAudioFormat(e.target.value as "mp3" | "wav" | "aac" | "ogg")}>
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
              <option value="aac">AAC</option>
              <option value="ogg">OGG</option>
            </select>
          </Field>
        )}
        {kind === "image-convert" && (
          <Field label="صيغة الصورة">
            <select className={sel} value={imageFormat} onChange={(e) => setImageFormat(e.target.value as "jpeg" | "png" | "webp")}>
              <option value="jpeg">JPG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </Field>
        )}
        {kind === "font-convert" && (
          <Field label="صيغة الخط">
            <select className={sel} value={fontTarget} onChange={(e) => setFontTarget(e.target.value as "ttf" | "otf" | "woff")}>
              <option value="ttf">TTF</option>
              <option value="otf">OTF</option>
              <option value="woff">WOFF</option>
            </select>
          </Field>
        )}
        {(kind === "video-trim" || kind === "audio-trim" || kind === "video-editor") && (
          <>
            <Field label="البداية (ث)">
              <input className={sel} type="number" value={startSec} onChange={(e) => setStartSec(e.target.value)} />
            </Field>
            <Field label="النهاية (ث)">
              <input className={sel} type="number" value={endSec} onChange={(e) => setEndSec(e.target.value)} />
            </Field>
          </>
        )}
        {kind === "video-editor" && (
          <>
            <Field label="تدوير">
              <select className={sel} value={editRotate} onChange={(e) => setEditRotate(e.target.value as "0" | "90" | "180" | "270")}>
                <option value="0">بدون</option>
                <option value="90">90</option>
                <option value="180">180</option>
                <option value="270">270</option>
              </select>
            </Field>
            <Field label="السرعة">
              <input className={sel} type="number" step="0.1" min="0.5" max="2" value={speed} onChange={(e) => setSpeed(e.target.value)} />
            </Field>
          </>
        )}
        {(kind === "video-rotate" || kind === "pdf-rotate") && (
          <Field label="الزاوية">
            <select className={sel} value={rotateDeg} onChange={(e) => setRotateDeg(e.target.value as "90" | "180" | "270")}>
              <option value="90">90</option>
              <option value="180">180</option>
              <option value="270">270</option>
            </select>
          </Field>
        )}
        {kind === "video-flip" && (
          <Field label="القلب">
            <select className={sel} value={flipMode} onChange={(e) => setFlipMode(e.target.value as "h" | "v")}>
              <option value="h">أفقي</option>
              <option value="v">عمودي</option>
            </select>
          </Field>
        )}
        {kind === "video-resize" && (
          <Field label="العرض">
            <select className={sel} value={width} onChange={(e) => setWidth(e.target.value)}>
              <option value="640">640</option>
              <option value="1280">1280</option>
              <option value="1920">1920</option>
            </select>
          </Field>
        )}
        {(kind === "video-speed" || kind === "audio-speed") && (
          <Field label="السرعة 0.5–2">
            <input className={sel} type="number" step="0.1" min="0.5" max="2" value={speed} onChange={(e) => setSpeed(e.target.value)} />
          </Field>
        )}
        {(kind === "video-volume" || kind === "audio-volume") && (
          <Field label="مستوى الصوت">
            <input className={sel} type="number" step="0.1" min="0" value={volume} onChange={(e) => setVolume(e.target.value)} />
          </Field>
        )}
        {kind === "video-loop" && (
          <Field label="التكرارات">
            <input className={sel} type="number" min="2" max="10" value={loops} onChange={(e) => setLoops(e.target.value)} />
          </Field>
        )}
        {kind === "audio-pitch" && (
          <Field label="الطبقة">
            <input className={sel} type="number" value={pitch} onChange={(e) => setPitch(e.target.value)} />
          </Field>
        )}
        {kind === "video-add-text" && (
          <Field label="النص على الفيديو">
            <input className={sel} value={overlayText} onChange={(e) => setOverlayText(e.target.value)} />
          </Field>
        )}
        {(kind === "video-crop" || kind === "video-delogo") && (
          <>
            <Field label="X"><input className={sel} type="number" value={cropX} onChange={(e) => setCropX(e.target.value)} /></Field>
            <Field label="Y"><input className={sel} type="number" value={cropY} onChange={(e) => setCropY(e.target.value)} /></Field>
            <Field label="العرض"><input className={sel} type="number" value={cropW} onChange={(e) => setCropW(e.target.value)} /></Field>
            <Field label="الارتفاع"><input className={sel} type="number" value={cropH} onChange={(e) => setCropH(e.target.value)} /></Field>
          </>
        )}
        {kind === "pdf-split" && (
          <>
            <Field label="التقسيم">
              <select className={sel} value={splitMode} onChange={(e) => setSplitMode(e.target.value as "all" | "range")}>
                <option value="all">كل الصفحات ZIP</option>
                <option value="range">نطاق</option>
              </select>
            </Field>
            {splitMode === "range" && (
              <>
                <Field label="من"><input className={sel} type="number" min={1} value={pageFrom} onChange={(e) => setPageFrom(e.target.value)} /></Field>
                <Field label="إلى"><input className={sel} type="number" min={1} value={pageTo} onChange={(e) => setPageTo(e.target.value)} /></Field>
              </>
            )}
          </>
        )}
        {(kind === "pdf-protect" || kind === "pdf-unlock") && (
          <Field label="كلمة المرور">
            <input className={sel} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
        )}
        {(kind === "screen-recorder" || kind === "voice-recorder" || kind === "video-recorder") && (
          <Field label="مدة التسجيل (ث)">
            <input className={sel} type="number" min={3} max={60} value={recordSecs} onChange={(e) => setRecordSecs(e.target.value)} />
          </Field>
        )}
      </div>

      {(busy || status) && (
        <div className="mt-4">
          <div className="mb-2 h-2 overflow-hidden rounded-full bg-[#eee]">
            <div
              className="h-full rounded-full bg-[#2563eb] transition-all"
              style={{ width: `${Math.min(100, Math.max(progress, busy ? 8 : 0))}%` }}
            />
          </div>
          {status && <p className="text-sm text-[#555]">{status}</p>}
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {kind === "tts" ? (
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            disabled={busy || !ttsText.trim()}
            onClick={() => void (ttsPlaying ? stopTts() : playTts())}
            className="flex-1 rounded-md bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            {busy
              ? "جارٍ التوليد…"
              : ttsPlaying
                ? "إيقاف التشغيل"
                : "▶ تشغيل المعاينة"}
          </button>
          <button
            type="button"
            disabled={busy || !ttsFile}
            onClick={() => void downloadTts()}
            className="flex-1 rounded-md bg-[#111] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
          >
            {ttsFile ? "تنزيل MP3" : "نزّل بعد التشغيل"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy || (!noFileKinds.has(kind) && files.length === 0)}
          onClick={run}
          className="mt-5 rounded-md bg-[#111] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
        >
          {busy ? "جارٍ العمل…" : "ابدأ المعالجة"}
        </button>
      )}
      {kind === "tts" && !ttsFile ? (
        <p className="mt-2 text-xs text-[#888]">
          استمع للصوت أولاً، ثم فعّل زر التنزيل
        </p>
      ) : null}
      <p className="mt-3 text-xs text-[#888]">
        {title} — مجاني بالكامل · بدون علامة مائية · معالجة في المتصفح
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm text-[#333]">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}
