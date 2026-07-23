"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  getToolKind,
  MAX_CLIENT_FILE_MB,
  type ActiveToolKind,
} from "@/lib/processors/active-tools";
import { setDownloadRatingContext, beginToolUse } from "@/lib/ratings";
import {
  LogoRemoveControls,
  type DelogoBox,
} from "@/components/logo-remove-controls";

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
]);

const noFileKinds = new Set<ActiveToolKind>([
  "screen-recorder",
  "voice-recorder",
  "video-recorder",
  "tts",
  "media-downloader",
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
  const [enhanceTarget, setEnhanceTarget] = useState<"1080" | "1440" | "4k">("4k");
  const [enhanceStrength, setEnhanceStrength] = useState<
    "light" | "medium" | "strong"
  >("strong");
  const [speed, setSpeed] = useState("1.5");
  const [volume, setVolume] = useState("1.5");
  const [loops, setLoops] = useState("2");
  const [pitch, setPitch] = useState("2");
  const [recordSecs, setRecordSecs] = useState("10");
  const [editRotate, setEditRotate] = useState<"0" | "90" | "180" | "270">("0");
  const [overlayText, setOverlayText] = useState("Tool2Day");
  const [ttsText, setTtsText] = useState("مرحباً بك في Tool2Day");
  const [ttsVoice, setTtsVoice] = useState("ar-SA-HamedNeural");
  const [ttsStyle, setTtsStyle] = useState("video");
  const [ttsSpeed, setTtsSpeed] = useState(0.92);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaNote, setMediaNote] = useState("");
  const [mediaItems, setMediaItems] = useState<
    Array<{
      url: string;
      type: string;
      title?: string;
      thumbnail?: string;
      source: string;
    }>
  >([]);
  const [ttsFile, setTtsFile] = useState<File | null>(null);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsUrlRef = useRef<string | null>(null);
  const [password, setPassword] = useState("");
  const [cropX, setCropX] = useState("0");
  const [cropY, setCropY] = useState("0");
  const [cropW, setCropW] = useState("640");
  const [cropH, setCropH] = useState("360");
  const [overlayVideo, setOverlayVideo] = useState<File | null>(null);
  const [overlayImage, setOverlayImage] = useState<File | null>(null);
  const [imgScale, setImgScale] = useState("0.28");
  const [imgPosition, setImgPosition] = useState<
    "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"
  >("top-right");
  const [imgOpacity, setImgOpacity] = useState("1");
  const [delogoBoxes, setDelogoBoxes] = useState<DelogoBox[]>([]);
  const overlayVideoRef = useRef<HTMLInputElement>(null);
  const overlayImageRef = useRef<HTMLInputElement>(null);

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
  }, [ttsText, ttsVoice, ttsStyle, ttsSpeed]);

  useEffect(() => {
    return () => {
      ttsAudioRef.current?.pause();
      if (ttsUrlRef.current) URL.revokeObjectURL(ttsUrlRef.current);
    };
  }, []);

  const multiple = multiKinds.has(kind);

  async function extractMedia() {
    beginToolUse(slug);
    setMediaBusy(true);
    setBusy(true);
    setError(null);
    setMediaNote("");
    setMediaItems([]);
    setProgress(20);
    setStatus("جارٍ فحص الرابط واستخراج الوسائط…");
    try {
      const res = await fetch("/api/media-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: mediaUrl.trim() }),
      });
      const data = (await res.json()) as {
        error?: string;
        note?: string;
        title?: string;
        items?: Array<{
          url: string;
          type: string;
          title?: string;
          thumbnail?: string;
          source: string;
        }>;
      };
      if (!res.ok) throw new Error(data.error || "فشل الاستخراج");
      setMediaItems(data.items || []);
      setMediaNote(data.note || (data.title ? `صفحة: ${data.title}` : ""));
      setProgress(100);
      setStatus(
        data.items?.length
          ? `وُجد ${data.items.length} وسيط/وسائط`
          : "لا نتائج عامة في هذه الصفحة",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الاستخراج");
      setStatus(null);
    } finally {
      setMediaBusy(false);
      setBusy(false);
    }
  }

  async function openMediaItem(itemUrl: string) {
    try {
      const {
        hasRatedCurrentUse,
        openRatingGate,
        getCurrentUseId,
        beginToolUse: startUse,
      } = await import("@/lib/ratings");
      if (!getCurrentUseId(slug)) startUse(slug);
      if (!hasRatedCurrentUse(slug)) {
        const ok = await openRatingGate(slug);
        if (!ok) {
          setError("يجب تقييم الأداة قبل فتح/تنزيل الملف");
          return;
        }
      }
      window.open(itemUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الفتح");
    }
  }

  async function downloadMediaItem(itemUrl: string) {
    setBusy(true);
    setError(null);
    setStatus("جارٍ التحميل…");
    try {
      const href = `/api/media-proxy?url=${encodeURIComponent(itemUrl)}`;
      const res = await fetch(href);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "فشل التحميل عبر الوكيل");
      }
      const blob = await res.blob();
      const name =
        itemUrl.split("/").pop()?.split("?")[0] ||
        `tool2day-media-${Date.now()}`;
      const { downloadBlob } = await import("@/lib/processors/ffmpeg-client");
      // يفتح بوابة «قيّم الأداة قبل التنزيل» إن لم يُقيَّم هذا الاستخدام
      await downloadBlob(blob, name);
      setStatus("تم التنزيل");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "فشل التحميل";
      // إن ألغى المستخدم التقييم
      if (msg.includes("تقييم")) {
        setError(msg);
        setStatus(null);
        return;
      }
      // مسار احتياطي: تقييم ثم فتح الرابط الأصلي
      try {
        const { hasRatedCurrentUse, openRatingGate, getCurrentUseId, beginToolUse } =
          await import("@/lib/ratings");
        if (!getCurrentUseId(slug)) beginToolUse(slug);
        if (!hasRatedCurrentUse(slug)) {
          const ok = await openRatingGate(slug);
          if (!ok) {
            setError("يجب تقييم الأداة قبل التنزيل");
            setStatus(null);
            return;
          }
        }
        window.open(itemUrl, "_blank", "noopener,noreferrer");
        setStatus("فُتح الرابط الأصلي — احفظه من المتصفح إن لزم");
        setError(msg);
      } catch {
        setError(msg);
        setStatus(null);
      }
    } finally {
      setBusy(false);
    }
  }

  async function ensureTtsFile(): Promise<File> {
    if (ttsFile) return ttsFile;
    const { synthesizeToFile } = await import("@/lib/processors/tts");
    const file = await synthesizeToFile(ttsText, {
      voice: ttsVoice,
      rate: String(ttsSpeed),
      style: ttsStyle,
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
      if (kind === "media-downloader") {
        await extractMedia();
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

      if (kind === "video-add-image") {
        if (!overlayVideo || !overlayImage) {
          setError("اختر ملف فيديو وملف صورة");
          return;
        }
      } else if (!files.length) {
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
        case "video-crop": {
          const box = {
            x: Number(cropX),
            y: Number(cropY),
            w: Number(cropW),
            h: Number(cropH),
          };
          await media.cropVideo(files[0], box, onProgress);
          break;
        }
        case "video-delogo": {
          if (!delogoBoxes.length) {
            throw new Error("اختر وضع الإزالة أو ارسم منطقة الشعار على المعاينة");
          }
          await media.removeLogo(files[0], delogoBoxes, onProgress);
          break;
        }
        case "video-add-audio":
          if (files.length < 2) throw new Error("اختر فيديو ثم ملف صوت (ملفين)");
          await media.addAudioToVideo(files[0], files[1], onProgress);
          break;
        case "video-add-image": {
          if (!overlayVideo || !overlayImage) {
            throw new Error("اختر ملف فيديو وملف صورة");
          }
          await media.addImageToVideo(overlayVideo, overlayImage, onProgress, {
            scale: Number(imgScale) || 0.28,
            position: imgPosition,
            opacity: Number(imgOpacity) || 1,
          });
          break;
        }
        case "video-add-text":
          await media.addTextToVideo(files[0], overlayText, onProgress);
          break;
        case "video-stabilize":
          await media.stabilizeVideo(files[0], onProgress);
          break;
        case "video-enhance":
          await media.enhanceVideoQuality(
            files[0],
            { target: enhanceTarget, strength: enhanceStrength },
            onProgress,
          );
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
            <Field label="الصوت البشري العصبي (للفيديو)">
              <select
                className={sel}
                value={ttsVoice}
                onChange={(e) => setTtsVoice(e.target.value)}
              >
                <optgroup label="⭐ ذكر بشري محفّز (موصى به)">
                  <option value="ar-SA-HamedNeural">
                    حامد — ذكر طبيعي عميق (فصحى / السعودية)
                  </option>
                  <option value="ar-EG-ShakirNeural">
                    شاكر — ذكر محفّز (مصر)
                  </option>
                  <option value="ar-LB-RamiNeural">
                    رامي — ذكر هادئ (لبنان)
                  </option>
                  <option value="ar-IQ-BasselNeural">
                    باسل — ذكر عميق (العراق)
                  </option>
                  <option value="ar-AE-HamdanNeural">
                    حمدان — ذكر (الإمارات)
                  </option>
                </optgroup>
                <optgroup label="ذكور آخرون">
                  <option value="ar-SY-LaithNeural">ليث — ذكر (سوريا)</option>
                  <option value="ar-JO-TaimNeural">تيم — ذكر (الأردن)</option>
                  <option value="ar-KW-FahedNeural">فهد — ذكر (الكويت)</option>
                </optgroup>
                <optgroup label="إناث">
                  <option value="ar-SA-ZariyahNeural">
                    زارية — أنثى (فصحى / السعودية)
                  </option>
                  <option value="ar-EG-SalmaNeural">سلمى — أنثى (مصر)</option>
                  <option value="ar-LB-LaylaNeural">ليلى — أنثى (لبنان)</option>
                  <option value="ar-AE-FatimaNeural">
                    فاطمة — أنثى (الإمارات)
                  </option>
                  <option value="ar-SY-AmanyNeural">أماني — أنثى (سوريا)</option>
                  <option value="ar-JO-SanaNeural">سناء — أنثى (الأردن)</option>
                  <option value="ar-KW-NouraNeural">نورة — أنثى (الكويت)</option>
                  <option value="ar-IQ-RanaNeural">رنا — أنثى (العراق)</option>
                </optgroup>
              </select>
            </Field>
            <Field label="أسلوب السرد">
              <select
                className={sel}
                value={ttsStyle}
                onChange={(e) => setTtsStyle(e.target.value)}
              >
                <option value="video">للفيديو — بشري ومحفّز</option>
                <option value="solemn">رزين ومهيب</option>
                <option value="natural">طبيعي سريع</option>
              </select>
            </Field>
          </div>

          <Field
            label={`عيار سرعة الصوت (${Math.round(ttsSpeed * 100)}%)`}
          >
            <div className="space-y-2">
              <input
                type="range"
                min={50}
                max={130}
                step={1}
                value={Math.round(ttsSpeed * 100)}
                onChange={(e) => setTtsSpeed(Number(e.target.value) / 100)}
                className="w-full accent-[#2563eb]"
                aria-label="سرعة الصوت"
              />
              <div className="flex justify-between text-[11px] font-semibold text-[#888]">
                <span>أبطأ 50%</span>
                <button
                  type="button"
                  className="text-[#2563eb] hover:underline"
                  onClick={() => setTtsSpeed(0.92)}
                >
                  مثالي للفيديو 92%
                </button>
                <span>أسرع 130%</span>
              </div>
            </div>
          </Field>
          <p className="text-xs leading-5 text-[#666]">
            صوت عصبي حقيقي من Microsoft Edge — مناسب لتعليق فيديوهات بصوت يشبه
            الإنسان. حرّك العيار لضبط الإيقاع بدقة.
          </p>
        </div>
      ) : kind === "media-downloader" ? (
        <div className="space-y-4">
          <Field label="رابط الصفحة أو الملف">
            <input
              className={sel}
              dir="ltr"
              type="url"
              placeholder="https://example.com/page-or-file.mp4"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void extractMedia();
                }
              }}
            />
          </Field>
          <p className="text-xs leading-6 text-[#666]">
            يستخرج الروابط العامة الظاهرة في الصفحة (Open Graph / فيديو HTML /
            صور / ملفات مباشرة). لا يتجاوز الحماية أو حقوق النشر — استخدمه فقط
            للمحتوى الذي يحق لك حفظه.
          </p>
          {mediaNote ? (
            <p className="rounded-lg bg-[#f5f5f5] px-3 py-2 text-xs text-[#555]">
              {mediaNote}
            </p>
          ) : null}
          {mediaItems.length > 0 ? (
            <ul className="space-y-2">
              {mediaItems.map((item) => (
                <li
                  key={item.url}
                  className="flex flex-col gap-2 rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#111]">
                      {item.type === "video"
                        ? "فيديو"
                        : item.type === "audio"
                          ? "صوت"
                          : item.type === "image"
                            ? "صورة"
                            : "ملف"}
                      {item.title ? ` — ${item.title}` : ""}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-[#888]" dir="ltr">
                      {item.url}
                    </p>
                    <p className="text-[10px] text-[#aaa]">مصدر: {item.source}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {item.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="h-12 w-12 rounded object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : null}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void downloadMediaItem(item.url)}
                      className="rounded-md bg-[#16a34a] px-3 py-2 text-xs font-bold text-white hover:bg-[#15803d] disabled:opacity-50"
                    >
                      تنزيل
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void openMediaItem(item.url)}
                      className="rounded-md border border-[#ddd] bg-white px-3 py-2 text-xs font-bold text-[#333] hover:bg-[#f5f5f5] disabled:opacity-50"
                    >
                      فتح
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : kind === "video-add-image" ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-dashed border-[#d4d4d4] bg-[#fafafa] p-4 text-center">
              <p className="text-sm font-bold text-[#111]">1) ملف الفيديو</p>
              <p className="mt-1 text-xs text-[#888]">MP4 / WebM / MOV</p>
              <button
                type="button"
                disabled={busy}
                onClick={() => overlayVideoRef.current?.click()}
                className="mt-3 rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
              >
                اختيار فيديو
              </button>
              <input
                ref={overlayVideoRef}
                type="file"
                accept="video/*,.mp4,.webm,.mov"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setOverlayVideo(f);
                  setError(null);
                }}
              />
              {overlayVideo ? (
                <p className="mt-2 truncate text-xs text-[#333]">
                  {overlayVideo.name} ({formatBytes(overlayVideo.size)})
                </p>
              ) : null}
            </div>
            <div className="rounded-lg border border-dashed border-[#d4d4d4] bg-[#fafafa] p-4 text-center">
              <p className="text-sm font-bold text-[#111]">2) ملف الصورة</p>
              <p className="mt-1 text-xs text-[#888]">PNG / JPG / WebP</p>
              <button
                type="button"
                disabled={busy}
                onClick={() => overlayImageRef.current?.click()}
                className="mt-3 rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
              >
                اختيار صورة
              </button>
              <input
                ref={overlayImageRef}
                type="file"
                accept="image/*,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setOverlayImage(f);
                  setError(null);
                }}
              />
              {overlayImage ? (
                <p className="mt-2 truncate text-xs text-[#333]">
                  {overlayImage.name} ({formatBytes(overlayImage.size)})
                </p>
              ) : null}
            </div>
          </div>
          <p className="text-xs text-[#888]">
            ارفع فيديو وصورة منفصلين، ثم اضبط الحجم والموضع والشفافية
          </p>
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
          {(kind === "video-add-audio") && (
            <p className="mt-1 text-xs text-[#888]">
              اختر ملفين: الأول فيديو، الثاني صوت
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

      {files.length > 0 && kind !== "video-add-image" && (
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
        {kind === "video-add-image" && (
          <>
            <Field label="حجم الصورة على الفيديو">
              <select
                className={sel}
                value={imgScale}
                onChange={(e) => setImgScale(e.target.value)}
              >
                <option value="0.12">صغير جداً (12%)</option>
                <option value="0.2">صغير (20%)</option>
                <option value="0.28">متوسط (28%)</option>
                <option value="0.4">كبير (40%)</option>
                <option value="0.55">أكبر (55%)</option>
                <option value="0.7">ملء شبه كامل (70%)</option>
              </select>
            </Field>
            <Field label={`شفافية الصورة (${Math.round(Number(imgOpacity) * 100)}%)`}>
              <input
                className="mt-2 w-full accent-[#2563eb]"
                type="range"
                min={0.15}
                max={1}
                step={0.05}
                value={imgOpacity}
                onChange={(e) => setImgOpacity(e.target.value)}
              />
              <div className="mt-1 flex justify-between text-[11px] text-[#888]">
                <span>شفاف</span>
                <span>واضح</span>
              </div>
            </Field>
            <div className="sm:col-span-2">
              <p className="mb-2 text-sm font-semibold text-[#333]">
                موضع الصورة
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {(
                  [
                    ["top-right", "أعلى يمين"],
                    ["top-left", "أعلى يسار"],
                    ["center", "الوسط"],
                    ["bottom-right", "أسفل يمين"],
                    ["bottom-left", "أسفل يسار"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    disabled={busy}
                    onClick={() => setImgPosition(id)}
                    className={`rounded-md border px-2 py-2 text-xs font-semibold transition ${
                      imgPosition === id
                        ? "border-[#111] bg-[#111] text-white"
                        : "border-[#ddd] bg-white text-[#333] hover:border-[#bbb]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
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
        {kind === "video-enhance" && (
          <>
            <Field label="الدقة المستهدفة">
              <select
                className={sel}
                value={enhanceTarget}
                onChange={(e) =>
                  setEnhanceTarget(e.target.value as "1080" | "1440" | "4k")
                }
              >
                <option value="1080">Full HD — 1080p</option>
                <option value="1440">QHD — 1440p</option>
                <option value="4k">4K UHD — أفضل وضوح</option>
              </select>
            </Field>
            <Field label="قوة التحسين">
              <select
                className={sel}
                value={enhanceStrength}
                onChange={(e) =>
                  setEnhanceStrength(
                    e.target.value as "light" | "medium" | "strong",
                  )
                }
              >
                <option value="light">خفيف — أسرع</option>
                <option value="medium">متوسط — متوازن</option>
                <option value="strong">قوي — أقصى جودة (أبطأ)</option>
              </select>
            </Field>
            <p className="sm:col-span-2 text-xs leading-6 text-[#666]">
              يطبّق تنعيم الضوضاء، رفع الدقة بمحرّك Lanczos، توضيح الحواف، وتحسين
              التباين/الألوان، ثم ترميز عالي الجودة. المقاطع الطويلة قد تستغرق
              وقتاً أطول داخل المتصفح.
            </p>
          </>
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
        {kind === "video-crop" && (
          <>
            <Field label="X"><input className={sel} type="number" value={cropX} onChange={(e) => setCropX(e.target.value)} /></Field>
            <Field label="Y"><input className={sel} type="number" value={cropY} onChange={(e) => setCropY(e.target.value)} /></Field>
            <Field label="العرض"><input className={sel} type="number" value={cropW} onChange={(e) => setCropW(e.target.value)} /></Field>
            <Field label="الارتفاع"><input className={sel} type="number" value={cropH} onChange={(e) => setCropH(e.target.value)} /></Field>
          </>
        )}
        {kind === "video-delogo" && (
          <LogoRemoveControls
            file={files[0] || null}
            onBoxesChange={setDelogoBoxes}
          />
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
      ) : kind === "media-downloader" ? (
        <button
          type="button"
          disabled={busy || mediaBusy || !mediaUrl.trim()}
          onClick={() => void extractMedia()}
          className="mt-5 rounded-md bg-[#111] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
        >
          {busy || mediaBusy ? "جارٍ الاستخراج…" : "استخراج الوسائط"}
        </button>
      ) : (
        <button
          type="button"
          disabled={
            busy ||
            (kind === "video-add-image"
              ? !overlayVideo || !overlayImage
              : !noFileKinds.has(kind) && files.length === 0)
          }
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
        {kind === "media-downloader"
          ? `${title} — مجاني · استخراج الروابط العامة فقط · احترم حقوق النشر`
          : `${title} — مجاني بالكامل · معالجة في المتصفح`}
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
