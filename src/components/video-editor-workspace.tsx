"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Clapperboard,
  Copy,
  FileVideo,
  ImagePlus,
  Mic,
  Pause,
  Play,
  Scissors,
  SkipBack,
  SkipForward,
  Trash2,
  Type,
  Volume2,
  VolumeX,
  Ratio,
  Download,
  Upload,
} from "lucide-react";
import { exportVideoProject } from "@/lib/processors/video-project";

type Panel = "files" | "text" | "canvas" | "audio" | "record";
type PropTab = "video" | "audio";
type Aspect = "original" | "16:9" | "9:16" | "1:1";

type Overlay =
  | {
      id: string;
      type: "text";
      text: string;
      fontSize: number;
      x: number;
      y: number;
      w: number;
      h: number;
    }
  | {
      id: string;
      type: "image";
      src: string;
      file: File;
      x: number;
      y: number;
      w: number;
      h: number;
    };

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.floor((sec % 1) * 100);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function aspectSize(
  aspect: Aspect,
  videoW: number,
  videoH: number,
): { w: number; h: number } {
  if (aspect === "16:9") return { w: 1280, h: 720 };
  if (aspect === "9:16") return { w: 720, h: 1280 };
  if (aspect === "1:1") return { w: 1080, h: 1080 };
  const max = 1280;
  if (videoW >= videoH) {
    return { w: max, h: Math.round((max * videoH) / Math.max(1, videoW)) };
  }
  return { w: Math.round((max * videoW) / Math.max(1, videoH)), h: max };
}

export function VideoEditorWorkspace() {
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    kind: "move" | "resize" | "trim-in" | "trim-out" | "playhead" | "video-move" | "video-resize";
    id?: string;
    corner?: "se";
    startX: number;
    startY: number;
    ox: number;
    oy: number;
    ow: number;
    oh: number;
  } | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [videoNatural, setVideoNatural] = useState({ w: 1280, h: 720 });
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [trimIn, setTrimIn] = useState(0);
  const [trimOut, setTrimOut] = useState(10);
  const [panel, setPanel] = useState<Panel>("files");
  const [propTab, setPropTab] = useState<PropTab>("video");
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [rotate, setRotate] = useState<0 | 90 | 180 | 270>(0);
  const [aspect, setAspect] = useState<Aspect>("original");
  const [videoBox, setVideoBox] = useState({
    x: 0.05,
    y: 0.05,
    w: 0.9,
    h: 0.9,
  });
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [selectedId, setSelectedId] = useState<string | "video">("video");
  const [draftText, setDraftText] = useState("عنوان الفيديو");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [timelineZoom, setTimelineZoom] = useState(1);

  const outSize = useMemo(
    () => aspectSize(aspect, videoNatural.w, videoNatural.h),
    [aspect, videoNatural],
  );

  const clipDuration = Math.max(0.1, trimOut - trimIn);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = speed;
    v.volume = muted ? 0 : volume;
    v.muted = muted;
  }, [speed, volume, muted]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !playing) return;
    const id = window.setInterval(() => {
      setCurrentTime(v.currentTime);
      if (v.currentTime >= trimOut - 0.04) {
        v.pause();
        v.currentTime = trimIn;
        setPlaying(false);
        setCurrentTime(trimIn);
      }
    }, 40);
    return () => clearInterval(id);
  }, [playing, trimIn, trimOut]);

  async function onPick(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    if (url) URL.revokeObjectURL(url);
    const next = URL.createObjectURL(f);
    setFile(f);
    setUrl(next);
    setOverlays([]);
    setSelectedId("video");
    setError(null);
    setStatus(`تم تحميل: ${f.name}`);
    setPanel("files");
  }

  function onLoadedMeta() {
    const v = videoRef.current;
    if (!v) return;
    const d = v.duration || 0;
    setDuration(d);
    setTrimIn(0);
    setTrimOut(d);
    setCurrentTime(0);
    setVideoNatural({
      w: v.videoWidth || 1280,
      h: v.videoHeight || 720,
    });
    setVideoBox({ x: 0, y: 0, w: 1, h: 1 });
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      v.pause();
      setPlaying(false);
      return;
    }
    if (v.currentTime < trimIn || v.currentTime >= trimOut) {
      v.currentTime = trimIn;
    }
    void v.play();
    setPlaying(true);
  }

  function seekTo(t: number) {
    const v = videoRef.current;
    const clamped = Math.min(trimOut, Math.max(trimIn, t));
    if (v) v.currentTime = clamped;
    setCurrentTime(clamped);
  }

  function splitAtPlayhead() {
    // Soft split: set trimOut to playhead (keep left) — user can re-extend
    if (currentTime <= trimIn + 0.1 || currentTime >= trimOut - 0.1) {
      setError("حرّك رأس التشغيل داخل المقطع ثم اقسم");
      return;
    }
    setTrimOut(currentTime);
    setStatus(`تم القص عند ${formatTime(currentTime)}`);
  }

  function addTextOverlay() {
    const id = `t-${Date.now()}`;
    setOverlays((prev) => [
      ...prev,
      {
        id,
        type: "text",
        text: draftText || "نص",
        fontSize: 42,
        x: 0.15,
        y: 0.35,
        w: 0.7,
        h: 0.14,
      },
    ]);
    setSelectedId(id);
    setPropTab("video");
    setStatus("اسحب النص على المعاينة لتغيير موقعه");
  }

  async function addImageOverlay(list: FileList | null) {
    const img = list?.[0];
    if (!img) return;
    const src = URL.createObjectURL(img);
    const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve({ w: el.naturalWidth, h: el.naturalHeight });
      el.onerror = () => reject(new Error("فشل قراءة الصورة"));
      el.src = src;
    });
    const aspectRatio = dims.w / Math.max(1, dims.h);
    const w = 0.28;
    const h = w / aspectRatio / (outSize.w / outSize.h);
    const id = `i-${Date.now()}`;
    setOverlays((prev) => [
      ...prev,
      {
        id,
        type: "image",
        src,
        file: img,
        x: 0.36,
        y: 0.3,
        w,
        h: Math.min(0.5, h),
      },
    ]);
    setSelectedId(id);
    setStatus("اسحب زوايا الصورة لتغيير الحجم");
  }

  function deleteSelected() {
    if (selectedId === "video") return;
    setOverlays((prev) => {
      const victim = prev.find((o) => o.id === selectedId);
      if (victim?.type === "image") URL.revokeObjectURL(victim.src);
      return prev.filter((o) => o.id !== selectedId);
    });
    setSelectedId("video");
  }

  function duplicateSelected() {
    const src = overlays.find((o) => o.id === selectedId);
    if (!src) return;
    const id = `${src.type[0]}-${Date.now()}`;
    if (src.type === "text") {
      setOverlays((prev) => [
        ...prev,
        { ...src, id, x: Math.min(0.8, src.x + 0.04), y: Math.min(0.8, src.y + 0.04) },
      ]);
    } else {
      setOverlays((prev) => [
        ...prev,
        {
          ...src,
          id,
          x: Math.min(0.8, src.x + 0.04),
          y: Math.min(0.8, src.y + 0.04),
        },
      ]);
    }
    setSelectedId(id);
  }

  function onOverlayPointerDown(
    e: ReactPointerEvent,
    id: string,
    kind: "move" | "resize",
  ) {
    e.preventDefault();
    e.stopPropagation();
    const item = overlays.find((o) => o.id === id);
    if (!item) return;
    setSelectedId(id);
    dragRef.current = {
      kind,
      id,
      corner: "se",
      startX: e.clientX,
      startY: e.clientY,
      ox: item.x,
      oy: item.y,
      ow: item.w,
      oh: item.h,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onVideoHandleDown(
    e: ReactPointerEvent,
    kind: "video-move" | "video-resize",
  ) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId("video");
    setPropTab("video");
    dragRef.current = {
      kind,
      startX: e.clientX,
      startY: e.clientY,
      ox: videoBox.x,
      oy: videoBox.y,
      ow: videoBox.w,
      oh: videoBox.h,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onStagePointerMove(e: ReactPointerEvent) {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage) return;
    const rect = stage.getBoundingClientRect();
    const dx = (e.clientX - drag.startX) / rect.width;
    const dy = (e.clientY - drag.startY) / rect.height;

    if (drag.kind === "video-move") {
      setVideoBox({
        x: Math.max(0, Math.min(1 - drag.ow, drag.ox + dx)),
        y: Math.max(0, Math.min(1 - drag.oh, drag.oy + dy)),
        w: drag.ow,
        h: drag.oh,
      });
      return;
    }
    if (drag.kind === "video-resize") {
      const w = Math.max(0.15, Math.min(1 - drag.ox, drag.ow + dx));
      const h = Math.max(0.15, Math.min(1 - drag.oy, drag.oh + dy));
      setVideoBox({ x: drag.ox, y: drag.oy, w, h });
      return;
    }
    if ((drag.kind === "move" || drag.kind === "resize") && drag.id) {
      setOverlays((prev) =>
        prev.map((item) => {
          if (item.id !== drag.id) return item;
          if (drag.kind === "move") {
            return {
              ...item,
              x: Math.max(0, Math.min(0.95, drag.ox + dx)),
              y: Math.max(0, Math.min(0.95, drag.oy + dy)),
            };
          }
          return {
            ...item,
            w: Math.max(0.08, Math.min(0.95, drag.ow + dx)),
            h: Math.max(0.06, Math.min(0.95, drag.oh + dy)),
          };
        }),
      );
    }
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function timelinePct(t: number) {
    if (!duration) return 0;
    return (t / duration) * 100;
  }

  function timeFromClientX(clientX: number) {
    const el = timelineRef.current;
    if (!el || !duration) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * duration;
  }

  function onTimelinePointerDown(e: ReactPointerEvent, kind: "playhead" | "trim-in" | "trim-out") {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      kind,
      startX: e.clientX,
      startY: e.clientY,
      ox: 0,
      oy: 0,
      ow: 0,
      oh: 0,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (kind === "playhead") seekTo(timeFromClientX(e.clientX));
  }

  function onTimelineMove(e: ReactPointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const t = timeFromClientX(e.clientX);
    if (drag.kind === "playhead") seekTo(t);
    if (drag.kind === "trim-in") {
      setTrimIn(Math.min(trimOut - 0.2, Math.max(0, t)));
    }
    if (drag.kind === "trim-out") {
      setTrimOut(Math.max(trimIn + 0.2, Math.min(duration, t)));
    }
  }

  async function onExport() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setProgress(0);
    setStatus("جاري التصدير… قد يستغرق دقيقة حسب حجم الملف");
    try {
      await exportVideoProject(
        {
          file,
          trimIn,
          trimOut,
          speed,
          rotate,
          volume,
          muted,
          fadeIn,
          fadeOut,
          outW: outSize.w,
          outH: outSize.h,
          videoX: videoBox.x * outSize.w,
          videoY: videoBox.y * outSize.h,
          videoW: videoBox.w * outSize.w,
          videoH: videoBox.h * outSize.h,
          overlays: overlays.map((o) =>
            o.type === "text"
              ? {
                  type: "text" as const,
                  text: o.text,
                  fontSize: o.fontSize * (outSize.w / 720),
                  x: o.x,
                  y: o.y,
                  w: o.w,
                }
              : {
                  type: "image" as const,
                  file: o.file,
                  x: o.x,
                  y: o.y,
                  w: o.w,
                  h: o.h,
                },
          ),
        },
        (r) => setProgress(Math.round(r * 100)),
      );
      setStatus("تم التصدير والتنزيل");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "فشل التصدير");
    } finally {
      setBusy(false);
    }
  }

  const selectedOverlay = overlays.find((o) => o.id === selectedId) ?? null;

  const navBtn = (id: Panel, label: string, Icon: typeof FileVideo) => (
    <button
      key={id}
      type="button"
      onClick={() => setPanel(id)}
      className={`flex w-full flex-col items-center gap-1 rounded-lg px-1 py-3 text-[10px] transition ${
        panel === id
          ? "bg-[#2a2a2e] text-[#f5c518]"
          : "text-[#aaa] hover:bg-[#222] hover:text-white"
      }`}
    >
      <Icon className="h-5 w-5" strokeWidth={1.5} />
      {label}
    </button>
  );

  if (!file || !url) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#2a2a2e] bg-[#121214] text-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#2a2a2e] px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Clapperboard className="h-5 w-5 text-[#f5c518]" />
            محرر الفيديو
          </div>
          <span className="text-xs text-[#888]">مثل 123apps — داخل المتصفح</span>
        </div>
        <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 p-8">
          <div className="rounded-2xl border border-dashed border-[#3a3a40] bg-[#1a1a1d] px-10 py-14 text-center">
            <Upload className="mx-auto mb-4 h-10 w-10 text-[#f5c518]" />
            <p className="mb-4 text-sm text-[#ccc]">اسحب فيديو أو اختر من جهازك للبدء</p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-md bg-[#f5c518] px-6 py-2.5 text-sm font-bold text-[#111]"
            >
              اختيار فيديو
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => void onPick(e.target.files)}
            />
          </div>
          <p className="max-w-lg text-center text-xs leading-6 text-[#777]">
            قص، سرعة، تدوير، صوت، قماش، نص وصور مع تايملاين ومعاينة حية — ثم صدّر
            MP4.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#2a2a2e] bg-[#0e0e10] text-white shadow-xl">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[#2a2a2e] bg-[#161618] px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Clapperboard className="h-4 w-4 text-[#f5c518]" />
          <span className="max-w-[180px] truncate text-[#ddd]">{file.name}</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-md border border-[#333] px-3 py-1.5 text-xs text-[#ccc] hover:bg-[#222]"
          >
            ملف آخر
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => void onPick(e.target.files)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void onExport()}
            className="inline-flex items-center gap-2 rounded-md bg-[#f5c518] px-4 py-1.5 text-sm font-bold text-[#111] disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {busy ? `تصدير ${progress}%` : "التصدير"}
          </button>
        </div>
      </div>

      <div className="grid min-h-[640px] lg:grid-cols-[72px_240px_minmax(0,1fr)]">
        {/* Icon rail */}
        <aside className="flex flex-row gap-1 overflow-x-auto border-b border-[#2a2a2e] bg-[#141416] p-1 lg:flex-col lg:border-b-0 lg:border-e">
          {navBtn("files", "ملفاتي", FileVideo)}
          {navBtn("text", "النص", Type)}
          {navBtn("canvas", "قماش", Ratio)}
          {navBtn("audio", "الصوت", Volume2)}
          {navBtn("record", "تسجيل", Mic)}
        </aside>

        {/* Property panel */}
        <aside className="border-b border-[#2a2a2e] bg-[#17171a] p-3 lg:border-b-0 lg:border-e">
          {panel === "files" && (
            <div className="space-y-3 text-sm">
              <p className="font-semibold text-[#f5c518]">الملف</p>
              <p className="truncate text-xs text-[#aaa]">{file.name}</p>
              <p className="text-xs text-[#777]">
                المدة: {formatTime(duration)} · المقطع: {formatTime(clipDuration)}
              </p>
              <button
                type="button"
                onClick={() => imageRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-[#333] px-3 py-2 text-xs hover:bg-[#222]"
              >
                <ImagePlus className="h-4 w-4" />
                إضافة صورة overlay
              </button>
              <input
                ref={imageRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => void addImageOverlay(e.target.files)}
              />
            </div>
          )}

          {panel === "text" && (
            <div className="space-y-3 text-sm">
              <p className="font-semibold text-[#f5c518]">النص</p>
              <textarea
                className="w-full rounded-md border border-[#333] bg-[#101012] px-2 py-2 text-sm"
                rows={3}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
              />
              <button
                type="button"
                onClick={addTextOverlay}
                className="w-full rounded-md bg-[#2a2a2e] px-3 py-2 text-xs font-semibold hover:bg-[#333]"
              >
                إضافة نص للمعاينة
              </button>
              {selectedOverlay?.type === "text" && (
                <div className="space-y-2 rounded-md border border-[#333] p-2">
                  <label className="text-[11px] text-[#888]">تحرير المحدد</label>
                  <textarea
                    className="w-full rounded border border-[#333] bg-[#101012] px-2 py-1 text-xs"
                    rows={2}
                    value={selectedOverlay.text}
                    onChange={(e) =>
                      setOverlays((prev) =>
                        prev.map((o) =>
                          o.id === selectedOverlay.id && o.type === "text"
                            ? { ...o, text: e.target.value }
                            : o,
                        ),
                      )
                    }
                  />
                  <label className="text-[11px] text-[#888]">
                    الحجم {selectedOverlay.fontSize}
                  </label>
                  <input
                    type="range"
                    min={18}
                    max={96}
                    value={selectedOverlay.fontSize}
                    onChange={(e) =>
                      setOverlays((prev) =>
                        prev.map((o) =>
                          o.id === selectedOverlay.id && o.type === "text"
                            ? { ...o, fontSize: Number(e.target.value) }
                            : o,
                        ),
                      )
                    }
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}

          {panel === "canvas" && (
            <div className="space-y-3 text-sm">
              <p className="font-semibold text-[#f5c518]">القماش</p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["original", "أصلي"],
                    ["16:9", "16:9"],
                    ["9:16", "9:16"],
                    ["1:1", "1:1"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setAspect(id);
                      setVideoBox({ x: 0, y: 0, w: 1, h: 1 });
                    }}
                    className={`rounded-md px-2 py-2 text-xs ${
                      aspect === id
                        ? "bg-[#f5c518] font-bold text-[#111]"
                        : "border border-[#333] text-[#ccc]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] leading-5 text-[#777]">
                الإخراج: {outSize.w}×{outSize.h} — اسحب إطار الفيديو الأصفر
                لتغيير الحجم/الموضع
              </p>
            </div>
          )}

          {panel === "audio" && (
            <div className="space-y-3 text-sm">
              <p className="font-semibold text-[#f5c518]">الصوت</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#aaa]">مستوى الصوت</span>
                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  className="rounded border border-[#333] p-1"
                >
                  {muted ? (
                    <VolumeX className="h-4 w-4 text-red-400" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
              </div>
              <input
                type="range"
                min={0}
                max={200}
                value={Math.round(volume * 100)}
                onChange={(e) => {
                  setVolume(Number(e.target.value) / 100);
                  setMuted(false);
                }}
                className="w-full"
              />
              <label className="block text-[11px] text-[#888]">
                ظهور تدريجي (ث) {fadeIn.toFixed(1)}
              </label>
              <input
                type="range"
                min={0}
                max={5}
                step={0.1}
                value={fadeIn}
                onChange={(e) => setFadeIn(Number(e.target.value))}
                className="w-full"
              />
              <label className="block text-[11px] text-[#888]">
                اختفاء تدريجي (ث) {fadeOut.toFixed(1)}
              </label>
              <input
                type="range"
                min={0}
                max={5}
                step={0.1}
                value={fadeOut}
                onChange={(e) => setFadeOut(Number(e.target.value))}
                className="w-full"
              />
              <button
                type="button"
                onClick={() => {
                  setMuted(true);
                  setVolume(0);
                  setStatus("تم كتم صوت المقطع (يُطبّق عند التصدير)");
                }}
                className="w-full rounded-md border border-[#333] px-2 py-2 text-xs"
              >
                فصل / كتم الصوت
              </button>
            </div>
          )}

          {panel === "record" && (
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-[#f5c518]">تسجيل</p>
              <p className="text-xs leading-6 text-[#888]">
                استخدم أدوات{" "}
                <a href="/tools/screen-recorder" className="text-[#f5c518] underline">
                  مسجل الشاشة
                </a>{" "}
                أو{" "}
                <a href="/tools/video-recorder" className="text-[#f5c518] underline">
                  مسجل الفيديو
                </a>{" "}
                ثم ارفع الناتج هنا.
              </p>
            </div>
          )}

          {/* Shared props for selected video */}
          <div className="mt-4 border-t border-[#2a2a2e] pt-3">
            <div className="mb-2 flex gap-1 rounded-md bg-[#101012] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setPropTab("video")}
                className={`flex-1 rounded px-2 py-1.5 ${
                  propTab === "video" ? "bg-[#2a2a2e] text-white" : "text-[#888]"
                }`}
              >
                فيديو
              </button>
              <button
                type="button"
                onClick={() => {
                  setPropTab("audio");
                  setPanel("audio");
                }}
                className={`flex-1 rounded px-2 py-1.5 ${
                  propTab === "audio" ? "bg-[#2a2a2e] text-white" : "text-[#888]"
                }`}
              >
                صوت
              </button>
            </div>
            {propTab === "video" && (
              <div className="space-y-2 text-xs">
                <label className="text-[#888]">السرعة {speed.toFixed(2)}×</label>
                <input
                  type="range"
                  min={50}
                  max={200}
                  value={Math.round(speed * 100)}
                  onChange={(e) => setSpeed(Number(e.target.value) / 100)}
                  className="w-full"
                />
                <label className="text-[#888]">تدوير</label>
                <div className="grid grid-cols-4 gap-1">
                  {([0, 90, 180, 270] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRotate(r)}
                      className={`rounded py-1 ${
                        rotate === r
                          ? "bg-[#f5c518] font-bold text-[#111]"
                          : "border border-[#333]"
                      }`}
                    >
                      {r}°
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Preview + timeline */}
        <div className="flex min-w-0 flex-col bg-[#0a0a0b]">
          <div className="flex flex-1 items-center justify-center p-4">
            <div
              ref={stageRef}
              className="relative max-h-[48vh] w-full max-w-4xl bg-black shadow-2xl"
              style={{
                aspectRatio: `${outSize.w} / ${outSize.h}`,
              }}
              onPointerMove={onStagePointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onClick={() => setSelectedId("video")}
            >
              <div
                className={`absolute overflow-hidden ${
                  selectedId === "video" ? "ring-2 ring-[#f5c518]" : ""
                }`}
                style={{
                  left: `${videoBox.x * 100}%`,
                  top: `${videoBox.y * 100}%`,
                  width: `${videoBox.w * 100}%`,
                  height: `${videoBox.h * 100}%`,
                  transform: rotate ? `rotate(${rotate}deg)` : undefined,
                }}
                onPointerDown={(e) => onVideoHandleDown(e, "video-move")}
              >
                <video
                  ref={videoRef}
                  src={url}
                  className="h-full w-full object-contain"
                  onLoadedMetadata={onLoadedMeta}
                  onClick={(e) => e.stopPropagation()}
                  playsInline
                />
                {selectedId === "video" && (
                  <div
                    className="absolute bottom-0 right-0 h-3.5 w-3.5 translate-x-1/2 translate-y-1/2 rounded-full border-2 border-[#111] bg-[#f5c518]"
                    onPointerDown={(e) => onVideoHandleDown(e, "video-resize")}
                  />
                )}
              </div>

              {overlays.map((item) => (
                <div
                  key={item.id}
                  className={`absolute z-10 ${
                    selectedId === item.id
                      ? "ring-2 ring-[#f5c518]"
                      : "ring-1 ring-white/30"
                  }`}
                  style={{
                    left: `${item.x * 100}%`,
                    top: `${item.y * 100}%`,
                    width: `${item.w * 100}%`,
                    height: `${item.h * 100}%`,
                  }}
                  onPointerDown={(e) => onOverlayPointerDown(e, item.id, "move")}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(item.id);
                  }}
                >
                  {item.type === "text" ? (
                    <div
                      className="flex h-full w-full items-center justify-center rounded bg-black/50 px-2 text-center font-bold text-white"
                      style={{ fontSize: Math.max(12, item.fontSize * 0.45) }}
                    >
                      {item.text}
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.src}
                      alt=""
                      className="h-full w-full object-contain"
                      draggable={false}
                    />
                  )}
                  {selectedId === item.id && (
                    <div
                      className="absolute bottom-0 right-0 h-3 w-3 translate-x-1/2 translate-y-1/2 rounded-full bg-[#f5c518]"
                      onPointerDown={(e) =>
                        onOverlayPointerDown(e, item.id, "resize")
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Transport */}
          <div className="flex flex-wrap items-center gap-2 border-t border-[#2a2a2e] bg-[#141416] px-3 py-2">
            <button
              type="button"
              onClick={splitAtPlayhead}
              className="rounded border border-[#333] p-1.5 hover:bg-[#222]"
              title="قص"
            >
              <Scissors className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={duplicateSelected}
              className="rounded border border-[#333] p-1.5 hover:bg-[#222]"
              title="نسخ"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={deleteSelected}
              className="rounded border border-[#333] p-1.5 hover:bg-[#222]"
              title="حذف"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <div className="mx-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => seekTo(trimIn)}
                className="rounded p-1.5 hover:bg-[#222]"
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                className="rounded-full bg-[#f5c518] p-2 text-[#111]"
              >
                {playing ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => seekTo(trimOut)}
                className="rounded p-1.5 hover:bg-[#222]"
              >
                <SkipForward className="h-4 w-4" />
              </button>
              <span className="min-w-24 font-mono text-xs text-[#ccc]">
                {formatTime(currentTime)}
              </span>
            </div>
            <label className="flex items-center gap-2 text-[11px] text-[#888]">
              تكبير
              <input
                type="range"
                min={1}
                max={4}
                step={0.1}
                value={timelineZoom}
                onChange={(e) => setTimelineZoom(Number(e.target.value))}
              />
            </label>
          </div>

          {/* Timeline */}
          <div className="border-t border-[#2a2a2e] bg-[#121214] p-3">
            <div
              ref={timelineRef}
              className="relative h-16 overflow-hidden rounded-md bg-[#1a1a1d]"
              style={{ transform: `scaleX(${timelineZoom})`, transformOrigin: "right center" }}
              onPointerMove={onTimelineMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onPointerDown={(e) => onTimelinePointerDown(e, "playhead")}
            >
              {/* Ruler ticks */}
              <div className="pointer-events-none absolute inset-x-0 top-0 flex h-4 justify-between px-1 text-[9px] text-[#666]">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i}>{formatTime((duration * i) / 5)}</span>
                ))}
              </div>

              {/* Clip */}
              <div
                className="absolute top-5 h-9 overflow-hidden rounded border-2 border-amber-400"
                style={{
                  left: `${timelinePct(trimIn)}%`,
                  width: `${Math.max(1, timelinePct(trimOut) - timelinePct(trimIn))}%`,
                  background: "linear-gradient(to left, #5a3a10, #3a2810)",
                }}
              >
                <div className="flex h-full items-center px-2 text-[10px] font-semibold text-amber-400">
                  {file.name}
                </div>
                <div
                  className="absolute inset-y-0 left-0 w-2 cursor-ew-resize bg-amber-400"
                  onPointerDown={(e) => onTimelinePointerDown(e, "trim-in")}
                />
                <div
                  className="absolute inset-y-0 right-0 w-2 cursor-ew-resize bg-amber-400"
                  onPointerDown={(e) => onTimelinePointerDown(e, "trim-out")}
                />
              </div>

              {/* Playhead */}
              <div
                className="absolute top-0 z-20 h-full w-0.5 bg-white"
                style={{ left: `${timelinePct(currentTime)}%` }}
              >
                <div className="absolute -top-0 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-sm bg-white" />
              </div>
            </div>
            <p className="mt-2 text-center text-[11px] text-[#666]">
              ضع الملفات هنا أو اضغط للاختيار · اسحب حواف المقطع للقص
            </p>
          </div>
        </div>
      </div>

      {(status || error) && (
        <div
          className={`border-t px-4 py-2 text-sm ${
            error
              ? "border-red-900 bg-red-950/50 text-red-300"
              : "border-emerald-900 bg-emerald-950/40 text-emerald-300"
          }`}
        >
          {error || status}
        </div>
      )}
    </div>
  );
}
