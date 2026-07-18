"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  getToolKind,
  MAX_CLIENT_FILE_MB,
  type ActiveToolKind,
} from "@/lib/processors/active-tools";

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
]);

const recorderKinds = new Set<ActiveToolKind>([
  "screen-recorder",
  "voice-recorder",
  "video-recorder",
]);

export function ToolWorkspace({ slug, title, description, accept }: Props) {
  const kind = useMemo(() => getToolKind(slug), [slug]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [videoFormat, setVideoFormat] = useState<"mp4" | "webm" | "mov">("mp4");
  const [audioFormat, setAudioFormat] = useState<"mp3" | "wav" | "aac" | "ogg">("mp3");
  const [imageFormat, setImageFormat] = useState<"jpeg" | "png" | "webp">("jpeg");
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

  const multiple = multiKinds.has(kind);

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
    setBusy(true);
    setError(null);
    setProgress(0);

    const onProgress = (p: number) => {
      setProgress(Math.round(p * 100));
      setStatus("جارٍ المعالجة…");
    };

    try {
      if (recorderKinds.has(kind)) {
        const secs = Number(recordSecs) || 10;
        setStatus(`جاري التسجيل لمدة ${secs} ثانية… اسمح بالصلاحية`);
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

      setStatus("تحميل المحرك… أول مرة قد تحتاج دقيقة");
      const media = await import("@/lib/processors/media");
      const pdf = await import("@/lib/processors/pdf");
      const image = await import("@/lib/processors/image");

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
        case "jpg-to-pdf":
          await pdf.imagesToPdf(files);
          setProgress(100);
          break;
        case "image-convert":
          await image.convertImage(files[0], imageFormat);
          setProgress(100);
          break;
        default:
          setError("هذه الأداة قيد التفعيل قريباً");
          return;
      }

      setStatus("تم! بدأ تنزيل النتيجة");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "فشلت المعالجة");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  if (kind === "coming-soon") {
    return (
      <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 sm:p-8">
        <p className="text-base font-semibold text-[#111]">{title}</p>
        <p className="mt-2 text-sm leading-7 text-[#666]">{description}</p>
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          هذه الأداة لسه قيد التفعيل. الأدوات المعلّمة بـ «شغّال» على الصفحة
          الرئيسية تعمل الآن.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 sm:p-8">
      {!recorderKinds.has(kind) ? (
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
          className={`flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed px-4 text-center transition ${
            dragging ? "border-[#2563eb] bg-[#eff6ff]" : "border-[#d4d4d4] bg-[#fafafa]"
          }`}
        >
          <p className="text-base font-semibold text-[#111]">
            {multiple ? "اسحب الملفات هنا" : "اسحب الملف هنا أو اختر من جهازك"}
          </p>
          <p className="mt-2 max-w-sm text-sm leading-7 text-[#666]">{description}</p>
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
          اضغط ابدأ، واسمح للمتصفح بالوصول للكاميرا/الشاشة/الميكروفون.
        </p>
      )}

      {files.length > 0 ? (
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
      ) : null}

      <Options
        kind={kind}
        videoFormat={videoFormat}
        setVideoFormat={setVideoFormat}
        audioFormat={audioFormat}
        setAudioFormat={setAudioFormat}
        imageFormat={imageFormat}
        setImageFormat={setImageFormat}
        startSec={startSec}
        setStartSec={setStartSec}
        endSec={endSec}
        setEndSec={setEndSec}
        splitMode={splitMode}
        setSplitMode={setSplitMode}
        pageFrom={pageFrom}
        setPageFrom={setPageFrom}
        pageTo={pageTo}
        setPageTo={setPageTo}
        rotateDeg={rotateDeg}
        setRotateDeg={setRotateDeg}
        flipMode={flipMode}
        setFlipMode={setFlipMode}
        width={width}
        setWidth={setWidth}
        speed={speed}
        setSpeed={setSpeed}
        volume={volume}
        setVolume={setVolume}
        loops={loops}
        setLoops={setLoops}
        pitch={pitch}
        setPitch={setPitch}
        recordSecs={recordSecs}
        setRecordSecs={setRecordSecs}
        editRotate={editRotate}
        setEditRotate={setEditRotate}
      />

      {(busy || status) && (
        <div className="mt-4">
          <div className="mb-2 h-2 overflow-hidden rounded-full bg-[#eee]">
            <div
              className="h-full rounded-full bg-[#2563eb] transition-all"
              style={{
                width: `${Math.min(100, Math.max(progress, busy ? 8 : 0))}%`,
              }}
            />
          </div>
          {status ? <p className="text-sm text-[#555]">{status}</p> : null}
        </div>
      )}

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={busy || (!recorderKinds.has(kind) && files.length === 0)}
        onClick={run}
        className="mt-5 rounded-md bg-[#111] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
      >
        {busy ? "جارٍ العمل…" : "ابدأ المعالجة"}
      </button>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm text-[#333]">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function selectClass() {
  return "block w-full rounded-md border border-[#ddd] bg-white px-3 py-2";
}

function Options(props: {
  kind: ActiveToolKind;
  videoFormat: "mp4" | "webm" | "mov";
  setVideoFormat: (v: "mp4" | "webm" | "mov") => void;
  audioFormat: "mp3" | "wav" | "aac" | "ogg";
  setAudioFormat: (v: "mp3" | "wav" | "aac" | "ogg") => void;
  imageFormat: "jpeg" | "png" | "webp";
  setImageFormat: (v: "jpeg" | "png" | "webp") => void;
  startSec: string;
  setStartSec: (v: string) => void;
  endSec: string;
  setEndSec: (v: string) => void;
  splitMode: "all" | "range";
  setSplitMode: (v: "all" | "range") => void;
  pageFrom: string;
  setPageFrom: (v: string) => void;
  pageTo: string;
  setPageTo: (v: string) => void;
  rotateDeg: "90" | "180" | "270";
  setRotateDeg: (v: "90" | "180" | "270") => void;
  flipMode: "h" | "v";
  setFlipMode: (v: "h" | "v") => void;
  width: string;
  setWidth: (v: string) => void;
  speed: string;
  setSpeed: (v: string) => void;
  volume: string;
  setVolume: (v: string) => void;
  loops: string;
  setLoops: (v: string) => void;
  pitch: string;
  setPitch: (v: string) => void;
  recordSecs: string;
  setRecordSecs: (v: string) => void;
  editRotate: "0" | "90" | "180" | "270";
  setEditRotate: (v: "0" | "90" | "180" | "270") => void;
}) {
  const { kind } = props;

  if (kind === "video-convert") {
    return (
      <div className="mt-5">
        <Field label="صيغة الإخراج">
          <select
            className={selectClass()}
            value={props.videoFormat}
            onChange={(e) =>
              props.setVideoFormat(e.target.value as "mp4" | "webm" | "mov")
            }
          >
            <option value="mp4">MP4</option>
            <option value="webm">WebM</option>
            <option value="mov">MOV</option>
          </select>
        </Field>
      </div>
    );
  }

  if (kind === "audio-convert") {
    return (
      <div className="mt-5">
        <Field label="صيغة الإخراج">
          <select
            className={selectClass()}
            value={props.audioFormat}
            onChange={(e) =>
              props.setAudioFormat(e.target.value as "mp3" | "wav" | "aac" | "ogg")
            }
          >
            <option value="mp3">MP3</option>
            <option value="wav">WAV</option>
            <option value="aac">AAC</option>
            <option value="ogg">OGG</option>
          </select>
        </Field>
      </div>
    );
  }

  if (kind === "image-convert") {
    return (
      <div className="mt-5">
        <Field label="صيغة الصورة">
          <select
            className={selectClass()}
            value={props.imageFormat}
            onChange={(e) =>
              props.setImageFormat(e.target.value as "jpeg" | "png" | "webp")
            }
          >
            <option value="jpeg">JPG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
        </Field>
      </div>
    );
  }

  if (kind === "video-trim" || kind === "audio-trim") {
    return (
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Field label="البداية (ثانية)">
          <input
            type="number"
            className={selectClass()}
            value={props.startSec}
            onChange={(e) => props.setStartSec(e.target.value)}
          />
        </Field>
        <Field label="النهاية (ثانية)">
          <input
            type="number"
            className={selectClass()}
            value={props.endSec}
            onChange={(e) => props.setEndSec(e.target.value)}
          />
        </Field>
      </div>
    );
  }

  if (kind === "video-editor") {
    return (
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Field label="البداية (ثانية)">
          <input
            type="number"
            className={selectClass()}
            value={props.startSec}
            onChange={(e) => props.setStartSec(e.target.value)}
          />
        </Field>
        <Field label="النهاية (ثانية)">
          <input
            type="number"
            className={selectClass()}
            value={props.endSec}
            onChange={(e) => props.setEndSec(e.target.value)}
          />
        </Field>
        <Field label="تدوير">
          <select
            className={selectClass()}
            value={props.editRotate}
            onChange={(e) =>
              props.setEditRotate(e.target.value as "0" | "90" | "180" | "270")
            }
          >
            <option value="0">بدون</option>
            <option value="90">90°</option>
            <option value="180">180°</option>
            <option value="270">270°</option>
          </select>
        </Field>
        <Field label="السرعة">
          <input
            type="number"
            step="0.1"
            min="0.5"
            max="2"
            className={selectClass()}
            value={props.speed}
            onChange={(e) => props.setSpeed(e.target.value)}
          />
        </Field>
      </div>
    );
  }

  if (kind === "video-rotate" || kind === "pdf-rotate") {
    return (
      <div className="mt-5">
        <Field label="زاوية التدوير">
          <select
            className={selectClass()}
            value={props.rotateDeg}
            onChange={(e) =>
              props.setRotateDeg(e.target.value as "90" | "180" | "270")
            }
          >
            <option value="90">90°</option>
            <option value="180">180°</option>
            <option value="270">270°</option>
          </select>
        </Field>
      </div>
    );
  }

  if (kind === "video-flip") {
    return (
      <div className="mt-5">
        <Field label="اتجاه القلب">
          <select
            className={selectClass()}
            value={props.flipMode}
            onChange={(e) => props.setFlipMode(e.target.value as "h" | "v")}
          >
            <option value="h">أفقي</option>
            <option value="v">عمودي</option>
          </select>
        </Field>
      </div>
    );
  }

  if (kind === "video-resize") {
    return (
      <div className="mt-5">
        <Field label="العرض بالبكسل">
          <select
            className={selectClass()}
            value={props.width}
            onChange={(e) => props.setWidth(e.target.value)}
          >
            <option value="640">640</option>
            <option value="1280">1280</option>
            <option value="1920">1920</option>
          </select>
        </Field>
      </div>
    );
  }

  if (kind === "video-speed" || kind === "audio-speed") {
    return (
      <div className="mt-5">
        <Field label="السرعة (0.5 – 2)">
          <input
            type="number"
            step="0.1"
            min="0.5"
            max="2"
            className={selectClass()}
            value={props.speed}
            onChange={(e) => props.setSpeed(e.target.value)}
          />
        </Field>
      </div>
    );
  }

  if (kind === "video-volume" || kind === "audio-volume") {
    return (
      <div className="mt-5">
        <Field label="مستوى الصوت (مثلاً 0.5 أو 2)">
          <input
            type="number"
            step="0.1"
            min="0"
            className={selectClass()}
            value={props.volume}
            onChange={(e) => props.setVolume(e.target.value)}
          />
        </Field>
      </div>
    );
  }

  if (kind === "video-loop") {
    return (
      <div className="mt-5">
        <Field label="عدد التكرارات">
          <input
            type="number"
            min="2"
            max="10"
            className={selectClass()}
            value={props.loops}
            onChange={(e) => props.setLoops(e.target.value)}
          />
        </Field>
      </div>
    );
  }

  if (kind === "audio-pitch") {
    return (
      <div className="mt-5">
        <Field label="الطبقة (نصف نغمة، مثلاً 2 أو -2)">
          <input
            type="number"
            step="1"
            className={selectClass()}
            value={props.pitch}
            onChange={(e) => props.setPitch(e.target.value)}
          />
        </Field>
      </div>
    );
  }

  if (kind === "pdf-split") {
    return (
      <div className="mt-5 space-y-3">
        <Field label="طريقة التقسيم">
          <select
            className={selectClass()}
            value={props.splitMode}
            onChange={(e) =>
              props.setSplitMode(e.target.value as "all" | "range")
            }
          >
            <option value="all">كل صفحة كملف (ZIP)</option>
            <option value="range">نطاق صفحات</option>
          </select>
        </Field>
        {props.splitMode === "range" ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="من">
              <input
                type="number"
                min={1}
                className={selectClass()}
                value={props.pageFrom}
                onChange={(e) => props.setPageFrom(e.target.value)}
              />
            </Field>
            <Field label="إلى">
              <input
                type="number"
                min={1}
                className={selectClass()}
                value={props.pageTo}
                onChange={(e) => props.setPageTo(e.target.value)}
              />
            </Field>
          </div>
        ) : null}
      </div>
    );
  }

  if (
    kind === "screen-recorder" ||
    kind === "voice-recorder" ||
    kind === "video-recorder"
  ) {
    return (
      <div className="mt-5">
        <Field label="مدة التسجيل (ثانية)">
          <input
            type="number"
            min={3}
            max={60}
            className={selectClass()}
            value={props.recordSecs}
            onChange={(e) => props.setRecordSecs(e.target.value)}
          />
        </Field>
      </div>
    );
  }

  return null;
}
