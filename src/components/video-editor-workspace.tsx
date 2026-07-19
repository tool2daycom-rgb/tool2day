"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type DragEvent as ReactDragEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  AudioLines,
  Clapperboard,
  Copy,
  FileVideo,
  FlipHorizontal,
  FlipVertical,
  Image as ImageIcon,
  ImagePlus,
  Mic,
  Music,
  Pause,
  Play,
  Plus,
  Ratio,
  Scissors,
  SkipBack,
  SkipForward,
  Sticker,
  Trash2,
  Type,
  UnfoldHorizontal,
  Volume2,
  VolumeX,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Hand,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  ChevronUp,
  ChevronDown,
  Undo2,
  Redo2,
} from "lucide-react";
import { exportVideoProject } from "@/lib/processors/video-project";
import { extractAudioTrack } from "@/lib/processors/media";
import { analyzeWaveform } from "@/lib/audio-waveform";
import { speakText, synthesizeToFile } from "@/lib/processors/tts";
import {
  EMOJI_STICKERS,
  STICKER_PHRASES,
  TTS_LANGS,
  VIDEO_FONTS,
} from "@/lib/video-editor-assets";
import { RecordStudio } from "@/components/record-studio";

type Panel =
  | "files"
  | "media"
  | "stickers"
  | "text"
  | "canvas"
  | "record"
  | "tts"
  | "audio";
type PropTab = "video" | "audio";
type Aspect =
  | "original"
  | "9:16"
  | "3:4"
  | "4:5"
  | "1:1"
  | "4:3"
  | "16:9"
  | "21:9"
  | "custom";

const ASPECT_PRESETS: {
  id: Aspect;
  label: string;
  hint: string;
  w: number;
  h: number;
}[] = [
  { id: "9:16", label: "9:16", hint: "TikTok / Reels / Shorts", w: 1080, h: 1920 }, // عرض×ارتفاع عمودي
  { id: "3:4", label: "3:4", hint: "Instagram عمودي", w: 1080, h: 1440 },
  { id: "4:5", label: "4:5", hint: "منشور إنستغرام", w: 1080, h: 1350 },
  { id: "1:1", label: "1:1", hint: "مربع", w: 1080, h: 1080 },
  { id: "4:3", label: "4:3", hint: "كلاسيكي", w: 1440, h: 1080 },
  { id: "16:9", label: "16:9", hint: "يوتيوب / أفقى", w: 1920, h: 1080 },
  { id: "21:9", label: "21:9", hint: "سينمائي عريض", w: 2560, h: 1080 },
  { id: "original", label: "أصلي", hint: "حسب ملف الفيديو", w: 0, h: 0 },
  { id: "custom", label: "مخصص", hint: "أدخل العرض والارتفاع", w: 0, h: 0 },
];

type MediaProfile = {
  w: number;
  h: number;
  fps: number;
};

const SETTINGS_PROMPT_KEY = "tool2day-skip-media-settings-prompt";
const DEFAULT_PROJECT: MediaProfile = { w: 1080, h: 1920, fps: 25 };
const MEDIA_DND_MIME = "application/x-tool2day-media";

type Overlay =
  | {
      id: string;
      type: "text";
      text: string;
      fontSize: number;
      fontFamily: string;
      color: string;
      x: number;
      y: number;
      w: number;
      h: number;
    }
  | {
      id: string;
      type: "emoji";
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
      opacity: number;
    };

type AudioTrack = {
  id: string;
  name: string;
  file: File;
  url: string;
  /** Position on timeline relative to video trimIn (seconds) */
  start: number;
  volume: number;
  /** Visible/play length on timeline */
  duration: number;
  /** Skip into source file (seconds) */
  offset: number;
  /** Full source media duration */
  sourceDuration: number;
  peaks?: number[];
  visible?: boolean;
  locked?: boolean;
  muted?: boolean;
  /** عند التفعيل يُعزف هذا المسار وحده */
  solo?: boolean;
};

type VideoLaneState = {
  visible: boolean;
  locked: boolean;
  muted: boolean;
  solo: boolean;
};

/** مسار فيديو إضافي فوق المسار الأساسي (فيديو 2، 3…) */
type VideoLayerTrack = {
  id: string;
  visible: boolean;
  locked: boolean;
  muted: boolean;
};

/** مقطع فيديو أو صورة على مسار طبقة */
type LayerClip = {
  id: string;
  trackId: string;
  kind: "video" | "image";
  name: string;
  file: File;
  url: string;
  /** موضع على الخط الزمني نسبةً إلى trimIn */
  start: number;
  duration: number;
  offset: number;
  sourceDuration: number;
  x: number;
  y: number;
  w: number;
  h: number;
  opacity: number;
  locked?: boolean;
};

/** مقاطع مسار فيديو 1 بعد القص (للمونتاج بين اللقطات) */
type MainClip = {
  id: string;
  /** موضع على الخط الزمني من بداية المشروع */
  start: number;
  duration: number;
  /** موضع داخل ملف المصدر */
  offset: number;
};

/** ملف مستورد في مكتبة وسائط المشروع (مثل Filmora) */
type MediaAsset = {
  id: string;
  kind: "video" | "image" | "audio";
  name: string;
  file: File;
  url: string;
  duration: number;
};

/** لقطة لحالة المونتاج (تراجع / تقدم) */
type EditorHistorySnapshot = {
  mainClips: MainClip[];
  layerClips: LayerClip[];
  videoLayers: VideoLayerTrack[];
  audioTracks: AudioTrack[];
  overlays: Overlay[];
  mediaLibrary: MediaAsset[];
  videoLane: VideoLaneState;
  videoBox: { x: number; y: number; w: number; h: number };
  trimIn: number;
  trimOut: number;
  volume: number;
  muted: boolean;
  opacity: number;
  rotate: number;
  flipH: boolean;
  flipV: boolean;
  speed: number;
  fadeIn: number;
  fadeOut: number;
  audioPitch: number;
  audioReverse: boolean;
  noiseReduce: boolean;
};

type AudioSection =
  | "volume"
  | "fade"
  | "speed"
  | "voice"
  | "noise"
  | "reverse"
  | "pitch"
  | "eq"
  | null;

function TrackCtrlBtn({
  active,
  danger,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  danger?: boolean;
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`inline-flex h-6 w-6 items-center justify-center rounded transition ${
        danger
          ? "text-red-400 hover:bg-white/10"
          : active
            ? "bg-[#f5c518]/20 text-[#f5c518]"
            : "text-[#bbb] hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

/** أيقونة شكل النسبة في قائمة حجم الفيديو */
function AspectThumb({
  w,
  h,
  active = false,
}: {
  w: number;
  h: number;
  active?: boolean;
}) {
  if (w <= 0 || h <= 0) {
    return (
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded border text-[9px] ${
          active
            ? "border-teal-400 text-teal-300"
            : "border-[#666] text-[#999]"
        }`}
      >
        ✎
      </span>
    );
  }
  const max = 18;
  const ratio = w / h;
  const tw = ratio >= 1 ? max : Math.max(6, Math.round(max * ratio));
  const th = ratio >= 1 ? Math.max(6, Math.round(max / ratio)) : max;
  return (
    <span
      className={`inline-block shrink-0 rounded-[2px] border ${
        active
          ? "border-teal-400 bg-teal-400/25"
          : "border-[#888] bg-[#2a2a2e]"
      }`}
      style={{ width: tw, height: th }}
    />
  );
}

function WaveformBars({
  peaks,
  dimmed = false,
}: {
  peaks: number[];
  dimmed?: boolean;
}) {
  const bars =
    peaks.length > 0 ? peaks : Array.from({ length: 120 }, (_, i) => {
      const a = 0.22 + 0.55 * Math.abs(Math.sin(i * 0.41));
      const b = 0.18 * Math.abs(Math.sin(i * 1.3));
      return Math.min(1, a + b);
    });
  return (
    <div
      className={`flex h-full w-full items-center justify-between gap-[1px] px-[2px] ${
        dimmed ? "opacity-25" : "opacity-100"
      }`}
      aria-hidden
    >
      {bars.map((p, i) => (
        <span
          key={i}
          className="min-w-[2px] flex-1 rounded-[1px] bg-[#8fd4ff]"
          style={{ height: `${Math.max(12, Math.round(p * 90))}%` }}
        />
      ))}
    </div>
  );
}

function slicePeaks(
  peaks: number[],
  start: number,
  end: number,
  total: number,
): number[] {
  if (!peaks.length || !total) return peaks;
  const a = Math.floor((start / total) * peaks.length);
  const b = Math.ceil((end / total) * peaks.length);
  return peaks.slice(a, Math.max(a + 1, b));
}

function peaksForClip(
  peaks: number[] | undefined,
  offset: number,
  clipDur: number,
  sourceDur: number,
): number[] {
  if (!peaks?.length) return [];
  return slicePeaks(peaks, offset, offset + clipDur, sourceDur || 1);
}

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
  custom?: { w: number; h: number },
): { w: number; h: number } {
  if (aspect === "custom" && custom) {
    return {
      w: Math.max(64, Math.min(3840, Math.round(custom.w) || 1080)),
      h: Math.max(64, Math.min(3840, Math.round(custom.h) || 1920)),
    };
  }
  const preset = ASPECT_PRESETS.find((p) => p.id === aspect);
  if (preset && preset.w > 0 && preset.h > 0) {
    return { w: preset.w, h: preset.h };
  }
  const max = 1280;
  if (videoW >= videoH) {
    return { w: max, h: Math.round((max * videoH) / Math.max(1, videoW)) };
  }
  return { w: Math.round((max * videoW) / Math.max(1, videoH)), h: max };
}

type VideoResizeCorner = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

/** يضع الفيديو داخل القماش بنسبة احتواء مع هامش للتحريك */
function fitVideoInCanvas(
  canvasW: number,
  canvasH: number,
  mediaW: number,
  mediaH: number,
  pad = 0.12,
): { x: number; y: number; w: number; h: number } {
  const cw = Math.max(1, canvasW);
  const ch = Math.max(1, canvasH);
  const mw = Math.max(1, mediaW || cw);
  const mh = Math.max(1, mediaH || ch);
  const canvasRatio = cw / ch;
  const mediaRatio = mw / mh;
  const maxSpan = 1 - pad * 2;
  let w: number;
  let h: number;
  if (mediaRatio > canvasRatio) {
    w = maxSpan;
    h = (w * cw) / mediaRatio / ch;
  } else {
    h = maxSpan;
    w = (h * ch * mediaRatio) / cw;
  }
  w = Math.min(maxSpan, Math.max(0.15, w));
  h = Math.min(maxSpan, Math.max(0.15, h));
  return {
    x: (1 - w) / 2,
    y: (1 - h) / 2,
    w,
    h,
  };
}

function nextId(counterRef: { current: number }, prefix: string) {
  counterRef.current += 1;
  return `${prefix}-${counterRef.current}`;
}

function loadMediaDuration(src: string): Promise<number> {
  return new Promise((resolve) => {
    const a = new Audio();
    a.preload = "metadata";
    a.onloadedmetadata = () => resolve(a.duration || 0);
    a.onerror = () => resolve(0);
    a.src = src;
  });
}

/** Keep context menu fully inside the viewport (opens upward near bottom). */
function clampMenuPos(
  x: number,
  y: number,
  w = 220,
  h = 280,
): { x: number; y: number } {
  const pad = 10;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  let left = x;
  let top = y;
  if (y + h > vh - pad) top = Math.max(pad, y - h);
  if (left + w > vw - pad) left = vw - w - pad;
  if (left < pad) left = pad;
  if (top < pad) top = pad;
  if (top + h > vh - pad) top = Math.max(pad, vh - h - pad);
  return { x: left, y: top };
}

export function VideoEditorWorkspace({
  fullscreen = false,
}: {
  fullscreen?: boolean;
}) {
  const idCounterRef = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const musicRef = useRef<HTMLInputElement>(null);
  const videoSwapRef = useRef<HTMLInputElement>(null);
  const layerMediaRef = useRef<HTMLInputElement>(null);
  const importAllRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const blurVideoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const scrollSyncLock = useRef(false);
  const layerTargetTrackRef = useRef<string | null>(null);
  const layerVideoElsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const splitAtPlayheadRef = useRef<() => void>(() => {});
  /** معرّف وسائط المكتبة أثناء السحب (HTML5) — احتياطي إن فشل getData */
  const draggingAssetIdRef = useRef<string | null>(null);
  const dragRef = useRef<{
    kind:
      | "move"
      | "resize"
      | "trim-in"
      | "trim-out"
      | "playhead"
      | "video-move"
      | "video-resize"
      | "video-rotate"
      | "audio-move"
      | "audio-trim-in"
      | "audio-trim-out"
      | "layer-move"
      | "layer-trim-in"
      | "layer-trim-out"
      | "main-move"
      | "main-trim-in"
      | "main-trim-out";
    id?: string;
    corner?: VideoResizeCorner | "se";
    startX: number;
    startY: number;
    ox: number;
    oy: number;
    ow: number;
    oh: number;
    /** مسار الطبقة أثناء السحب العمودي */
    laneId?: string;
    /** فراغ جاهز للتثبيت عند الإفلات */
    gapSnap?: { start: number; duration: number; leftId: string };
  } | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const fileLiveRef = useRef<File | null>(null);
  const urlLiveRef = useRef<string | null>(null);
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
  const [audioPitch, setAudioPitch] = useState(1);
  const [audioReverse, setAudioReverse] = useState(false);
  const [noiseReduce, setNoiseReduce] = useState(false);
  const [audioSection, setAudioSection] = useState<AudioSection>("volume");
  const [videoPeaks, setVideoPeaks] = useState<number[]>([]);
  const audioElsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const audioClipboardRef = useRef<Omit<AudioTrack, "id"> | null>(null);
  const [rotate, setRotate] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [aspect, setAspect] = useState<Aspect>("original");
  const [customSize, setCustomSize] = useState({ w: 1080, h: 1920 });
  const [scaleLock, setScaleLock] = useState(true);
  const [aspectMenuOpen, setAspectMenuOpen] = useState(false);
  const aspectMenuRef = useRef<HTMLDivElement>(null);
  const [bgBlurEnabled, setBgBlurEnabled] = useState(false);
  const [bgBlurAmount, setBgBlurAmount] = useState(60);
  const [canvasBg, setCanvasBg] = useState("#000000");
  const [projectProfile, setProjectProfile] =
    useState<MediaProfile>(DEFAULT_PROJECT);
  const [lockProjectSize, setLockProjectSize] = useState(false);
  const [mediaPrompt, setMediaPrompt] = useState<{
    media: MediaProfile;
    skipChecked: boolean;
  } | null>(null);
  const settingsPromptedRef = useRef<string | null>(null);
  const [videoBox, setVideoBox] = useState({
    x: 0.05,
    y: 0.05,
    w: 0.9,
    h: 0.9,
  });
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [selectedId, setSelectedId] = useState<string | "video" | "audio">(
    "video",
  );
  const [draftText, setDraftText] = useState("عنوان الفيديو");
  const [draftFont, setDraftFont] = useState<string>(VIDEO_FONTS[0].id);
  const [draftColor, setDraftColor] = useState("#ffffff");
  const [draftFontSize, setDraftFontSize] = useState(42);
  const [ttsText, setTtsText] = useState("");
  const [ttsLang, setTtsLang] = useState<string>(TTS_LANGS[0].id);
  const [ttsRate, setTtsRate] = useState(1);
  const [ttsPitch, setTtsPitch] = useState(1);
  const [ttsBusy, setTtsBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [timelineZoom, setTimelineZoom] = useState(1); // 0.15 (بعيد) → 10 (قريب)
  const [previewTool, setPreviewTool] = useState<"select" | "hand">("select");
  const [videoLane, setVideoLane] = useState<VideoLaneState>({
    visible: true,
    locked: false,
    muted: false,
    solo: false,
  });
  const [videoLayers, setVideoLayers] = useState<VideoLayerTrack[]>([]);
  const [layerClips, setLayerClips] = useState<LayerClip[]>([]);
  const [mainClips, setMainClips] = useState<MainClip[]>([]);
  const [mediaLibrary, setMediaLibrary] = useState<MediaAsset[]>([]);
  const [mediaImportBusy, setMediaImportBusy] = useState(false);
  const [timelineDropTarget, setTimelineDropTarget] = useState<string | null>(
    null,
  );
  const [mediaDragActive, setMediaDragActive] = useState(false);
  const [showRecordStudio, setShowRecordStudio] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const historyPastRef = useRef<EditorHistorySnapshot[]>([]);
  const historyFutureRef = useRef<EditorHistorySnapshot[]>([]);
  const historyPresentRef = useRef<EditorHistorySnapshot | null>(null);
  const historySkipRef = useRef(false);
  const historyReadyRef = useRef(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const ctxMenuRef = useRef<HTMLDivElement>(null);
  const [detachBusy, setDetachBusy] = useState(false);
  const [cropEnabled, setCropEnabled] = useState(false);
  const [crop, setCrop] = useState({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const [chromaEnabled, setChromaEnabled] = useState(false);
  const [chromaColor, setChromaColor] = useState("#00ff00");
  const [chromaSensitivity, setChromaSensitivity] = useState(30);
  const [logoEnabled, setLogoEnabled] = useState(false);
  const [logoBox, setLogoBox] = useState({ x: 20, y: 20, w: 120, h: 60 });
  const [videoTool, setVideoTool] = useState<
    "none" | "crop" | "chroma" | "logo" | "speed"
  >("none");

  const outSize = useMemo(() => {
    // نسب التواصل (9:16 وغيرها) تفرض أبعاد الإخراج دائماً — مثل تيك توك
    const preset = ASPECT_PRESETS.find((p) => p.id === aspect);
    if (preset && preset.w > 0 && preset.h > 0) {
      return { w: preset.w, h: preset.h };
    }
    if (aspect === "custom") {
      return aspectSize("custom", videoNatural.w, videoNatural.h, customSize);
    }
    if (lockProjectSize) {
      return { w: projectProfile.w, h: projectProfile.h };
    }
    return aspectSize("original", videoNatural.w, videoNatural.h, customSize);
  }, [aspect, videoNatural, lockProjectSize, projectProfile, customSize]);

  const stageHostRef = useRef<HTMLDivElement>(null);
  const [stagePx, setStagePx] = useState({ w: 270, h: 480 });

  useLayoutEffect(() => {
    const host = stageHostRef.current;
    if (!host) return;
    const update = () => {
      const rw = host.clientWidth;
      const rh = host.clientHeight;
      if (rw < 4 || rh < 4) return;
      const scale = Math.min(rw / outSize.w, rh / outSize.h);
      setStagePx({
        w: Math.max(2, Math.round(outSize.w * scale)),
        h: Math.max(2, Math.round(outSize.h * scale)),
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(host);
    return () => ro.disconnect();
  }, [outSize.w, outSize.h, fullscreen]);

  const aspectLabel =
    aspect === "custom"
      ? "مخصص"
      : aspect === "original"
        ? "أصلي"
        : aspect;

  function applyAspect(id: Aspect) {
    setAspect(id);
    setLockProjectSize(false);
    const preset = ASPECT_PRESETS.find((p) => p.id === id);
    let nextOut = aspectSize(id, videoNatural.w, videoNatural.h, customSize);
    if (preset && preset.w > 0 && preset.h > 0) {
      setCustomSize({ w: preset.w, h: preset.h });
      setProjectProfile((p) => ({ ...p, w: preset.w, h: preset.h }));
      nextOut = { w: preset.w, h: preset.h };
      // ابدأ بحجم قابل للتحريك (مثل Filmora) — ليس ملتصقاً 100% فيمنع السحب
      setVideoBox(
        fitVideoInCanvas(
          nextOut.w,
          nextOut.h,
          videoNatural.w || nextOut.w,
          videoNatural.h || nextOut.h,
          0.06,
        ),
      );
    } else if (id === "custom") {
      setProjectProfile((p) => ({
        ...p,
        w: customSize.w,
        h: customSize.h,
      }));
      nextOut = aspectSize("custom", videoNatural.w, videoNatural.h, customSize);
      setVideoBox({ x: 0, y: 0, w: 1, h: 1 });
    } else {
      setVideoBox(
        fitVideoInCanvas(
          nextOut.w,
          nextOut.h,
          videoNatural.w || nextOut.w,
          videoNatural.h || nextOut.h,
        ),
      );
    }
    setStatus(`قماش ${id === "original" ? "أصلي" : id}: ${nextOut.w}×${nextOut.h}`);
    setAspectMenuOpen(false);
    setPanel("canvas");
    setPropTab("video");
    setSelectedId("video");
  }

  function updateVideoScale(axis: "w" | "h", pct: number) {
    const v = Math.min(3, Math.max(0.05, pct / 100));
    setVideoBox((b) => {
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      if (scaleLock) {
        const nw = v;
        const nh = v;
        return {
          w: nw,
          h: nh,
          x: cx - nw / 2,
          y: cy - nh / 2,
        };
      }
      const nw = axis === "w" ? v : b.w;
      const nh = axis === "h" ? v : b.h;
      return {
        w: nw,
        h: nh,
        x: axis === "w" ? cx - nw / 2 : b.x,
        y: axis === "h" ? cy - nh / 2 : b.y,
      };
    });
  }

  function updateVideoPos(axis: "x" | "y", pct: number) {
    const v = Math.min(150, Math.max(-150, pct)) / 100;
    setVideoBox((b) => {
      if (axis === "x") return { ...b, x: v };
      return { ...b, y: v };
    });
  }

  const clipDuration = Math.max(0.1, trimOut - trimIn);

  const projectEnd = useMemo(() => {
    const mainEnd = mainClips.reduce(
      (m, c) => Math.max(m, c.start + c.duration),
      0,
    );
    const layerEnd = layerClips.reduce(
      (m, c) => Math.max(m, c.start + c.duration),
      0,
    );
    const audioEnd = audioTracks.reduce(
      (m, c) => Math.max(m, c.start + c.duration),
      0,
    );
    return Math.max(duration, mainEnd, layerEnd, audioEnd, 0.1);
  }, [mainClips, layerClips, audioTracks, duration]);

  function captureHistorySnapshot(): EditorHistorySnapshot {
    return {
      mainClips: mainClips.map((c) => ({ ...c })),
      layerClips: layerClips.map((c) => ({ ...c })),
      videoLayers: videoLayers.map((t) => ({ ...t })),
      audioTracks: audioTracks.map((t) => ({
        ...t,
        peaks: t.peaks ? [...t.peaks] : undefined,
      })),
      overlays: overlays.map((o) => ({ ...o })),
      mediaLibrary: mediaLibrary.map((a) => ({ ...a })),
      videoLane: { ...videoLane },
      videoBox: { ...videoBox },
      trimIn,
      trimOut,
      volume,
      muted,
      opacity,
      rotate,
      flipH,
      flipV,
      speed,
      fadeIn,
      fadeOut,
      audioPitch,
      audioReverse,
      noiseReduce,
    };
  }

  function historyFingerprint(s: EditorHistorySnapshot): string {
    return JSON.stringify({
      mainClips: s.mainClips,
      layerClips: s.layerClips.map(
        ({ file: _f, url: _u, ...rest }) => rest,
      ),
      videoLayers: s.videoLayers,
      audioTracks: s.audioTracks.map(
        ({ file: _f, url: _u, peaks: _p, ...rest }) => rest,
      ),
      overlays: s.overlays.map((o) =>
        o.type === "image"
          ? { id: o.id, type: o.type, x: o.x, y: o.y, w: o.w, h: o.h, opacity: o.opacity }
          : o,
      ),
      mediaLibrary: s.mediaLibrary.map(({ id, kind, name, duration: d }) => ({
        id,
        kind,
        name,
        duration: d,
      })),
      videoLane: s.videoLane,
      videoBox: s.videoBox,
      trimIn: s.trimIn,
      trimOut: s.trimOut,
      volume: s.volume,
      muted: s.muted,
      opacity: s.opacity,
      rotate: s.rotate,
      flipH: s.flipH,
      flipV: s.flipV,
      speed: s.speed,
      fadeIn: s.fadeIn,
      fadeOut: s.fadeOut,
      audioPitch: s.audioPitch,
      audioReverse: s.audioReverse,
      noiseReduce: s.noiseReduce,
    });
  }

  function applyHistorySnapshot(s: EditorHistorySnapshot) {
    historySkipRef.current = true;
    setMainClips(s.mainClips.map((c) => ({ ...c })));
    setLayerClips(s.layerClips.map((c) => ({ ...c })));
    setVideoLayers(s.videoLayers.map((t) => ({ ...t })));
    setAudioTracks(
      s.audioTracks.map((t) => ({
        ...t,
        peaks: t.peaks ? [...t.peaks] : undefined,
      })),
    );
    setOverlays(s.overlays.map((o) => ({ ...o })));
    setMediaLibrary(s.mediaLibrary.map((a) => ({ ...a })));
    setVideoLane({ ...s.videoLane });
    setVideoBox({ ...s.videoBox });
    setTrimIn(s.trimIn);
    setTrimOut(s.trimOut);
    setVolume(s.volume);
    setMuted(s.muted);
    setOpacity(s.opacity);
    setRotate(s.rotate);
    setFlipH(s.flipH);
    setFlipV(s.flipV);
    setSpeed(s.speed);
    setFadeIn(s.fadeIn);
    setFadeOut(s.fadeOut);
    setAudioPitch(s.audioPitch);
    setAudioReverse(s.audioReverse);
    setNoiseReduce(s.noiseReduce);
  }

  function clearEditorHistory() {
    historyPastRef.current = [];
    historyFutureRef.current = [];
    historyPresentRef.current = null;
    historyReadyRef.current = false;
    historySkipRef.current = false;
    setCanUndo(false);
    setCanRedo(false);
  }

  function undoEdit() {
    if (historyPastRef.current.length === 0) return;
    const present = captureHistorySnapshot();
    const prev = historyPastRef.current.pop()!;
    historyFutureRef.current.push(present);
    historyPresentRef.current = prev;
    applyHistorySnapshot(prev);
    setCanUndo(historyPastRef.current.length > 0);
    setCanRedo(true);
    setStatus("تراجع خطوة");
    setError(null);
  }

  function redoEdit() {
    if (historyFutureRef.current.length === 0) return;
    const present = captureHistorySnapshot();
    const next = historyFutureRef.current.pop()!;
    historyPastRef.current.push(present);
    historyPresentRef.current = next;
    applyHistorySnapshot(next);
    setCanUndo(true);
    setCanRedo(historyFutureRef.current.length > 0);
    setStatus("تقدم خطوة");
    setError(null);
  }

  const undoEditRef = useRef(undoEdit);
  const redoEditRef = useRef(redoEdit);
  undoEditRef.current = undoEdit;
  redoEditRef.current = redoEdit;

  useEffect(() => {
    if (!aspectMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (
        aspectMenuRef.current &&
        !aspectMenuRef.current.contains(e.target as Node)
      ) {
        setAspectMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [aspectMenuOpen]);

  // تسجيل تلقائي لتاريخ التعديلات بعد استقرار الحالة
  useEffect(() => {
    if (!file) {
      clearEditorHistory();
      return;
    }
    if (historySkipRef.current) {
      historySkipRef.current = false;
      historyPresentRef.current = captureHistorySnapshot();
      return;
    }
    const timer = window.setTimeout(() => {
      const snap = captureHistorySnapshot();
      if (!historyReadyRef.current || !historyPresentRef.current) {
        historyPresentRef.current = snap;
        historyReadyRef.current = true;
        setCanUndo(false);
        setCanRedo(false);
        return;
      }
      if (
        historyFingerprint(historyPresentRef.current) ===
        historyFingerprint(snap)
      ) {
        return;
      }
      historyPastRef.current.push(historyPresentRef.current);
      if (historyPastRef.current.length > 40) {
        historyPastRef.current.shift();
      }
      historyPresentRef.current = snap;
      historyFutureRef.current = [];
      setCanUndo(true);
      setCanRedo(false);
    }, 400);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    file,
    mainClips,
    layerClips,
    videoLayers,
    audioTracks,
    overlays,
    mediaLibrary,
    videoLane,
    videoBox,
    trimIn,
    trimOut,
    volume,
    muted,
    opacity,
    rotate,
    flipH,
    flipV,
    speed,
    fadeIn,
    fadeOut,
    audioPitch,
    audioReverse,
    noiseReduce,
  ]);

  function mainClipAt(t: number) {
    return (
      mainClips.find(
        (c) => t >= c.start - 0.001 && t < c.start + c.duration,
      ) ?? null
    );
  }

  function syncVideoToTimeline(t: number) {
    const v = videoRef.current;
    if (!v) return;
    const clip = mainClipAt(t);
    if (!clip) {
      if (!v.paused) v.pause();
      const blur = blurVideoRef.current;
      if (blur && !blur.paused) blur.pause();
      return;
    }
    const mediaT = clip.offset + (t - clip.start);
    if (Math.abs(v.currentTime - mediaT) > 0.2) {
      v.currentTime = Math.max(0, mediaT);
    }
    const blur = blurVideoRef.current;
    if (blur && bgBlurEnabled) {
      if (Math.abs(blur.currentTime - mediaT) > 0.25) {
        try {
          blur.currentTime = Math.max(0, mediaT);
        } catch {
          /* ignore seek race */
        }
      }
    }
  }

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = speed;
    // When an audio lane owns sound, keep the video element silent
    const hasAudioLane = audioTracks.some(
      (t) => t.id === "linked-audio" || t.id.startsWith("detached-"),
    );
    const anySolo =
      videoLane.solo || audioTracks.some((t) => t.solo);
    if (hasAudioLane) {
      v.muted = true;
      v.volume = 0;
    } else {
      const silent =
        muted ||
        videoLane.muted ||
        !videoLane.visible ||
        (anySolo && !videoLane.solo);
      v.volume = silent ? 0 : volume;
      v.muted = silent;
    }
  }, [speed, volume, muted, audioTracks, videoLane]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setCurrentTime((prev) => {
        const next = Math.min(projectEnd, prev + 0.04 * speed);
        if (next >= projectEnd - 0.04) {
          const v = videoRef.current;
          if (v) v.pause();
          setPlaying(false);
          syncVideoToTimeline(0);
          return 0;
        }
        syncVideoToTimeline(next);
        const v = videoRef.current;
        const clip = mainClipAt(next);
        if (clip && v && v.paused) void v.play().catch(() => undefined);
        if (!clip && v && !v.paused) v.pause();
        return next;
      });
    }, 40);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, projectEnd, speed, mainClips]);

  // Keep audio-lane elements in sync with the playhead (supports left/right offset)
  useEffect(() => {
    const map = audioElsRef.current;
    const liveIds = new Set(audioTracks.map((t) => t.id));
    const anySolo =
      videoLane.solo || audioTracks.some((t) => t.solo);
    for (const [id, el] of map) {
      if (!liveIds.has(id)) {
        el.pause();
        el.src = "";
        map.delete(id);
      }
    }
    for (const t of audioTracks) {
      let el = map.get(t.id);
      if (!el) {
        el = new Audio(t.url);
        el.preload = "auto";
        map.set(t.id, el);
      }
      const silencedBySolo = anySolo && !t.solo;
      const silent =
        t.muted ||
        t.visible === false ||
        t.volume <= 0 ||
        silencedBySolo;
      el.volume = silent ? 0 : Math.max(0, Math.min(1, t.volume));
      const timelineLocal = currentTime - trimIn - t.start;
      if (
        t.visible !== false &&
        timelineLocal >= 0 &&
        timelineLocal < t.duration - 0.02
      ) {
        const mediaTime = (t.offset || 0) + timelineLocal;
        if (Math.abs(el.currentTime - mediaTime) > 0.3) {
          el.currentTime = Math.max(0, mediaTime);
        }
        if (playing && el.paused) void el.play().catch(() => undefined);
        if (!playing && !el.paused) el.pause();
      } else if (!el.paused) {
        el.pause();
      }
    }
  }, [audioTracks, currentTime, playing, trimIn, videoLane.solo]);

  // Sync layered video clips with the playhead
  useEffect(() => {
    const map = layerVideoElsRef.current;
    for (const clip of layerClips) {
      if (clip.kind !== "video") continue;
      const el = map.get(clip.id);
      if (!el) continue;
      const track = videoLayers.find((t) => t.id === clip.trackId);
      if (!track?.visible) {
        if (!el.paused) el.pause();
        continue;
      }
      el.muted = true;
      const local = currentTime - trimIn - clip.start;
      if (local >= 0 && local < clip.duration - 0.02) {
        const mediaTime = clip.offset + local;
        if (Math.abs(el.currentTime - mediaTime) > 0.35) {
          el.currentTime = Math.max(0, mediaTime);
        }
        if (playing && el.paused) void el.play().catch(() => undefined);
        if (!playing && !el.paused) el.pause();
      } else if (!el.paused) {
        el.pause();
      }
    }
  }, [layerClips, videoLayers, currentTime, playing, trimIn]);

  useEffect(() => {
    return () => {
      layerVideoElsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    return () => {
      for (const el of audioElsRef.current.values()) {
        el.pause();
        el.src = "";
      }
      audioElsRef.current.clear();
    };
  }, []);

  useLayoutEffect(() => {
    if (!ctxMenu || !ctxMenuRef.current) return;
    const rect = ctxMenuRef.current.getBoundingClientRect();
    const next = clampMenuPos(ctxMenu.x, ctxMenu.y, rect.width, rect.height);
    if (next.x !== ctxMenu.x || next.y !== ctxMenu.y) {
      setCtxMenu(next);
    }
  }, [ctxMenu]);

  useEffect(() => {
    if (!ctxMenu) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setCtxMenu(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ctxMenu]);

  const TIMELINE_ZOOM_MIN = 0.15;
  const TIMELINE_ZOOM_MAX = 10;

  useEffect(() => {
    const scroll = timelineScrollRef.current;
    if (!scroll) return;
    function onWheel(e: WheelEvent) {
      // Ctrl/⌘/Alt + عجلة = تكبير. غير ذلك تمرير حر (أعلى/أسفل/يمين/يسار)
      if (!(e.ctrlKey || e.metaKey || e.altKey)) return;
      e.preventDefault();
      const dir = e.deltaY > 0 ? -1 : 1;
      setTimelineZoom((z) => {
        const step = z <= 1 ? 0.1 : 0.25;
        const next = Math.round((z + dir * step) * 100) / 100;
        return Math.min(TIMELINE_ZOOM_MAX, Math.max(TIMELINE_ZOOM_MIN, next));
      });
    }
    scroll.addEventListener("wheel", onWheel, { passive: false });
    return () => scroll.removeEventListener("wheel", onWheel);
  }, [file, url]);

  function syncHeaderScroll() {
    const a = timelineScrollRef.current;
    const b = headerScrollRef.current;
    if (!a || !b || scrollSyncLock.current) return;
    scrollSyncLock.current = true;
    b.scrollTop = a.scrollTop;
    scrollSyncLock.current = false;
  }

  function syncTimelineScroll() {
    const a = timelineScrollRef.current;
    const b = headerScrollRef.current;
    if (!a || !b || scrollSyncLock.current) return;
    scrollSyncLock.current = true;
    a.scrollTop = b.scrollTop;
    scrollSyncLock.current = false;
  }

  function bumpTimelineZoom(delta: number) {
    setTimelineZoom((z) => {
      const step = delta < 0 && z <= 1.5 ? Math.min(Math.abs(delta), 0.15) * Math.sign(delta) || delta : delta;
      const next = Math.round((z + step) * 100) / 100;
      return Math.min(TIMELINE_ZOOM_MAX, Math.max(TIMELINE_ZOOM_MIN, next));
    });
  }

  function fitTimelineZoom() {
    setTimelineZoom(1);
    const el = timelineScrollRef.current;
    if (el) el.scrollTo({ left: 0, top: 0, behavior: "smooth" });
    setStatus("تكبير لتناسب الخط الزمني بشكل افضل");
  }
  useEffect(() => {
    if (!file) return;
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
      } else if (
        (e.key === "z" || e.key === "Z") &&
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey
      ) {
        e.preventDefault();
        redoEditRef.current();
      } else if ((e.key === "z" || e.key === "Z") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        undoEditRef.current();
      } else if ((e.key === "y" || e.key === "Y") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        redoEditRef.current();
      } else if ((e.key === "b" || e.key === "B") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        splitAtPlayheadRef.current();
      } else if ((e.key === "s" || e.key === "S") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        splitAtPlayheadRef.current();
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        copySelected();
      } else if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        duplicateSelected();
      } else if (e.key === "v" || e.key === "V") {
        e.preventDefault();
        pasteAudioFromClipboard();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setPrimaryAudioVolume(muted || volume <= 0 ? 1 : 0);
      } else if ((e.key === "z" || e.key === "Z") && e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        fitTimelineZoom();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, selectedId, audioTracks, muted, volume]);

  async function onPick(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    await loadVideoFile(f);
  }

  async function loadVideoFile(f: File) {
    if (url) URL.revokeObjectURL(url);
    const next = URL.createObjectURL(f);
    fileLiveRef.current = f;
    urlLiveRef.current = next;
    clearEditorHistory();
    setFile(f);
    setUrl(next);
    setOverlays((prev) => {
      prev.forEach((o) => {
        if (o.type === "image") URL.revokeObjectURL(o.src);
      });
      return [];
    });
    setAudioTracks((prev) => {
      prev.forEach((t) => {
        if (t.id !== "linked-audio") URL.revokeObjectURL(t.url);
      });
      return [];
    });
    setLayerClips((prev) => {
      prev.forEach((c) => URL.revokeObjectURL(c.url));
      return [];
    });
    setVideoLayers([]);
    setMainClips([]);
    setMediaLibrary((prev) => {
      prev.forEach((a) => URL.revokeObjectURL(a.url));
      return [];
    });
    setVideoPeaks([]);
    setMuted(false);
    setVolume(1);
    setFadeIn(0);
    setFadeOut(0);
    setAudioPitch(1);
    setAudioReverse(false);
    setNoiseReduce(false);
    setFlipH(false);
    setFlipV(false);
    setOpacity(1);
    setSelectedId("video");
    setError(null);
    setStatus(`تم تحميل: ${f.name}`);
    setPanel("files");
    setShowRecordStudio(false);
    settingsPromptedRef.current = null;
    void analyzeWaveform(f, 240).then((peaks) => {
      setVideoPeaks(peaks);
      setAudioTracks((prev) =>
        prev.map((t) =>
          t.id === "linked-audio" || t.id.startsWith("detached-")
            ? { ...t, peaks }
            : t,
        ),
      );
      setStatus(`تم تحميل: ${f.name} · ذبذبات الصوت جاهزة`);
    });
  }

  function onLoadedMeta() {
    const v = videoRef.current;
    if (!v) return;
    const d = v.duration || 0;
    const mw = v.videoWidth || 1280;
    const mh = v.videoHeight || 720;
    setDuration(d);
    setTrimIn(0);
    setTrimOut(d);
    setCurrentTime(0);
    setVideoNatural({ w: mw, h: mh });
    const canvas = lockProjectSize
      ? { w: projectProfile.w, h: projectProfile.h }
      : aspectSize(aspect, mw, mh, customSize);
    setVideoBox(fitVideoInCanvas(canvas.w, canvas.h, mw, mh));
    setMainClips([
      {
        id: nextId(idCounterRef, "main"),
        start: 0,
        duration: d,
        offset: 0,
      },
    ]);
    // Always create a movable blue audio lane under the video
    const liveFile = fileLiveRef.current;
    const liveUrl = urlLiveRef.current;
    if (liveFile && liveUrl && d > 0) {
      setAudioTracks([
        {
          id: "linked-audio",
          name: liveFile.name,
          file: liveFile,
          url: liveUrl,
          start: 0,
          volume: 1,
          duration: d,
          offset: 0,
          sourceDuration: d,
          peaks: videoPeaks,
        },
      ]);
      setSelectedId("linked-audio");
      setPanel("audio");
      setPropTab("audio");
    }

    const media: MediaProfile = { w: mw, h: mh, fps: 30 };
    const fileKey = liveFile ? `${liveFile.name}-${liveFile.size}-${mw}x${mh}` : null;
    if (fileKey && settingsPromptedRef.current === fileKey) return;
    if (fileKey) settingsPromptedRef.current = fileKey;

    const skip =
      typeof window !== "undefined" &&
      window.localStorage.getItem(SETTINGS_PROMPT_KEY) === "1";
    const differs =
      media.w !== projectProfile.w ||
      media.h !== projectProfile.h ||
      media.fps !== projectProfile.fps;

    if (skip) {
      // Default: match media when user opted out of the prompt
      applyMatchMedia(media);
      return;
    }
    if (differs) {
      setMediaPrompt({ media, skipChecked: false });
    } else {
      applyMatchMedia(media);
    }
  }

  function applyMatchMedia(media: MediaProfile) {
    setProjectProfile(media);
    setLockProjectSize(false);
    setAspect("original");
    setVideoNatural({ w: media.w, h: media.h });
    setVideoBox(fitVideoInCanvas(media.w, media.h, media.w, media.h));
    setStatus(`تمت مطابقة المشروع مع الوسائط: ${media.w}×${media.h} ${media.fps}fps`);
    setMediaPrompt(null);
  }

  function applyKeepSettings() {
    setLockProjectSize(true);
    setAspect("original");
    setStatus(
      `تم الإبقاء على إعدادات المشروع: ${projectProfile.w}×${projectProfile.h} ${projectProfile.fps}fps`,
    );
    setMediaPrompt(null);
  }

  function confirmMediaPrompt(mode: "keep" | "match") {
    if (!mediaPrompt) return;
    if (mediaPrompt.skipChecked && typeof window !== "undefined") {
      window.localStorage.setItem(SETTINGS_PROMPT_KEY, "1");
    }
    if (mode === "match") applyMatchMedia(mediaPrompt.media);
    else applyKeepSettings();
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    const blur = blurVideoRef.current;
    if (playing) {
      v.pause();
      blur?.pause();
      setPlaying(false);
      return;
    }
    if (currentTime >= projectEnd - 0.05) {
      setCurrentTime(0);
      syncVideoToTimeline(0);
    } else {
      syncVideoToTimeline(currentTime);
    }
    const clip = mainClipAt(currentTime >= projectEnd - 0.05 ? 0 : currentTime);
    if (clip) {
      void v.play().catch(() => undefined);
      if (bgBlurEnabled && blur) void blur.play().catch(() => undefined);
    }
    setPlaying(true);
  }

  function seekTo(t: number) {
    const clamped = Math.min(projectEnd, Math.max(0, t));
    setCurrentTime(clamped);
    syncVideoToTimeline(clamped);
  }

  function setPrimaryAudioVolume(next: number) {
    const v = Math.max(0, Math.min(2, next));
    setVolume(v);
    setMuted(v <= 0);
    setAudioTracks((prev) =>
      prev.map((t) =>
        t.id === "linked-audio" || t.id.startsWith("detached-")
          ? { ...t, volume: v }
          : t,
      ),
    );
  }

  async function detachAudio() {
    // فيديو طبقة محدد → افصل صوته إلى مسار مستقل
    const selectedLayer = layerClips.find(
      (c) => c.id === selectedId && c.kind === "video",
    );
    const sourceFile = selectedLayer?.file || file;
    if (!sourceFile) {
      setError("لا يوجد فيديو لفصل الصوت منه");
      return;
    }

    const alreadyFromLayer = selectedLayer
      ? audioTracks.some(
          (t) =>
            t.id.startsWith("detached-") &&
            Math.abs(t.start - selectedLayer.start) < 0.08 &&
            t.name.endsWith("(صوت)"),
        )
      : false;
    if (selectedLayer && alreadyFromLayer) {
      setStatus("صوت هذا المقطع مفصول مسبقاً — اسحب المسار الأزرق");
      return;
    }

    // للفيديو الأساسي: إن وُجد linked فقط حوّله لمسار detached مستقل
    if (!selectedLayer) {
      const linked = audioTracks.find((t) => t.id === "linked-audio");
      if (linked && !audioTracks.some((t) => t.id.startsWith("detached-"))) {
        const id = nextId(idCounterRef, "detached");
        setAudioTracks((prev) => [
          ...prev.filter((t) => t.id !== "linked-audio"),
          { ...linked, id, name: `${linked.name} (مفصول)` },
        ]);
        setMuted(true);
        setVolume(0);
        setSelectedId(id);
        setStatus("تم فصل الصوت عن الفيديو — اسحب المسار الأزرق بحرية");
        setPanel("audio");
        setPropTab("audio");
        return;
      }
      if (audioTracks.some((t) => t.id.startsWith("detached-")) && !selectedLayer) {
        setMuted(true);
        setVolume(0);
        setStatus("الصوت مفصول — الفيديو صامت والمسار الأزرق مستقل");
        return;
      }
    }

    setDetachBusy(true);
    setError(null);
    setStatus(
      selectedLayer
        ? `جاري فصل صوت «${selectedLayer.name}»…`
        : "جاري فصل الصوت عن الفيديو…",
    );
    try {
      const audioFile = await extractAudioTrack(sourceFile, (r) =>
        setProgress(Math.round(r * 100)),
      );
      const audioUrl = URL.createObjectURL(audioFile);
      const dur =
        (await loadMediaDuration(audioUrl)) ||
        selectedLayer?.sourceDuration ||
        clipDuration;
      const peaks = await analyzeWaveform(audioFile, 180);
      const id = nextId(idCounterRef, "detached");
      const startAt = selectedLayer
        ? selectedLayer.start
        : (audioTracks.find((t) => t.id === "linked-audio")?.start ?? 0);
      const playDur = selectedLayer
        ? Math.min(dur, selectedLayer.duration)
        : dur;

      setAudioTracks((prev) => {
        const withoutLinked = selectedLayer
          ? prev
          : prev.filter(
              (t) => t.id !== "linked-audio" && !t.id.startsWith("detached-"),
            );
        return [
          ...withoutLinked,
          {
            id,
            name: selectedLayer
              ? `${selectedLayer.name} (صوت)`
              : sourceFile.name,
            file: audioFile,
            url: audioUrl,
            start: startAt,
            volume: 1,
            duration: playDur,
            offset: selectedLayer?.offset ?? 0,
            sourceDuration: dur,
            peaks,
          },
        ];
      });

      if (selectedLayer) {
        // أبقِ طبقة الفيديو صامتة (الصوت على المسار الأزرق)
        setVideoLayers((prev) =>
          prev.map((t) =>
            t.id === selectedLayer.trackId ? { ...t, muted: true } : t,
          ),
        );
      } else {
        setMuted(true);
        setVolume(0);
      }
      setSelectedId(id);
      setStatus("تم فصل الصوت — اسحب المسار الأزرق يمين/يسار");
      setPanel("audio");
      setPropTab("audio");
      setAudioSection("volume");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "فشل فصل الصوت");
    } finally {
      setDetachBusy(false);
      setProgress(0);
    }
  }

  function getSelectedAudioTrack(): AudioTrack | null {
    if (selectedId === "audio") {
      return (
        audioTracks.find((t) => t.id === "linked-audio") ||
        audioTracks.find((t) => t.id.startsWith("detached-")) ||
        audioTracks[0] ||
        null
      );
    }
    return audioTracks.find((t) => t.id === selectedId) ?? null;
  }

  function findGapAt(t: number): { start: number; duration: number; leftId: string } | null {
    const sorted = [...mainClips].sort((a, b) => a.start - b.start);
    for (let i = 0; i < sorted.length - 1; i++) {
      const left = sorted[i]!;
      const right = sorted[i + 1]!;
      const gapStart = left.start + left.duration;
      const gapEnd = right.start;
      if (gapEnd - gapStart > 0.08 && t >= gapStart - 0.02 && t <= gapEnd + 0.02) {
        return { start: gapStart, duration: gapEnd - gapStart, leftId: left.id };
      }
    }
    return null;
  }

  /** هل المؤشر فوق مسارات الفيديو (طبقات أو فيديو 1) لإفلات الفراغ؟ */
  function isPointerOverVideoArea(clientY: number): boolean {
    const el = timelineRef.current;
    const scroll = timelineScrollRef.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const y = clientY - rect.top + (scroll?.scrollTop || 0);
    const RULER = 22;
    const VIDEO_H = 36;
    const layerH = VIDEO_H + 4;
    const top = RULER;
    const bottom =
      RULER + 2 + videoLayers.length * layerH + VIDEO_H + 28;
    return y >= top && y <= bottom;
  }

  /** هل المؤشر فوق مسار فيديو 1 أو أسفل الطبقات (منطقة الإنزال للفراغ)؟ */
  function isPointerOverBaseVideo(clientY: number): boolean {
    return isPointerOverVideoArea(clientY);
  }

  /** أقرب مسار طبقة لفيديو 1 (الأسفل) */
  function bottomLayerTrackId(): string | null {
    return videoLayers[0]?.id ?? null;
  }

  /** ثبّت طبقة موجودة داخل فراغ بين مقطعي فيديو 1 وأنزلها للمسار الأسفل */
  function snapLayerIntoGap(
    clipId: string,
    gap: { start: number; duration: number; leftId?: string },
    trackId?: string | null,
  ) {
    const relStart = Math.max(0, gap.start - trimIn);
    const destTrack = trackId || bottomLayerTrackId();
    setLayerClips((prev) =>
      prev.map((c) => {
        if (c.id !== clipId) return c;
        const playDur = Math.min(
          Math.max(0.15, c.sourceDuration || c.duration),
          gap.duration,
        );
        return {
          ...c,
          start: relStart,
          duration: playDur,
          offset: 0,
          trackId: destTrack || c.trackId,
        };
      }),
    );
    setTimelineDropTarget(
      gap.leftId ? `gap-${gap.leftId}` : `gap-${gap.start}`,
    );
    setStatus(
      `تم إنزال المونتاج إلى الفراغ (${formatTime(gap.duration)}) بين اللقطتين`,
    );
    setError(null);
  }

  function nearestGapToTime(absTime: number): {
    start: number;
    duration: number;
    leftId: string;
  } | null {
    const exact = findGapAt(absTime);
    if (exact) return exact;
    const sorted = [...mainClips].sort((a, b) => a.start - b.start);
    let best: { start: number; duration: number; leftId: string } | null =
      null;
    let bestDist = Infinity;
    for (let i = 0; i < sorted.length - 1; i++) {
      const left = sorted[i]!;
      const right = sorted[i + 1]!;
      const gs = left.start + left.duration;
      const ge = right.start;
      if (ge - gs < 0.15) continue;
      const mid = (gs + ge) / 2;
      const dist = Math.abs(absTime - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = { start: gs, duration: ge - gs, leftId: left.id };
      }
    }
    return best;
  }

  /** يجد مقطعاً قابلاً للقص تحت/قرب الخط الأحمر (حتى عند الحافة) */
  function resolveCutTime<
    T extends { start: number; duration: number },
  >(
    clips: T[],
    cutAt: number,
  ): { clip: T; at: number } | null {
    const MIN = 0.05;
    // داخل المقطع بشكل صارم
    for (const c of clips) {
      const edge = Math.min(MIN, Math.max(0.02, c.duration / 5));
      if (cutAt >= c.start + edge && cutAt <= c.start + c.duration - edge) {
        return { clip: c, at: cutAt };
      }
    }
    // قرب الحافة → قص قليلاً داخل المقطع
    let best: { clip: T; at: number; dist: number } | null = null;
    for (const c of clips) {
      if (c.duration < MIN * 2) continue;
      const edge = Math.min(MIN, c.duration / 5);
      const dStart = cutAt - c.start;
      if (dStart >= -0.2 && dStart < edge) {
        const cand = { clip: c, at: c.start + edge, dist: Math.abs(dStart) };
        if (!best || cand.dist < best.dist) best = cand;
      }
      const end = c.start + c.duration;
      const dEnd = end - cutAt;
      if (dEnd >= -0.2 && dEnd < edge) {
        const cand = { clip: c, at: end - edge, dist: Math.abs(dEnd) };
        if (!best || cand.dist < best.dist) best = cand;
      }
    }
    return best ? { clip: best.clip, at: best.at } : null;
  }

  /** يقص المقطع تحت الخط الأحمر؛ على فيديو 1 يفتح فراغاً ويزحزح الصوت/الطبقات بعده */
  function splitAtPlayhead() {
    const rawCut = currentTime;
    const localCut = Math.max(0, rawCut - trimIn);
    const INSERT_GAP = 3;

    if (videoLane.locked) {
      setError("مسار الفيديو مقفل — افتح القفل ثم اضغط المقص");
      return;
    }

    const clips =
      mainClips.length > 0
        ? mainClips
        : duration > 0
          ? [
              {
                id: "main-1",
                start: 0,
                duration,
                offset: 0,
              } satisfies MainClip,
            ]
          : [];

    // 1) فيديو 1 → قص + فراغ + مزامنة الصوت/الطبقات
    // mainClips تستخدم زمن المشروع المطلق (مثل رأس التشغيل)
    const mainHit = resolveCutTime(clips, rawCut);
    if (mainHit) {
      const cutAt = mainHit.at;
      const mainUnder = mainHit.clip;
      const local = cutAt - mainUnder.start;
      const rightId = nextId(idCounterRef, "main");
      const left: MainClip = { ...mainUnder, duration: local };
      const right: MainClip = {
        id: rightId,
        start: mainUnder.start + local + INSERT_GAP,
        offset: mainUnder.offset + local,
        duration: mainUnder.duration - local,
      };
      const nextClips = [
        ...clips.filter((c) => c.id !== mainUnder.id),
        left,
        right,
      ].sort((a, b) => a.start - b.start);
      setMainClips(nextClips);
      setTrimIn(0);
      setTrimOut(
        nextClips.reduce((m, c) => Math.max(m, c.start + c.duration), duration),
      );

      setLayerClips((prev) =>
        prev.flatMap((c) => {
          const absStart = trimIn + c.start;
          const end = absStart + c.duration;
          if (cutAt > absStart + 0.04 && cutAt < end - 0.04) {
            const aLocal = cutAt - absStart;
            const rightLayerId = nextId(idCounterRef, "lsplit");
            return [
              { ...c, duration: aLocal },
              {
                ...c,
                id: rightLayerId,
                name: `${c.name} (2)`,
                start: c.start + aLocal + INSERT_GAP,
                offset: c.offset + aLocal,
                duration: c.duration - aLocal,
              },
            ];
          }
          if (absStart >= cutAt - 0.04) {
            return [{ ...c, start: c.start + INSERT_GAP }];
          }
          return [c];
        }),
      );

      setAudioTracks((prev) =>
        prev.flatMap((t) => {
          const absStart = trimIn + t.start;
          const absEnd = absStart + t.duration;
          if (cutAt > absStart + 0.04 && cutAt < absEnd - 0.04) {
            const aLocal = cutAt - absStart;
            const rightAudioId = nextId(idCounterRef, "audio");
            return [
              { ...t, duration: aLocal },
              {
                ...t,
                id: rightAudioId,
                name: `${t.name} (2)`,
                start: t.start + aLocal + INSERT_GAP,
                offset: (t.offset || 0) + aLocal,
                duration: t.duration - aLocal,
              },
            ];
          }
          if (absStart >= cutAt - 0.04) {
            return [{ ...t, start: t.start + INSERT_GAP }];
          }
          return [t];
        }),
      );

      setSelectedId("video");
      setError(null);
      // أنشئ مسار فيديو 2 فوق الفراغ إن لم يوجد
      if (videoLayers.length === 0) {
        const tid = nextId(idCounterRef, "vtrack");
        setVideoLayers([
          { id: tid, visible: true, locked: false, muted: true },
        ]);
      }
      setStatus(
        `تم القص عند ${formatTime(cutAt)} — اسحب فيديو/صورة من المكتبة وأفلته على «فوق الفراغ»`,
      );
      return;
    }

    // 2) طبقات المونتاج (موضعها نسبي إلى trimIn)
    const layerHits = layerClips
      .map((c) => {
        const hit = resolveCutTime(
          [{ ...c, start: trimIn + c.start }],
          rawCut,
        );
        if (!hit) return null;
        return { clip: c, at: hit.at - trimIn };
      })
      .filter(Boolean) as { clip: LayerClip; at: number }[];
    if (layerHits.length > 0) {
      setLayerClips((prev) => {
        let next = [...prev];
        for (const hit of layerHits) {
          const layerUnder = next.find((c) => c.id === hit.clip.id);
          if (!layerUnder) continue;
          const cutAt = hit.at;
          const local = cutAt - layerUnder.start;
          if (local <= 0.04 || local >= layerUnder.duration - 0.04) continue;
          const rightId = nextId(idCounterRef, "lsplit");
          next = [
            ...next.filter((c) => c.id !== layerUnder.id),
            { ...layerUnder, duration: local },
            {
              ...layerUnder,
              id: rightId,
              name: `${layerUnder.name} (2)`,
              start: layerUnder.start + local,
              offset: layerUnder.offset + local,
              duration: layerUnder.duration - local,
            },
          ];
        }
        return next;
      });
      setSelectedId(layerHits[0]!.clip.id);
      setError(null);
      setStatus(`تم تقسيم الطبقة عند ${formatTime(rawCut)}`);
      return;
    }

    // 3) صوت تحت الخط (موضعه نسبي إلى trimIn)
    const audioHit = resolveCutTime(
      audioTracks.map((t) => ({ ...t, start: trimIn + t.start })),
      rawCut,
    );
    if (audioHit) {
      const t = audioTracks.find((a) => a.id === audioHit.clip.id);
      if (t) {
        const cutLocal = audioHit.at - trimIn;
        const aLocal = cutLocal - t.start;
        const rightAudioId = nextId(idCounterRef, "audio");
        setAudioTracks((prev) => [
          ...prev.filter((x) => x.id !== t.id),
          { ...t, duration: aLocal },
          {
            ...t,
            id: rightAudioId,
            name: `${t.name} (2)`,
            start: t.start + aLocal,
            offset: (t.offset || 0) + aLocal,
            duration: t.duration - aLocal,
          },
        ]);
        setSelectedId(rightAudioId);
        setError(null);
        setStatus(`تم تقسيم الصوت عند ${formatTime(rawCut)}`);
        return;
      }
    }

    if (findGapAt(rawCut) || findGapAt(localCut)) {
      setError(
        "الخط الأحمر على الفراغ — حرّكه فوق مقطع فيديو ثم اضغط المقص",
      );
      return;
    }
    setError("ضع الخط الأحمر فوق مقطع فيديو ثم اضغط المقص (أو B)");
  }
  splitAtPlayheadRef.current = splitAtPlayhead;

  /** كل الفراغات بين مقاطع فيديو 1 */
  function listMainGaps(): {
    start: number;
    duration: number;
    leftId: string;
  }[] {
    const sorted = [...mainClips].sort((a, b) => a.start - b.start);
    const gaps: { start: number; duration: number; leftId: string }[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const left = sorted[i]!;
      const right = sorted[i + 1]!;
      const gapStart = left.start + left.duration;
      const gapDur = right.start - gapStart;
      if (gapDur >= 0.15) {
        gaps.push({
          start: gapStart,
          duration: gapDur,
          leftId: left.id,
        });
      }
    }
    return gaps;
  }

  /** مسار طبقة فارغ فوق فيديو 1، أو إنشاء مسار جديد */
  function resolveTrackForGapPlacement(): {
    trackId?: string;
    newTrack: boolean;
  } {
    // فضّل المسار الأدنى (فيديو 2) إن كان فارغاً أو غير مقفل
    const bottom = videoLayers[0];
    if (bottom && !bottom.locked) {
      return { trackId: bottom.id, newTrack: false };
    }
    const empty = videoLayers.find(
      (t) => !t.locked && !layerClips.some((c) => c.trackId === t.id),
    );
    if (empty) return { trackId: empty.id, newTrack: false };
    return { newTrack: true };
  }

  async function handleGapDrop(
    e: ReactDragEvent,
    gapStart: number,
    gapDur: number,
  ) {
    e.preventDefault();
    e.stopPropagation();
    setTimelineDropTarget(null);
    setMediaDragActive(false);
    const assetId =
      e.dataTransfer.getData(MEDIA_DND_MIME) ||
      e.dataTransfer.getData("text/plain") ||
      draggingAssetIdRef.current ||
      "";
    draggingAssetIdRef.current = null;
    const asset = mediaLibrary.find((a) => a.id === assetId);
    if (asset && asset.kind !== "audio") {
      await insertMediaInGap(gapStart, gapDur, null, asset);
      setStatus("تم وضع المقطع فوق الفراغ بين اللقطتين");
      return;
    }
    const f = e.dataTransfer.files?.[0];
    if (f && (f.type.startsWith("video/") || f.type.startsWith("image/"))) {
      const trackOpts = resolveTrackForGapPlacement();
      await placeFileAsLayer(f, {
        start: gapStart - trimIn + 0.01,
        trackId: trackOpts.trackId,
        newTrack: trackOpts.newTrack,
        fitGap: true,
      });
      setStatus("تم وضع المقطع فوق الفراغ بين اللقطتين");
      return;
    }
    // حتى بدون بيانات السحب: إن وُجدت وسائط بصرية ضع آخرها
    const lastVisual = [...mediaLibrary]
      .reverse()
      .find((a) => a.kind !== "audio");
    if (lastVisual) {
      await insertMediaInGap(gapStart, gapDur, null, lastVisual);
      return;
    }
    await insertMediaInGap(gapStart, gapDur);
  }

  function finalizeLayerPointerDrag() {
    const drag = dragRef.current;
    if (!drag || drag.kind !== "layer-move" || !drag.id) {
      dragRef.current = null;
      setTimelineDropTarget(null);
      return;
    }
    const destTrack = bottomLayerTrackId() || drag.laneId;
    if (drag.gapSnap) {
      snapLayerIntoGap(drag.id, drag.gapSnap, destTrack);
      setStatus("تم إنزال المقطع فوق الفراغ بين اللقطتين");
    } else if (drag.laneId) {
      const dest = drag.laneId;
      setLayerClips((prev) =>
        prev.map((c) =>
          c.id === drag.id && c.trackId !== dest
            ? { ...c, trackId: dest }
            : c,
        ),
      );
      setStatus("تم تحريك المقطع — اسحب بحرية لأي وقت أو مسار");
    }
    dragRef.current = null;
    setTimelineDropTarget(null);
  }

  function onPointerUp() {
    finalizeLayerPointerDrag();
  }

  async function insertMediaInGap(
    gapStart: number,
    gapDur: number,
    list?: FileList | null,
    asset?: MediaAsset | null,
  ) {
    const gap = { start: gapStart, duration: gapDur };
    const trackOpts = resolveTrackForGapPlacement();
    const placeStart = gapStart - trimIn + 0.01;

    // إن كان مقطع طبقة محدداً — أنزله إلى الفراغ مباشرة
    const selectedLayer = layerClips.find((c) => c.id === selectedId);
    if (selectedLayer && !asset && !list?.[0]) {
      snapLayerIntoGap(
        selectedLayer.id,
        { ...gap, leftId: findGapAt(gapStart + 0.01)?.leftId },
        trackOpts.trackId || bottomLayerTrackId(),
      );
      return;
    }

    if (asset && asset.kind !== "audio") {
      await placeAssetOnTimeline(asset, {
        start: placeStart,
        trackId: trackOpts.trackId,
        newTrack: trackOpts.newTrack,
        fitGap: true,
      });
      setStatus("تم وضع المونتاج في الفراغ بين اللقطتين");
      return;
    }
    if (list?.[0]) {
      await placeFileAsLayer(list[0], {
        start: placeStart,
        trackId: trackOpts.trackId,
        newTrack: trackOpts.newTrack,
        fitGap: true,
      });
      return;
    }

    // اضغط على الفراغ → افتح منتقي الملفات مباشرة (لا تعتمد على سحب قد يفشل)
    layerTargetTrackRef.current = trackOpts.trackId || null;
    const input = layerMediaRef.current;
    if (!input) {
      // احتياطي: من المكتبة
      const lastVisual = [...mediaLibrary]
        .reverse()
        .find((a) => a.kind !== "audio");
      if (lastVisual) {
        await placeAssetOnTimeline(lastVisual, {
          start: placeStart,
          trackId: trackOpts.trackId,
          newTrack: trackOpts.newTrack,
          fitGap: true,
        });
        setStatus(`وُضع «${lastVisual.name}» في الفراغ بين اللقطتين`);
      } else {
        setError("لا يوجد ملف — استورد فيديو/صورة من وسائط المشروع أولاً");
      }
      return;
    }
    const onChange = async () => {
      input.removeEventListener("change", onChange);
      const f = input.files?.[0];
      if (f) {
        await placeFileAsLayer(f, {
          start: placeStart,
          trackId: trackOpts.trackId,
          newTrack: trackOpts.newTrack,
          fitGap: true,
        });
        setStatus("تم وضع المونتاج في الفراغ بين اللقطتين");
      }
      input.value = "";
    };
    input.addEventListener("change", onChange);
    input.click();
  }

  function copySelected() {
    const track = getSelectedAudioTrack();
    if (track) {
      audioClipboardRef.current = {
        name: track.name,
        file: track.file,
        url: track.url,
        start: track.start,
        volume: track.volume,
        duration: track.duration,
        offset: track.offset || 0,
        sourceDuration: track.sourceDuration || track.duration,
        peaks: track.peaks,
      };
      setStatus("تم نسخ مسار الصوت — الصق بالتكرار أو من القائمة");
      return;
    }
    const ov = overlays.find((o) => o.id === selectedId);
    if (ov) {
      setStatus("تم نسخ العنصر — استخدم تكرار للإضافة");
      return;
    }
    setStatus("حدّد مسار الصوت الأزرق أولاً للنسخ");
  }

  function duplicateSelected() {
    const track = getSelectedAudioTrack();
    if (track) {
      const id = nextId(
        idCounterRef,
        track.id.startsWith("detached") ? "detached" : "audio",
      );
      const start = Math.min(
        Math.max(0, duration - track.duration),
        track.start + Math.max(0.4, track.duration * 0.05),
      );
      setAudioTracks((prev) => [
        ...prev,
        {
          ...track,
          id,
          name: `${track.name} نسخة`,
          start,
        },
      ]);
      setSelectedId(id);
      setStatus("تم تكرار مسار الصوت");
      return;
    }
    const ov = overlays.find((o) => o.id === selectedId);
    if (!ov) {
      setStatus("حدّد مسار الصوت للتكرار");
      return;
    }
    const id = nextId(idCounterRef, ov.type[0]);
    setOverlays((prev) => [
      ...prev,
      {
        ...ov,
        id,
        x: Math.min(0.8, ov.x + 0.04),
        y: Math.min(0.8, ov.y + 0.04),
      },
    ]);
    setSelectedId(id);
  }

  function pasteAudioFromClipboard() {
    const clip = audioClipboardRef.current;
    if (!clip) {
      setStatus("لا يوجد صوت منسوخ — انسخ المسار أولاً");
      return;
    }
    const id = nextId(idCounterRef, "audio");
    const start = Math.max(0, currentTime - trimIn);
    setAudioTracks((prev) => [
      ...prev,
      {
        ...clip,
        id,
        name: `${clip.name} ملصق`,
        start,
      },
    ]);
    setSelectedId(id);
    setStatus("تم لصق مسار الصوت");
  }

  function deleteSelected() {
    const track = getSelectedAudioTrack();
    if (track) {
      if (track.id === "linked-audio") {
        setPrimaryAudioVolume(0);
        setAudioTracks((prev) => prev.filter((t) => t.id !== "linked-audio"));
        setStatus("تم حذف مسار الصوت (صامت)");
        setSelectedId("video");
        return;
      }
      setAudioTracks((prev) => {
        const othersShare = prev.some(
          (t) => t.id !== track.id && t.url === track.url,
        );
        if (!othersShare && track.url !== url) {
          URL.revokeObjectURL(track.url);
        }
        return prev.filter((t) => t.id !== track.id);
      });
      setSelectedId("video");
      setStatus("تم حذف مسار الصوت");
      return;
    }
    const layer = layerClips.find((c) => c.id === selectedId);
    if (layer) {
      removeLayerClip(layer.id);
      setSelectedId("video");
      setStatus("تم حذف طبقة المونتاج");
      return;
    }
    if (selectedId === "video" || selectedId === "audio") return;
    setOverlays((prev) => {
      const victim = prev.find((o) => o.id === selectedId);
      if (victim?.type === "image") URL.revokeObjectURL(victim.src);
      return prev.filter((o) => o.id !== selectedId);
    });
    setSelectedId("video");
  }

  function addTextOverlay() {
    const id = nextId(idCounterRef, "t");
    setOverlays((prev) => [
      ...prev,
      {
        id,
        type: "text",
        text: draftText || "نص",
        fontSize: draftFontSize,
        fontFamily: draftFont,
        color: draftColor,
        x: 0.15,
        y: 0.35,
        w: 0.7,
        h: 0.14,
      },
    ]);
    setSelectedId(id);
    setPanel("text");
    setStatus("اسحب النص على المعاينة لتغيير موقعه");
  }

  function addEmojiOverlay(emoji: string) {
    const id = nextId(idCounterRef, "e");
    setOverlays((prev) => [
      ...prev,
      {
        id,
        type: "emoji",
        text: emoji,
        fontSize: 96,
        x: 0.38,
        y: 0.32,
        w: 0.24,
        h: 0.24,
      },
    ]);
    setSelectedId(id);
    setStatus("اسحب الملصق لتغيير موقعه وحجمه");
  }

  function addPhraseOverlay(phrase: string) {
    const id = nextId(idCounterRef, "p");
    setOverlays((prev) => [
      ...prev,
      {
        id,
        type: "text",
        text: phrase,
        fontSize: 56,
        fontFamily: "Impact, sans-serif",
        color: "#f5c518",
        x: 0.12,
        y: 0.72,
        w: 0.76,
        h: 0.16,
      },
    ]);
    setSelectedId(id);
    setPanel("text");
    setStatus("اسحب العبارة لتغيير موقعها");
  }

  async function addImageOverlay(list: FileList | null) {
    await addLayerMedia(list);
  }

  async function uploadMusic(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    const trackUrl = URL.createObjectURL(f);
    const dur = await loadMediaDuration(trackUrl);
    const peaks = await analyzeWaveform(f, 120);
    const id = nextId(idCounterRef, "music");
    setAudioTracks((prev) => [
      ...prev,
      {
        id,
        name: f.name,
        file: f,
        url: trackUrl,
        start: Math.max(0, currentTime - trimIn),
        volume: 1,
        duration: dur,
        offset: 0,
        sourceDuration: dur,
        peaks,
      },
    ]);
    setSelectedId(id);
    setPanel("audio");
    setStatus(`تمت إضافة الموسيقى: ${f.name}`);
  }

  function removeAudioTrack(id: string) {
    setAudioTracks((prev) => {
      const victim = prev.find((t) => t.id === id);
      if (victim && victim.id !== "linked-audio" && victim.url !== url) {
        URL.revokeObjectURL(victim.url);
      }
      return prev.filter((t) => t.id !== id);
    });
  }

  async function ttsPreview() {
    if (!ttsText.trim()) {
      setError("اكتب نصاً أولاً");
      return;
    }
    setTtsBusy(true);
    setError(null);
    try {
      const langInfo = TTS_LANGS.find((l) => l.id === ttsLang);
      await speakText(ttsText, {
        lang: langInfo?.speak || "ar-SA",
        rate: ttsRate,
        pitch: ttsPitch,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تشغيل المعاينة");
    } finally {
      setTtsBusy(false);
    }
  }

  async function ttsAddToTimeline() {
    if (!ttsText.trim()) {
      setError("اكتب نصاً أولاً");
      return;
    }
    setTtsBusy(true);
    setError(null);
    try {
      const audioFile = await synthesizeToFile(ttsText, { lang: ttsLang });
      const trackUrl = URL.createObjectURL(audioFile);
      const dur = await loadMediaDuration(trackUrl);
      const peaks = await analyzeWaveform(audioFile, 80);
      const id = nextId(idCounterRef, "tts");
      setAudioTracks((prev) => [
        ...prev,
        {
          id,
          name: audioFile.name,
          file: audioFile,
          url: trackUrl,
          start: Math.max(0, currentTime - trimIn),
          volume: 1,
          duration: dur,
          offset: 0,
          sourceDuration: dur,
          peaks,
        },
      ]);
      setStatus("تمت إضافة التعليق الصوتي إلى المخطط الزمني");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل توليد الصوت");
    } finally {
      setTtsBusy(false);
    }
  }

  function onOverlayPointerDown(
    e: ReactPointerEvent,
    id: string,
    kind: "move" | "resize",
  ) {
    e.preventDefault();
    e.stopPropagation();
    const layer = layerClips.find((c) => c.id === id);
    if (layer) {
      const track = videoLayers.find((t) => t.id === layer.trackId);
      if (layer.locked || track?.locked) {
        setStatus("المسار مقفل — افتح القفل للتعديل");
        setSelectedId(id);
        return;
      }
      setSelectedId(id);
      dragRef.current = {
        kind,
        id,
        corner: "se",
        startX: e.clientX,
        startY: e.clientY,
        ox: layer.x,
        oy: layer.y,
        ow: layer.w,
        oh: layer.h,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }
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
    kind: "video-move" | "video-resize" | "video-rotate",
    corner: VideoResizeCorner = "se",
  ) {
    e.preventDefault();
    e.stopPropagation();
    if (videoLane.locked) {
      setStatus("مسار الفيديو مقفل — افتح القفل للتعديل");
      setSelectedId("video");
      return;
    }
    setSelectedId("video");
    setPropTab("video");
    let startAngle = 0;
    if (kind === "video-rotate" && stageRef.current) {
      const rect = stageRef.current.getBoundingClientRect();
      const cx = rect.left + (videoBox.x + videoBox.w / 2) * rect.width;
      const cy = rect.top + (videoBox.y + videoBox.h / 2) * rect.height;
      startAngle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
    }
    dragRef.current = {
      kind,
      corner,
      startX: e.clientX,
      startY: e.clientY,
      ox: kind === "video-rotate" ? rotate : videoBox.x,
      oy: kind === "video-rotate" ? startAngle : videoBox.y,
      ow: videoBox.w,
      oh: videoBox.h,
    };

    const onMove = (ev: PointerEvent) => {
      applyMainVideoDrag(ev.clientX, ev.clientY);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (
        dragRef.current?.kind === "video-move" ||
        dragRef.current?.kind === "video-resize" ||
        dragRef.current?.kind === "video-rotate"
      ) {
        dragRef.current = null;
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function applyMainVideoDrag(clientX: number, clientY: number) {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage) return;
    if (
      drag.kind !== "video-move" &&
      drag.kind !== "video-resize" &&
      drag.kind !== "video-rotate"
    ) {
      return;
    }
    const rect = stage.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;

    if (drag.kind === "video-rotate") {
      const centerX = rect.left + (videoBox.x + videoBox.w / 2) * rect.width;
      const centerY = rect.top + (videoBox.y + videoBox.h / 2) * rect.height;
      const ang =
        (Math.atan2(clientY - centerY, clientX - centerX) * 180) / Math.PI;
      let next = drag.ox + (ang - drag.oy);
      const norm = ((next % 360) + 360) % 360;
      const snapped = [0, 90, 180, 270].find((a) => Math.abs(norm - a) < 3);
      if (snapped !== undefined) next = snapped;
      setRotate(Math.round(next * 10) / 10);
      return;
    }

    const dx = (clientX - drag.startX) / rect.width;
    const dy = (clientY - drag.startY) / rect.height;
    const min = 0.08;

    if (drag.kind === "video-move") {
      // حرية التحريك مثل Filmora — حتى خارج حدود القماش
      setVideoBox({
        x: Math.max(-1.5, Math.min(1.5, drag.ox + dx)),
        y: Math.max(-1.5, Math.min(1.5, drag.oy + dy)),
        w: drag.ow,
        h: drag.oh,
      });
      return;
    }

    const corner = (drag.corner as VideoResizeCorner) || "se";
    let x = drag.ox;
    let y = drag.oy;
    let w = drag.ow;
    let h = drag.oh;

    if (corner === "e" || corner === "ne" || corner === "se") {
      w = Math.max(min, drag.ow + dx);
    }
    if (corner === "s" || corner === "se" || corner === "sw") {
      h = Math.max(min, drag.oh + dy);
    }
    if (corner === "w" || corner === "nw" || corner === "sw") {
      w = Math.max(min, drag.ow - dx);
      x = drag.ox + drag.ow - w;
    }
    if (corner === "n" || corner === "nw" || corner === "ne") {
      h = Math.max(min, drag.oh - dy);
      y = drag.oy + drag.oh - h;
    }

    if (
      scaleLock &&
      (corner === "nw" || corner === "ne" || corner === "sw" || corner === "se")
    ) {
      const ratio = drag.ow / Math.max(0.001, drag.oh);
      if (Math.abs(dx) * rect.width >= Math.abs(dy) * rect.height) {
        h = Math.max(min, w / ratio);
        if (corner === "nw" || corner === "ne") y = drag.oy + drag.oh - h;
        if (corner === "nw" || corner === "sw") x = drag.ox + drag.ow - w;
      } else {
        w = Math.max(min, h * ratio);
        if (corner === "nw" || corner === "sw") x = drag.ox + drag.ow - w;
        if (corner === "nw" || corner === "ne") y = drag.oy + drag.oh - h;
      }
    }

    w = Math.min(3, Math.max(min, w));
    h = Math.min(3, Math.max(min, h));
    setVideoBox({ x, y, w, h });
  }

  function onStagePointerMove(e: ReactPointerEvent) {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage) return;
    if (
      drag.kind === "video-move" ||
      drag.kind === "video-resize" ||
      drag.kind === "video-rotate"
    ) {
      applyMainVideoDrag(e.clientX, e.clientY);
      return;
    }
    const rect = stage.getBoundingClientRect();
    const dx = (e.clientX - drag.startX) / rect.width;
    const dy = (e.clientY - drag.startY) / rect.height;
    if ((drag.kind === "move" || drag.kind === "resize") && drag.id) {
      if (layerClips.some((c) => c.id === drag.id)) {
        setLayerClips((prev) =>
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
        return;
      }
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

  function timelinePct(t: number) {
    const d = projectEnd || duration;
    if (!d) return 0;
    return (t / d) * 100;
  }

  function timeFromClientX(clientX: number) {
    const el = timelineRef.current;
    const d = projectEnd || duration;
    if (!el || !d) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * d;
  }

  function onTimelinePointerDown(e: ReactPointerEvent, kind: "playhead" | "trim-in" | "trim-out") {
    e.preventDefault();
    e.stopPropagation();
    if (
      (kind === "trim-in" || kind === "trim-out") &&
      videoLane.locked
    ) {
      setStatus("مسار الفيديو مقفل — افتح القفل للتعديل");
      setSelectedId("video");
      return;
    }
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

  function onAudioClipPointerDown(
    e: ReactPointerEvent,
    id: string,
    kind: "audio-move" | "audio-trim-in" | "audio-trim-out",
  ) {
    e.preventDefault();
    e.stopPropagation();
    const track = audioTracks.find((t) => t.id === id);
    if (!track) return;
    if (track.locked) {
      setStatus("المسار مقفل — افتح القفل للتعديل");
      setSelectedId(id);
      return;
    }
    setSelectedId(id);
    setPanel("audio");
    setPropTab("audio");
    dragRef.current = {
      kind,
      id,
      startX: e.clientX,
      startY: e.clientY,
      ox: track.start,
      oy: track.offset || 0,
      ow: track.duration,
      oh: track.sourceDuration || track.duration,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function patchAudioTrack(
    id: string,
    patch: Partial<
      Pick<AudioTrack, "visible" | "locked" | "muted" | "volume" | "solo">
    >,
  ) {
    setAudioTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  }

  function toggleVideoLane(key: keyof VideoLaneState) {
    setVideoLane((v) => {
      const next = { ...v, [key]: !v[key] };
      if (key === "muted" && next.muted) {
        setMuted(true);
        setVolume(0);
      }
      if (key === "muted" && !next.muted) {
        setMuted(false);
        setVolume(1);
      }
      return next;
    });
  }

  function toggleAudioSolo(id: string) {
    setAudioTracks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, solo: !t.solo } : t,
      ),
    );
    // عزل الصوت يلغي عزل مسار الفيديو
    setVideoLane((v) => (v.solo ? { ...v, solo: false } : v));
  }

  function toggleVideoSolo() {
    setVideoLane((v) => {
      const nextSolo = !v.solo;
      if (nextSolo) {
        setAudioTracks((prev) =>
          prev.map((t) => (t.solo ? { ...t, solo: false } : t)),
        );
      }
      return { ...v, solo: nextSolo };
    });
  }

  function ensureTopVideoLayer(): string {
    if (videoLayers.length > 0) {
      return videoLayers[videoLayers.length - 1]!.id;
    }
    const id = nextId(idCounterRef, "vtrack");
    setVideoLayers([
      { id, visible: true, locked: false, muted: true },
    ]);
    return id;
  }

  function addVideoLayerTrack() {
    const id = nextId(idCounterRef, "vtrack");
    setVideoLayers((prev) => [
      ...prev,
      { id, visible: true, locked: false, muted: true },
    ]);
    layerTargetTrackRef.current = id;
    setStatus(`تم إضافة فيديو ${videoLayers.length + 2} — ارفع فيديو أو صورة عليه`);
    layerMediaRef.current?.click();
  }

  function patchVideoLayer(
    id: string,
    patch: Partial<Pick<VideoLayerTrack, "visible" | "locked" | "muted">>,
  ) {
    setVideoLayers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  }

  async function addLayerMedia(list: FileList | null, trackId?: string) {
    const f = list?.[0];
    if (!f) return;
    await placeFileAsLayer(
      f,
      trackId ? { trackId } : { newTrack: true },
    );
  }

  async function placeFileAsLayer(
    f: File,
    opts?: {
      trackId?: string;
      start?: number;
      newTrack?: boolean;
      /** املأ فراغ القص فقط عند الطلب صراحة */
      fitGap?: boolean;
    },
  ) {
    if (!f.type.startsWith("video/") && !f.type.startsWith("image/")) {
      setError("الملف يجب أن يكون فيديو أو صورة");
      return;
    }
    let tid = opts?.trackId || layerTargetTrackRef.current || undefined;
    let stackIndex = videoLayers.length;
    if (opts?.newTrack || !tid) {
      tid = nextId(idCounterRef, "vtrack");
      setVideoLayers((prev) => {
        stackIndex = prev.length;
        return [
          ...prev,
          { id: tid!, visible: true, locked: false, muted: true },
        ];
      });
    } else {
      const existingIdx = videoLayers.findIndex((t) => t.id === tid);
      stackIndex = existingIdx >= 0 ? existingIdx : videoLayers.length;
      setVideoLayers((prev) =>
        prev.some((t) => t.id === tid)
          ? prev
          : [...prev, { id: tid!, visible: true, locked: false, muted: true }],
      );
    }
    const mediaUrl = URL.createObjectURL(f);
    const isVideo = f.type.startsWith("video/");
    let sourceDuration = 5;
    if (isVideo) {
      sourceDuration = (await loadMediaDuration(mediaUrl)) || 5;
    } else {
      sourceDuration = Math.max(3, clipDuration);
    }
    const startAt = Math.max(
      0,
      opts?.start ?? Math.max(0, currentTime - trimIn),
    );
    const gap =
      opts?.fitGap === true
        ? findGapAt(startAt + trimIn) || findGapAt(startAt)
        : null;
    const fitStart = gap ? Math.max(0, gap.start - trimIn) : startAt;
    const remain = gap
      ? gap.duration
      : Math.max(
          0.5,
          isVideo
            ? sourceDuration
            : Math.min(5, (projectEnd || clipDuration) - fitStart),
        );
    const playDur = Math.min(
      isVideo ? sourceDuration : Math.max(1, remain),
      gap ? gap.duration : isVideo ? sourceDuration : remain,
    );
    const id = nextId(idCounterRef, isVideo ? "lvid" : "limg");
    setLayerClips((prev) => [
      ...prev,
      {
        id,
        trackId: tid!,
        kind: isVideo ? "video" : "image",
        name: f.name,
        file: f,
        url: mediaUrl,
        start: fitStart,
        duration: playDur,
        offset: 0,
        sourceDuration,
        x: 0,
        y: 0,
        w: 1,
        h: 1,
        opacity: 1,
      },
    ]);
    setSelectedId(id);
    setPropTab("video");
    setStatus(
      gap
        ? `تم وضع المقطع في الفراغ (${formatTime(gap.duration)})`
        : `وُضع على المسار — اسحبه يميناً/يساراً أو أعلى/أسفل بحرية`,
    );
    layerTargetTrackRef.current = null;
  }

  async function importMediaFiles(list: FileList | null) {
    if (!list?.length) return;
    setMediaImportBusy(true);
    setError(null);
    try {
      const added: MediaAsset[] = [];
      for (const f of Array.from(list)) {
        let kind: MediaAsset["kind"] | null = null;
        if (f.type.startsWith("video/")) kind = "video";
        else if (f.type.startsWith("image/")) kind = "image";
        else if (f.type.startsWith("audio/")) kind = "audio";
        else {
          const n = f.name.toLowerCase();
          if (/\.(mp4|webm|mov|mkv|m4v)$/.test(n)) kind = "video";
          else if (/\.(png|jpe?g|gif|webp|bmp)$/.test(n)) kind = "image";
          else if (/\.(mp3|wav|m4a|aac|ogg)$/.test(n)) kind = "audio";
        }
        if (!kind) continue;
        const assetUrl = URL.createObjectURL(f);
        let duration = Math.max(3, clipDuration || 5);
        if (kind === "video" || kind === "audio") {
          duration = (await loadMediaDuration(assetUrl)) || duration;
        }
        added.push({
          id: nextId(idCounterRef, "asset"),
          kind,
          name: f.name,
          file: f,
          url: assetUrl,
          duration,
        });
      }
      if (added.length === 0) {
        setError("لم يتم التعرف على ملفات صالحة (فيديو / صورة / صوت)");
        return;
      }
      setMediaLibrary((prev) => [...prev, ...added]);
      setStatus(`تم استيراد ${added.length} ملف إلى وسائط المشروع`);
      setPanel("media");
    } finally {
      setMediaImportBusy(false);
    }
  }

  async function placeAssetOnTimeline(
    asset: MediaAsset,
    opts?: {
      trackId?: string;
      start?: number;
      newTrack?: boolean;
      fitGap?: boolean;
    },
  ) {
    if (asset.kind === "audio") {
      const peaks = await analyzeWaveform(asset.file, 120);
      const id = nextId(idCounterRef, "music");
      const trackUrl = URL.createObjectURL(asset.file);
      setAudioTracks((prev) => [
        ...prev,
        {
          id,
          name: asset.name,
          file: asset.file,
          url: trackUrl,
          start: Math.max(
            0,
            opts?.start ?? Math.max(0, currentTime - trimIn),
          ),
          volume: 1,
          duration: asset.duration || 5,
          offset: 0,
          sourceDuration: asset.duration || 5,
          peaks,
        },
      ]);
      setSelectedId(id);
      setPanel("audio");
      setStatus(`تمت إضافة الصوت إلى الخط الزمني: ${asset.name}`);
      return;
    }
    await placeFileAsLayer(asset.file, {
      trackId: opts?.trackId,
      start: opts?.start,
      newTrack: opts?.newTrack ?? !opts?.trackId,
      fitGap: opts?.fitGap,
    });
  }

  async function dropMediaOnTimeline(
    e: ReactDragEvent,
    target:
      | { type: "layer"; trackId: string }
      | { type: "new-layer" }
      | { type: "audio" },
  ) {
    e.preventDefault();
    e.stopPropagation();
    setTimelineDropTarget(null);
    setMediaDragActive(false);
    const start = Math.max(0, timeFromClientX(e.clientX) - trimIn);
    const absStart = timeFromClientX(e.clientX);
    // فراغ فقط إن كان الإفلات داخل الفراغ بدقة (ليس أقرب فراغ)
    const exactGap = findGapAt(absStart);

    const assetId =
      e.dataTransfer.getData(MEDIA_DND_MIME) ||
      e.dataTransfer.getData("text/plain") ||
      draggingAssetIdRef.current ||
      "";
    draggingAssetIdRef.current = null;

    if (assetId) {
      const asset = mediaLibrary.find((a) => a.id === assetId);
      if (!asset) return;
      if (target.type === "audio" || asset.kind === "audio") {
        if (asset.kind !== "audio") {
          setStatus("أسقط ملفات الصوت على مسار الصوت");
          return;
        }
        await placeAssetOnTimeline(asset, { start });
        return;
      }
      if (exactGap) {
        await insertMediaInGap(exactGap.start, exactGap.duration, null, asset);
        return;
      }
      // وضع حر على المسار المستهدف عند موضع الإفلات
      if (target.type === "layer") {
        await placeAssetOnTimeline(asset, {
          start,
          trackId: target.trackId,
          newTrack: false,
        });
        return;
      }
      await placeAssetOnTimeline(asset, {
        start,
        newTrack: true,
      });
      return;
    }

    const files = e.dataTransfer.files;
    if (files?.length) {
      const f = files[0]!;
      if (target.type === "audio" || f.type.startsWith("audio/")) {
        await importMediaFiles(files);
        return;
      }
      if (f.type.startsWith("video/") || f.type.startsWith("image/")) {
        if (exactGap) {
          await handleGapDrop(e, exactGap.start, exactGap.duration);
          return;
        }
        if (target.type === "layer") {
          await placeFileAsLayer(f, {
            start,
            trackId: target.trackId,
            newTrack: false,
          });
        } else {
          await placeFileAsLayer(f, { newTrack: true, start });
        }
        void importMediaFiles(files);
      }
    }
  }

  function onTimelineDragOver(e: ReactDragEvent, targetId: string) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setTimelineDropTarget(targetId);
  }

  function removeMediaAsset(id: string) {
    setMediaLibrary((prev) => {
      const victim = prev.find((a) => a.id === id);
      if (victim) URL.revokeObjectURL(victim.url);
      return prev.filter((a) => a.id !== id);
    });
  }

  function moveVideoLayer(trackId: string, dir: -1 | 1) {
    // videoLayers: 0 = الأدنى، الأخير = الأعلى
    setVideoLayers((prev) => {
      const i = prev.findIndex((t) => t.id === trackId);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const a = next[i]!;
      const b = next[j]!;
      next[i] = b;
      next[j] = a;
      return next;
    });
    setStatus(dir > 0 ? "تم رفع المسار للأعلى" : "تم إنزال المسار للأسفل");
  }

  /** مسار الطبقة تحت مؤشر الماوس أثناء السحب العمودي */
  function resolveLayerTrackAtY(clientY: number): string | null {
    const el = timelineRef.current;
    const scroll = timelineScrollRef.current;
    if (!el || videoLayers.length === 0) return null;
    const rect = el.getBoundingClientRect();
    const y = clientY - rect.top + (scroll?.scrollTop || 0);
    const RULER = 22;
    const VIDEO_H = 36;
    const layerAreaStart = RULER + 2;
    const layersTopFirst = [...videoLayers].reverse();
    if (y < layerAreaStart - 4) {
      return videoLayers[videoLayers.length - 1]?.id ?? null;
    }
    const idx = Math.floor((y - layerAreaStart) / (VIDEO_H + 4));
    if (idx < 0) return videoLayers[videoLayers.length - 1]?.id ?? null;
    if (idx >= layersTopFirst.length) {
      return videoLayers[0]?.id ?? null;
    }
    return layersTopFirst[idx]?.id ?? null;
  }

  function onLayerClipPointerDown(
    e: ReactPointerEvent,
    id: string,
    kind: "layer-move" | "layer-trim-in" | "layer-trim-out",
  ) {
    e.preventDefault();
    e.stopPropagation();
    const clip = layerClips.find((c) => c.id === id);
    if (!clip) return;
    const track = videoLayers.find((t) => t.id === clip.trackId);
    if (clip.locked || track?.locked) {
      setStatus("المسار مقفل — افتح القفل للتعديل");
      setSelectedId(id);
      return;
    }
    setSelectedId(id);
    setPropTab("video");
    dragRef.current = {
      kind,
      id,
      startX: e.clientX,
      startY: e.clientY,
      ox: clip.start,
      oy: clip.offset,
      ow: clip.duration,
      oh: clip.sourceDuration,
      laneId: clip.trackId,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (kind === "layer-move") {
      setStatus(
        "اسحب بحرية: يمين/يسار للوقت · أعلى/أسفل لتغيير المسار",
      );
      const onWinUp = () => {
        window.removeEventListener("pointerup", onWinUp);
        window.removeEventListener("pointercancel", onWinUp);
        finalizeLayerPointerDrag();
      };
      window.addEventListener("pointerup", onWinUp);
      window.addEventListener("pointercancel", onWinUp);
    }
  }

  function removeLayerClip(id: string) {
    setLayerClips((prev) => {
      const victim = prev.find((c) => c.id === id);
      if (victim) URL.revokeObjectURL(victim.url);
      return prev.filter((c) => c.id !== id);
    });
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
    if (
      (drag.kind === "audio-move" ||
        drag.kind === "audio-trim-in" ||
        drag.kind === "audio-trim-out") &&
      drag.id
    ) {
      const el = timelineRef.current;
      const d = projectEnd || duration;
      if (!el || !d) return;
      const rect = el.getBoundingClientRect();
      const dt = ((e.clientX - drag.startX) / Math.max(1, rect.width)) * d;
      if (drag.kind === "audio-move") {
        const maxStart = Math.max(0, d - drag.ow);
        const nextStart = Math.max(0, Math.min(maxStart, drag.ox + dt));
        setAudioTracks((prev) =>
          prev.map((tr) =>
            tr.id === drag.id ? { ...tr, start: nextStart } : tr,
          ),
        );
      } else if (drag.kind === "audio-trim-in") {
        // Drag right edge of left handle: crop start of audio, shift clip right
        const maxIn = Math.min(drag.ow - 0.15, drag.oh - drag.oy - 0.15);
        const delta = Math.max(-drag.oy, Math.min(maxIn, dt));
        setAudioTracks((prev) =>
          prev.map((tr) =>
            tr.id === drag.id
              ? {
                  ...tr,
                  start: Math.max(0, drag.ox + delta),
                  offset: drag.oy + delta,
                  duration: Math.max(0.15, drag.ow - delta),
                }
              : tr,
          ),
        );
      } else if (drag.kind === "audio-trim-out") {
        const maxDur = drag.oh - drag.oy;
        const nextDur = Math.max(0.15, Math.min(maxDur, drag.ow + dt));
        setAudioTracks((prev) =>
          prev.map((tr) =>
            tr.id === drag.id ? { ...tr, duration: nextDur } : tr,
          ),
        );
      }
    }
    if (
      (drag.kind === "layer-move" ||
        drag.kind === "layer-trim-in" ||
        drag.kind === "layer-trim-out") &&
      drag.id
    ) {
      const el = timelineRef.current;
      const d = projectEnd || duration;
      if (!el || !d) return;
      const rect = el.getBoundingClientRect();
      const dt = ((e.clientX - drag.startX) / Math.max(1, rect.width)) * d;
      if (drag.kind === "layer-move") {
        // وضع حر: يمين/يسار للوقت · أعلى/أسفل لنقل المسار — بدون لصق إجباري للفراغ
        const absTime = timeFromClientX(e.clientX);
        const maxStart = Math.max(0, d - drag.ow);
        const nextStart = Math.max(0, Math.min(maxStart, drag.ox + dt));
        const hoverTrack = resolveLayerTrackAtY(e.clientY);
        const dest =
          hoverTrack &&
          !videoLayers.find((t) => t.id === hoverTrack)?.locked
            ? hoverTrack
            : drag.laneId;

        // لصق الفراغ فقط إن كان المؤشر داخل فراغ دقيق (ليس أقرب فراغ)
        const exactGap = findGapAt(absTime);
        if (exactGap && isPointerOverBaseVideo(e.clientY) && drag.id) {
          drag.gapSnap = exactGap;
          drag.laneId = bottomLayerTrackId() || drag.laneId;
          setTimelineDropTarget(`gap-${exactGap.leftId}`);
          setStatus("أفلت لملء الفراغ — أو حرّك بعيداً للوضع الحر");
        } else {
          drag.gapSnap = undefined;
        }

        setLayerClips((prev) =>
          prev.map((c) =>
            c.id === drag.id
              ? {
                  ...c,
                  start: nextStart,
                  // لا تغيّر المدة أثناء السحب الحر
                }
              : c,
          ),
        );
        if (dest) {
          drag.laneId = dest;
          if (!drag.gapSnap) setTimelineDropTarget(dest);
        }
      } else if (drag.kind === "layer-trim-in") {
        const maxIn = Math.min(drag.ow - 0.15, drag.oh - drag.oy - 0.15);
        const delta = Math.max(-drag.oy, Math.min(maxIn, dt));
        setLayerClips((prev) =>
          prev.map((c) =>
            c.id === drag.id
              ? {
                  ...c,
                  start: Math.max(0, drag.ox + delta),
                  offset: drag.oy + delta,
                  duration: Math.max(0.15, drag.ow - delta),
                }
              : c,
          ),
        );
      } else if (drag.kind === "layer-trim-out") {
        const maxDur = drag.oh - drag.oy;
        const nextDur = Math.max(0.15, Math.min(maxDur, drag.ow + dt));
        setLayerClips((prev) =>
          prev.map((c) =>
            c.id === drag.id ? { ...c, duration: nextDur } : c,
          ),
        );
      }
    }
    if (
      (drag.kind === "main-move" ||
        drag.kind === "main-trim-in" ||
        drag.kind === "main-trim-out") &&
      drag.id
    ) {
      const el = timelineRef.current;
      const d = projectEnd || duration;
      if (!el || !d) return;
      const rect = el.getBoundingClientRect();
      const dt = ((e.clientX - drag.startX) / Math.max(1, rect.width)) * d;
      if (drag.kind === "main-move") {
        const nextStart = Math.max(0, drag.ox + dt);
        const delta = nextStart - drag.ox;
        setMainClips((prev) =>
          prev.map((c) =>
            c.id === drag.id ? { ...c, start: nextStart } : c,
          ),
        );
        // اسحب الصوت المتزامن مع نفس اللقطة ليتوازن تحتها
        if (Math.abs(delta) > 0.001) {
          setAudioTracks((prev) =>
            prev.map((a) => {
              const aligned =
                Math.abs(a.start - drag.ox) < 0.12 &&
                Math.abs(a.duration - drag.ow) < 0.25;
              const overlaps =
                a.start < drag.ox + drag.ow && a.start + a.duration > drag.ox;
              if (aligned || (a.id === "linked-audio" && overlaps)) {
                return { ...a, start: Math.max(0, a.start + delta) };
              }
              return a;
            }),
          );
        }
      } else if (drag.kind === "main-trim-in") {
        const maxIn = Math.min(drag.ow - 0.15, drag.oy + drag.ow);
        const delta = Math.max(-drag.oy, Math.min(drag.ow - 0.15, dt));
        setMainClips((prev) =>
          prev.map((c) =>
            c.id === drag.id
              ? {
                  ...c,
                  start: Math.max(0, drag.ox + delta),
                  offset: drag.oy + delta,
                  duration: Math.max(0.15, drag.ow - delta),
                }
              : c,
          ),
        );
      } else if (drag.kind === "main-trim-out") {
        const maxDur = Math.max(0.15, drag.oh - drag.oy);
        const nextDur = Math.max(0.15, Math.min(maxDur, drag.ow + dt));
        setMainClips((prev) =>
          prev.map((c) =>
            c.id === drag.id ? { ...c, duration: nextDur } : c,
          ),
        );
      }
    }
  }

  async function onExport() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setProgress(0);
    setStatus("جاري التصدير… قد يستغرق دقيقة حسب حجم الملف");
    try {
      const sortedMain = [...mainClips].sort((a, b) => a.start - b.start);
      const exportTrimIn =
        sortedMain.length === 1
          ? sortedMain[0]!.offset
          : sortedMain.length > 1
            ? sortedMain[0]!.offset
            : trimIn;
      const exportTrimOut =
        sortedMain.length === 1
          ? sortedMain[0]!.offset + sortedMain[0]!.duration
          : sortedMain.length > 1
            ? sortedMain[sortedMain.length - 1]!.offset +
              sortedMain[sortedMain.length - 1]!.duration
            : trimOut;
      await exportVideoProject(
        {
          file,
          trimIn: exportTrimIn,
          trimOut: exportTrimOut,
          speed,
          rotate,
          flipH,
          flipV,
          opacity: videoLane.visible ? opacity : 0,
          volume,
          muted: muted || videoLane.muted || (videoLane.solo === false && audioTracks.some((a) => a.solo)),
          fadeIn,
          fadeOut,
          audioPitch,
          audioReverse,
          noiseReduce,
          outW: outSize.w,
          outH: outSize.h,
          videoX: videoBox.x * outSize.w,
          videoY: videoBox.y * outSize.h,
          videoW: videoBox.w * outSize.w,
          videoH: videoBox.h * outSize.h,
          bgBlur: bgBlurEnabled
            ? { enabled: true, amount: bgBlurAmount }
            : null,
          canvasBg,
          videoLayers: videoLayers.flatMap((track) => {
            if (!track.visible) return [];
            return layerClips
              .filter((c) => c.trackId === track.id)
              .map((c) => ({
                file: c.file,
                kind: c.kind,
                start: c.start,
                duration: c.duration,
                offset: c.offset,
                x: c.x,
                y: c.y,
                w: c.w,
                h: c.h,
                opacity: c.opacity,
              }));
          }),
          overlays: overlays.map((o) => {
            if (o.type === "text") {
              return {
                type: "text" as const,
                text: o.text,
                fontSize: o.fontSize * (outSize.w / 720),
                fontFamily: o.fontFamily,
                color: o.color,
                x: o.x,
                y: o.y,
                w: o.w,
              };
            }
            if (o.type === "emoji") {
              return {
                type: "emoji" as const,
                text: o.text,
                fontSize: o.fontSize * (outSize.w / 720),
                x: o.x,
                y: o.y,
                w: o.w,
              };
            }
            return {
              type: "image" as const,
              file: o.file,
              x: o.x,
              y: o.y,
              w: o.w,
              h: o.h,
              opacity: o.opacity,
            };
          }),
          audioTracks: audioTracks
            .filter((t) => t.visible !== false)
            .map((t) => {
              const anySolo =
                videoLane.solo || audioTracks.some((a) => a.solo);
              const silenced =
                t.muted || t.volume <= 0 || (anySolo && !t.solo);
              return {
                file: t.file,
                start: t.start,
                volume: silenced ? 0 : t.volume,
                offset: t.offset || 0,
                duration: t.duration,
                linked: t.id === "linked-audio",
              };
            }),
          crop: cropEnabled ? crop : null,
          chromaKey: chromaEnabled
            ? {
                enabled: true,
                color: chromaColor,
                similarity: chromaSensitivity,
              }
            : null,
          removeLogo: logoEnabled
            ? {
                x: logoBox.x,
                y: logoBox.y,
                w: logoBox.w,
                h: logoBox.h,
              }
            : null,
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
  const selectedLayer =
    layerClips.find((c) => c.id === selectedId) ?? null;

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
      <>
        <div
          className={
            fullscreen
              ? "flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#0e0e10] text-white"
              : "overflow-hidden rounded-2xl border border-[#2a2a2e] bg-[#121214] text-white shadow-xl"
          }
        >
          <div className="flex items-center justify-between border-b border-[#2a2a2e] px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Clapperboard className="h-5 w-5 text-[#f5c518]" />
              محرر الفيديو
            </div>
            <div className="flex items-center gap-3">
              {fullscreen && (
                <a
                  href="/"
                  className="text-xs text-[#888] hover:text-[#f5c518]"
                >
                  الرئيسية
                </a>
              )}
              <span className="text-xs text-[#888]">
                مثل 123apps — داخل المتصفح
              </span>
            </div>
          </div>
          <div
            className={`flex flex-col items-center justify-center gap-4 p-8 ${
              fullscreen ? "min-h-0 flex-1" : "min-h-[420px]"
            }`}
          >
            <div className="rounded-2xl border border-dashed border-[#3a3a40] bg-[#1a1a1d] px-10 py-14 text-center">
              <Upload className="mx-auto mb-4 h-10 w-10 text-[#f5c518]" />
              <p className="mb-4 text-sm text-[#ccc]">
                اسحب فيديو أو اختر من جهازك أو سجّل مباشرة
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-md bg-[#f5c518] px-6 py-2.5 text-sm font-bold text-[#111]"
                >
                  اختيار فيديو
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecordStudio(true)}
                  className="rounded-md bg-[#f97316] px-6 py-2.5 text-sm font-bold text-white"
                >
                  استوديو التسجيل
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => void onPick(e.target.files)}
              />
            </div>
            <p className="max-w-lg text-center text-xs leading-6 text-[#777]">
              قص، سرعة، تدوير، عكس، شفافية، صوت وتعليق صوتي وملصقات ونصوص مع
              تايملاين ومعاينة حية — ثم صدّر MP4.
            </p>
          </div>
        </div>
        {showRecordStudio && (
          <RecordStudio
            onClose={() => setShowRecordStudio(false)}
            onRecorded={(f) => void loadVideoFile(f)}
          />
        )}
      </>
    );
  }

  return (
    <div
      className={
        fullscreen
          ? "flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#0e0e10] text-white"
          : "overflow-hidden rounded-2xl border border-[#2a2a2e] bg-[#0e0e10] text-white shadow-xl"
      }
    >
      {/* Top bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-[#2a2a2e] bg-[#161618] px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Clapperboard className="h-4 w-4 text-[#f5c518]" />
          {fullscreen && (
            <a href="/" className="text-[#f5c518] hover:underline">
              Tool2Day
            </a>
          )}
          <span className="max-w-[180px] truncate text-[#ddd]">{file.name}</span>
          <div className="ms-2 flex items-center gap-0.5 rounded-md border border-[#2e2e32] bg-[#1a1a1d] p-0.5">
            <button
              type="button"
              title="تراجع خطوة (Ctrl/⌘+Z)"
              disabled={!canUndo}
              onClick={undoEdit}
              className="inline-flex h-8 w-8 items-center justify-center rounded text-[#ccc] transition hover:bg-[#2a2a2e] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="تقدم خطوة (Ctrl/⌘+Shift+Z)"
              disabled={!canRedo}
              onClick={redoEdit}
              className="inline-flex h-8 w-8 items-center justify-center rounded text-[#ccc] transition hover:bg-[#2a2a2e] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>
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

      <div
        className={`grid min-h-0 flex-1 lg:grid-cols-[72px_260px_minmax(0,1fr)] ${
          fullscreen ? "h-full" : "min-h-[640px]"
        }`}
      >
        {/* Icon rail */}
        <aside className="flex shrink-0 flex-row gap-1 overflow-x-auto border-b border-[#2a2a2e] bg-[#141416] p-1 lg:flex-col lg:border-b-0 lg:border-e">
          {navBtn("files", "ملفاتي", FileVideo)}
          {navBtn("media", "استيراد", Upload)}
          {navBtn("stickers", "ملصقات", Sticker)}
          {navBtn("text", "النص", Type)}
          {navBtn("canvas", "قماش", Ratio)}
          {navBtn("record", "تسجيل", Mic)}
          {navBtn("tts", "تحويل صوتي", AudioLines)}
          {navBtn("audio", "الصوت", Volume2)}
        </aside>

        {/* Property panel */}
        <aside
          className={`overflow-y-auto border-b border-[#2a2a2e] bg-[#17171a] p-3 lg:border-b-0 lg:border-e ${
            fullscreen ? "max-h-none lg:h-full" : "max-h-[640px]"
          }`}
        >
          {panel === "files" && (
            <div className="space-y-3 text-sm">
              <p className="font-semibold text-[#f5c518]">الملف</p>
              <p className="truncate text-xs text-[#aaa]">{file.name}</p>
              <p className="text-xs text-[#777]">
                المدة: {formatTime(duration)} · المقطع: {formatTime(clipDuration)}
              </p>
              <p className="text-[11px] leading-5 text-[#666]">
                من تبويب &quot;وسائط&quot; استورد صوراً وفيديوهات وأصواتاً، ثم اضغط
                الملف لإضافته فوق الفيديو أو كمسار صوت.
              </p>
            </div>
          )}

          {panel === "media" && (
            <div className="space-y-3 text-sm">
              <p className="font-semibold text-[#f5c518]">وسائط المشروع</p>

              {/* Filmora-style import dropzone */}
              <button
                type="button"
                disabled={mediaImportBusy}
                onClick={() => importAllRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void importMediaFiles(e.dataTransfer.files);
                }}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#555] bg-[#1a1a1d] px-3 py-6 text-center transition hover:border-[#f5c518] hover:bg-[#222218] disabled:opacity-50"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#f5c518]/50 bg-[#f5c518]/10 text-[#f5c518]">
                  <Plus className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-white">
                  {mediaImportBusy ? "جاري الاستيراد…" : "استيراد الوسائط"}
                </span>
                <span className="text-[11px] leading-5 text-[#888]">
                  صور · فيديو · صوت — اضغط أو اسحب الملفات هنا
                </span>
              </button>

              <input
                ref={importAllRef}
                type="file"
                multiple
                accept="video/*,image/*,audio/*"
                className="hidden"
                onChange={(e) => {
                  void importMediaFiles(e.target.files);
                  e.target.value = "";
                }}
              />

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => importAllRef.current?.click()}
                  className="flex flex-col items-center gap-1 rounded-md border border-[#333] px-1 py-2 text-[10px] text-[#ccc] hover:border-[#f5c518] hover:text-[#f5c518]"
                >
                  <ImageIcon className="h-4 w-4" />
                  صور
                </button>
                <button
                  type="button"
                  onClick={() => importAllRef.current?.click()}
                  className="flex flex-col items-center gap-1 rounded-md border border-[#333] px-1 py-2 text-[10px] text-[#ccc] hover:border-[#f5c518] hover:text-[#f5c518]"
                >
                  <FileVideo className="h-4 w-4" />
                  فيديو
                </button>
                <button
                  type="button"
                  onClick={() => importAllRef.current?.click()}
                  className="flex flex-col items-center gap-1 rounded-md border border-[#333] px-1 py-2 text-[10px] text-[#ccc] hover:border-[#f5c518] hover:text-[#f5c518]"
                >
                  <Music className="h-4 w-4" />
                  صوت
                </button>
              </div>

              {mediaLibrary.length > 0 ? (
                <div className="space-y-2 border-t border-[#2a2a2e] pt-2">
                  <p className="text-[11px] text-[#888]">
                    المكتبة ({mediaLibrary.length}) — اسحب إلى أي مسار/وقت، أو
                    اضغط للإضافة عند رأس التشغيل
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {mediaLibrary.map((asset) => (
                      <div
                        key={asset.id}
                        draggable={asset.kind !== "audio"}
                        onDragStart={(e) => {
                          if (asset.kind === "audio") {
                            e.preventDefault();
                            return;
                          }
                          draggingAssetIdRef.current = asset.id;
                          e.dataTransfer.setData(MEDIA_DND_MIME, asset.id);
                          e.dataTransfer.setData("text/plain", asset.id);
                          e.dataTransfer.effectAllowed = "copyMove";
                          setMediaDragActive(true);
                          setStatus(
                            `أسقط «${asset.name}» على أي مسار فيديو في الوقت الذي تريده`,
                          );
                        }}
                        onDragEnd={() => {
                          setTimeout(() => {
                            draggingAssetIdRef.current = null;
                          }, 50);
                          setMediaDragActive(false);
                          setTimelineDropTarget(null);
                        }}
                        onClick={() => {
                          if (asset.kind === "audio") {
                            void placeAssetOnTimeline(asset);
                            return;
                          }
                          // وضع حر عند رأس التشغيل — على أدنى مسار أو مسار جديد
                          const trackOpts = resolveTrackForGapPlacement();
                          void placeAssetOnTimeline(asset, {
                            start: Math.max(0, currentTime - trimIn),
                            trackId: trackOpts.trackId,
                            newTrack: trackOpts.newTrack,
                          });
                        }}
                        title={
                          asset.kind === "audio"
                            ? "إضافة صوت"
                            : "اسحب لأي مكان على الخط الزمني أو اضغط للإضافة"
                        }
                        className="group relative cursor-grab overflow-hidden rounded-md border border-[#333] bg-[#141416] active:cursor-grabbing hover:border-[#f5c518]"
                      >
                          <div className="relative aspect-video bg-[#0a0a0b]">
                            {asset.kind === "image" ? (
                              <img
                                src={asset.url}
                                alt=""
                                className="pointer-events-none h-full w-full object-cover"
                                draggable={false}
                              />
                            ) : asset.kind === "video" ? (
                              <video
                                src={asset.url}
                                muted
                                preload="metadata"
                                className="pointer-events-none h-full w-full object-cover"
                                draggable={false}
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center bg-[#0c5f8f]/30">
                                <Music className="h-7 w-7 text-[#7dd3fc]" />
                              </div>
                            )}
                            <span className="absolute start-1 top-1 rounded bg-black/70 px-1 py-0.5 text-[9px] text-white">
                              {asset.kind === "video"
                                ? "فيديو"
                                : asset.kind === "image"
                                  ? "صورة"
                                  : "صوت"}
                            </span>
                            {asset.duration > 0 && asset.kind !== "image" && (
                              <span className="absolute bottom-1 end-1 rounded bg-black/70 px-1 py-0.5 font-mono text-[9px] text-white">
                                {formatTime(asset.duration)}
                              </span>
                            )}
                          </div>
                          <p className="truncate px-1.5 py-1 text-[10px] text-[#bbb]">
                            {asset.name}
                          </p>
                        <button
                          type="button"
                          title="حذف من المكتبة"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMediaAsset(asset.id);
                          }}
                          className="absolute end-1 top-1 rounded bg-black/70 p-0.5 text-red-400 opacity-0 transition group-hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-[11px] text-[#666]">
                  لا توجد ملفات بعد — استورد صوراً أو فيديوهات أو أصواتاً ثم اسحبها
                  إلى الخط الزمني
                </p>
              )}

              <div className="space-y-1.5 border-t border-[#2a2a2e] pt-2">
                <p className="text-[11px] text-[#888]">إجراءات سريعة</p>
                <button
                  type="button"
                  onClick={() => {
                    layerTargetTrackRef.current = null;
                    layerMediaRef.current?.click();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-[#333] px-3 py-2 text-xs hover:bg-[#222]"
                >
                  <ImagePlus className="h-4 w-4" />
                  إضافة مباشرة كطبقة مونتاج
                </button>
                <button
                  type="button"
                  onClick={() => videoSwapRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-[#333] px-3 py-2 text-xs hover:bg-[#222]"
                >
                  <FileVideo className="h-4 w-4" />
                  استبدال الفيديو الأساسي
                </button>
              </div>

              <input
                ref={layerMediaRef}
                type="file"
                accept="video/*,image/*"
                className="hidden"
                onChange={(e) => {
                  void addLayerMedia(e.target.files);
                  e.target.value = "";
                }}
              />
              <input
                ref={imageRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => void addImageOverlay(e.target.files)}
              />
              <input
                ref={musicRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  void importMediaFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <input
                ref={videoSwapRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => void onPick(e.target.files)}
              />
            </div>
          )}

          {panel === "stickers" && (
            <div className="space-y-3 text-sm">
              <p className="font-semibold text-[#f5c518]">الملصقات</p>
              <div className="grid grid-cols-6 gap-1 text-xl">
                {EMOJI_STICKERS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => addEmojiOverlay(em)}
                    className="rounded-md border border-[#333] py-1 hover:bg-[#222]"
                  >
                    {em}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#888]">عبارات جاهزة</p>
              <div className="flex flex-wrap gap-1">
                {STICKER_PHRASES.map((phrase) => (
                  <button
                    key={phrase}
                    type="button"
                    onClick={() => addPhraseOverlay(phrase)}
                    className="rounded-md border border-[#333] px-2 py-1 text-xs font-bold hover:bg-[#222]"
                    style={{ fontFamily: "Impact, sans-serif" }}
                  >
                    {phrase}
                  </button>
                ))}
              </div>
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
              <label className="block text-[11px] text-[#888]">الخط</label>
              <select
                value={draftFont}
                onChange={(e) => setDraftFont(e.target.value)}
                className="w-full rounded-md border border-[#333] bg-[#101012] px-2 py-1.5 text-xs"
              >
                {VIDEO_FONTS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap text-[11px] text-[#888]">
                  اللون
                </label>
                <input
                  type="color"
                  value={draftColor}
                  onChange={(e) => setDraftColor(e.target.value)}
                  className="h-7 w-10 rounded border border-[#333] bg-transparent"
                />
                <label className="whitespace-nowrap text-[11px] text-[#888]">
                  الحجم {draftFontSize}
                </label>
                <input
                  type="range"
                  min={18}
                  max={96}
                  value={draftFontSize}
                  onChange={(e) => setDraftFontSize(Number(e.target.value))}
                  className="flex-1"
                />
              </div>
              <button
                type="button"
                onClick={addTextOverlay}
                className="w-full rounded-md bg-[#2a2a2e] px-3 py-2 text-xs font-semibold hover:bg-[#333]"
              >
                إضافة نص
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
                  <select
                    value={selectedOverlay.fontFamily}
                    onChange={(e) =>
                      setOverlays((prev) =>
                        prev.map((o) =>
                          o.id === selectedOverlay.id && o.type === "text"
                            ? { ...o, fontFamily: e.target.value }
                            : o,
                        ),
                      )
                    }
                    className="w-full rounded border border-[#333] bg-[#101012] px-2 py-1 text-xs"
                  >
                    {VIDEO_FONTS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedOverlay.color}
                      onChange={(e) =>
                        setOverlays((prev) =>
                          prev.map((o) =>
                            o.id === selectedOverlay.id && o.type === "text"
                              ? { ...o, color: e.target.value }
                              : o,
                          ),
                        )
                      }
                      className="h-7 w-10 rounded border border-[#333] bg-transparent"
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
                      className="flex-1"
                    />
                  </div>
                </div>
              )}
              {selectedOverlay?.type === "emoji" && (
                <div className="space-y-2 rounded-md border border-[#333] p-2">
                  <label className="text-[11px] text-[#888]">
                    حجم الملصق {selectedOverlay.fontSize}
                  </label>
                  <input
                    type="range"
                    min={24}
                    max={200}
                    value={selectedOverlay.fontSize}
                    onChange={(e) =>
                      setOverlays((prev) =>
                        prev.map((o) =>
                          o.id === selectedOverlay.id && o.type === "emoji"
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
              <p className="font-semibold text-[#f5c518]">حجم الفيديو</p>
              <div className="rounded-md border border-[#333] bg-[#101012] px-3 py-2 text-xs text-[#aaa]">
                نموذج وسائل التواصل الاجتماعي
                <div className="mt-1 font-mono text-[#ccc]">
                  الإخراج: {outSize.w}×{outSize.h}
                  {lockProjectSize ? " · مقفل على إعدادات المشروع" : ""}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {ASPECT_PRESETS.map((p) => {
                  const active = aspect === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      title={p.hint}
                      onClick={() => applyAspect(p.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-md px-1.5 py-2 text-[11px] transition ${
                        active
                          ? "bg-teal-500/20 font-semibold text-teal-300 ring-1 ring-teal-400"
                          : "border border-[#333] text-[#ccc] hover:bg-[#1a1a1d]"
                      }`}
                    >
                      <AspectThumb w={p.w} h={p.h} active={active} />
                      {p.label}
                    </button>
                  );
                })}
              </div>
              {aspect === "custom" && !lockProjectSize && (
                <div className="grid grid-cols-2 gap-2 rounded-md border border-[#333] bg-[#101012] p-2">
                  <label className="text-[11px] text-[#888]">
                    عرض (px)
                    <input
                      type="number"
                      min={64}
                      max={3840}
                      value={customSize.w}
                      onChange={(e) => {
                        const w = Math.max(
                          64,
                          Math.min(3840, Number(e.target.value) || 64),
                        );
                        setCustomSize((s) => ({ ...s, w }));
                        setProjectProfile((p) => ({ ...p, w }));
                      }}
                      className="mt-1 w-full rounded border border-[#333] bg-[#0a0a0b] px-2 py-1.5 text-xs text-white"
                    />
                  </label>
                  <label className="text-[11px] text-[#888]">
                    ارتفاع (px)
                    <input
                      type="number"
                      min={64}
                      max={3840}
                      value={customSize.h}
                      onChange={(e) => {
                        const h = Math.max(
                          64,
                          Math.min(3840, Number(e.target.value) || 64),
                        );
                        setCustomSize((s) => ({ ...s, h }));
                        setProjectProfile((p) => ({ ...p, h }));
                      }}
                      className="mt-1 w-full rounded border border-[#333] bg-[#0a0a0b] px-2 py-1.5 text-xs text-white"
                    />
                  </label>
                </div>
              )}
              <div className="space-y-2 rounded-md border border-[#333] bg-[#101012] p-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#ddd]">ضباب الخلفية</p>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={bgBlurEnabled}
                    onClick={() => {
                      setBgBlurEnabled((v) => {
                        const next = !v;
                        if (next) {
                          const blur = blurVideoRef.current;
                          const main = videoRef.current;
                          if (blur && main) {
                            try {
                              blur.currentTime = main.currentTime;
                            } catch {
                              /* ignore */
                            }
                            if (playing) void blur.play().catch(() => undefined);
                          }
                        } else {
                          blurVideoRef.current?.pause();
                        }
                        return next;
                      });
                    }}
                    className={`relative h-6 w-11 rounded-full transition ${
                      bgBlurEnabled ? "bg-[#f5c518]" : "bg-[#333]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                        bgBlurEnabled ? "start-5" : "start-0.5"
                      }`}
                    />
                  </button>
                </div>
                {bgBlurEnabled && (
                  <label className="block text-[11px] text-[#888]">
                    قوة الضباب {bgBlurAmount}%
                    <input
                      type="range"
                      min={5}
                      max={100}
                      value={bgBlurAmount}
                      onChange={(e) => setBgBlurAmount(Number(e.target.value))}
                      className="mt-1 w-full"
                    />
                  </label>
                )}
                <label className="flex items-center justify-between text-[11px] text-[#888]">
                  لون الخلفية
                  <input
                    type="color"
                    value={canvasBg}
                    onChange={(e) => setCanvasBg(e.target.value)}
                    className="h-7 w-10 cursor-pointer rounded border border-[#333] bg-transparent"
                  />
                </label>
              </div>
              <div className="space-y-2 rounded-md border border-[#333] bg-[#101012] p-2">
                <p className="text-xs font-semibold text-[#ddd]">تحويل</p>
                <div className="flex items-center gap-2">
                  <label className="flex-1 text-[11px] text-[#888]">
                    عرض {Math.round(videoBox.w * 100)}%
                    <input
                      type="range"
                      min={5}
                      max={200}
                      value={Math.round(videoBox.w * 100)}
                      onChange={(e) =>
                        updateVideoScale("w", Number(e.target.value))
                      }
                      className="mt-1 w-full"
                    />
                  </label>
                  <button
                    type="button"
                    title={scaleLock ? "فك قفل النسبة" : "قفل النسبة"}
                    onClick={() => setScaleLock((v) => !v)}
                    className={`mt-4 rounded border p-1.5 ${
                      scaleLock
                        ? "border-teal-500/50 text-teal-300"
                        : "border-[#333] text-[#888]"
                    }`}
                  >
                    {scaleLock ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : (
                      <LockOpen className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <label className="flex-1 text-[11px] text-[#888]">
                    ارتفاع {Math.round(videoBox.h * 100)}%
                    <input
                      type="range"
                      min={5}
                      max={200}
                      value={Math.round(videoBox.h * 100)}
                      onChange={(e) =>
                        updateVideoScale("h", Number(e.target.value))
                      }
                      className="mt-1 w-full"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[11px] text-[#888]">
                    موضع X {Math.round(videoBox.x * 100)}
                    <input
                      type="number"
                      step={1}
                      value={Math.round(videoBox.x * 100)}
                      onChange={(e) =>
                        updateVideoPos("x", Number(e.target.value))
                      }
                      className="mt-1 w-full rounded border border-[#333] bg-[#0a0a0b] px-2 py-1 text-xs text-white"
                    />
                  </label>
                  <label className="text-[11px] text-[#888]">
                    موضع Y {Math.round(videoBox.y * 100)}
                    <input
                      type="number"
                      step={1}
                      value={Math.round(videoBox.y * 100)}
                      onChange={(e) =>
                        updateVideoPos("y", Number(e.target.value))
                      }
                      className="mt-1 w-full rounded border border-[#333] bg-[#0a0a0b] px-2 py-1 text-xs text-white"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setFlipH((v) => !v)}
                    className={`flex items-center justify-center gap-1 rounded py-1.5 text-[11px] ${
                      flipH
                        ? "bg-[#f5c518] font-bold text-[#111]"
                        : "border border-[#333] text-[#ccc]"
                    }`}
                  >
                    <FlipHorizontal className="h-3.5 w-3.5" />
                    عكس أفقي
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlipV((v) => !v)}
                    className={`flex items-center justify-center gap-1 rounded py-1.5 text-[11px] ${
                      flipV
                        ? "bg-[#f5c518] font-bold text-[#111]"
                        : "border border-[#333] text-[#ccc]"
                    }`}
                  >
                    <FlipVertical className="h-3.5 w-3.5" />
                    عكس رأسي
                  </button>
                </div>
                <label className="block text-[11px] text-[#888]">
                  استدارة {Math.round(rotate)}°
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    value={(() => {
                      const n = ((rotate % 360) + 360) % 360;
                      return n > 180 ? n - 360 : n;
                    })()}
                    onChange={(e) => setRotate(Number(e.target.value))}
                    className="mt-1 w-full"
                  />
                  <div className="mt-1 grid grid-cols-4 gap-1">
                    {([0, 90, 180, 270] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRotate(r)}
                        className={`rounded py-1 text-[11px] ${
                          Math.abs((((rotate % 360) + 360) % 360) - r) < 0.5
                            ? "bg-[#f5c518] font-bold text-[#111]"
                            : "border border-[#333] text-[#ccc]"
                        }`}
                      >
                        {r}°
                      </button>
                    ))}
                  </div>
                </label>
              </div>
              <p className="text-[11px] leading-5 text-[#777]">
                اختر نسبة القماش ثم عدّل حجم/موضع الفيديو داخله — أو اسحب
                الإطار الأصفر في المعاينة.
              </p>
            </div>
          )}

          {panel === "record" && (
            <div className="space-y-3 text-sm">
              <p className="font-semibold text-[#f5c518]">تسجيل جديد</p>
              <div className="space-y-2 rounded-lg border border-[#333] bg-[#101012] p-3">
                <label className="flex items-center justify-between text-xs text-[#ccc]">
                  الميكروفون
                  <span className="rounded bg-[#f5c518]/20 px-2 py-0.5 text-[#f5c518]">
                    جاهز
                  </span>
                </label>
                <label className="flex items-center justify-between text-xs text-[#ccc]">
                  الكاميرا
                  <span className="rounded bg-[#f5c518]/20 px-2 py-0.5 text-[#f5c518]">
                    جاهز
                  </span>
                </label>
                <label className="flex items-center justify-between text-xs text-[#ccc]">
                  الشاشة
                  <span className="rounded bg-[#333] px-2 py-0.5 text-[#888]">
                    اختياري
                  </span>
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShowRecordStudio(true)}
                className="w-full rounded-xl bg-[#f97316] px-3 py-3 text-sm font-bold text-white"
              >
                فتح استوديو التسجيل
              </button>
              <p className="text-[11px] leading-5 text-[#777]">
                واجهة كاملة مثل 123apps: كاميرا قابلة للتحجيم + شاشة + ميكروفون ثم
                إدراج التسجيل في المحرر.
              </p>
            </div>
          )}

          {panel === "tts" && (
            <div className="space-y-3 text-sm">
              <p className="font-semibold text-[#f5c518]">تحويل النص إلى كلام</p>
              <textarea
                className="w-full rounded-md border border-[#333] bg-[#101012] px-2 py-2 text-sm"
                rows={4}
                placeholder="اكتب نصك هنا"
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
              />
              <label className="block text-[11px] text-[#888]">اللغة</label>
              <select
                value={ttsLang}
                onChange={(e) => setTtsLang(e.target.value)}
                className="w-full rounded-md border border-[#333] bg-[#101012] px-2 py-1.5 text-xs"
              >
                {TTS_LANGS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
              <label className="block text-[11px] text-[#888]">
                السرعة {ttsRate.toFixed(2)}×
              </label>
              <input
                type="range"
                min={50}
                max={200}
                value={Math.round(ttsRate * 100)}
                onChange={(e) => setTtsRate(Number(e.target.value) / 100)}
                className="w-full"
              />
              <label className="block text-[11px] text-[#888]">
                طبقة الصوت {ttsPitch.toFixed(2)}
              </label>
              <input
                type="range"
                min={0}
                max={200}
                value={Math.round(ttsPitch * 100)}
                onChange={(e) => setTtsPitch(Number(e.target.value) / 100)}
                className="w-full"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={ttsBusy}
                  onClick={() => void ttsPreview()}
                  className="rounded-md border border-[#333] px-3 py-2 text-xs hover:bg-[#222] disabled:opacity-50"
                >
                  معاينة
                </button>
                <button
                  type="button"
                  disabled={ttsBusy}
                  onClick={() => void ttsAddToTimeline()}
                  className="rounded-md bg-[#f5c518] px-3 py-2 text-xs font-bold text-[#111] disabled:opacity-50"
                >
                  {ttsBusy ? "..." : "إضافة"}
                </button>
              </div>
              {audioTracks.filter((t) => t.id.startsWith("tts-")).length >
                0 && (
                <div className="space-y-1 border-t border-[#2a2a2e] pt-2">
                  <p className="text-[11px] text-[#888]">
                    التعليقات الصوتية المضافة
                  </p>
                  {audioTracks
                    .filter((t) => t.id.startsWith("tts-"))
                    .map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-2 rounded border border-[#333] px-2 py-1 text-[11px]"
                      >
                        <span className="truncate">
                          بدء: {formatTime(t.start)} · {t.duration.toFixed(1)}ث
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAudioTrack(t.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {panel === "audio" && (
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-[#f5c518]">الصوت</p>
              <p className="text-[11px] leading-5 text-[#777]">
                ذبذبات الصوت تظهر كمسار أزرق تحت الفيديو. عدّل المستوى والتلاشي
                من هنا.
              </p>

              {(
                [
                  { id: "volume" as const, label: "الحجم" },
                  { id: "fade" as const, label: "تلاشي" },
                  { id: "speed" as const, label: "السرعة" },
                  { id: "voice" as const, label: "مزيل الصوت" },
                  { id: "noise" as const, label: "تقليل الضوضاء" },
                  { id: "reverse" as const, label: "الصوت العكسي" },
                  { id: "pitch" as const, label: "النبرة" },
                  { id: "eq" as const, label: "المعادل" },
                ] as const
              ).map((tool) => {
                const open = audioSection === tool.id;
                return (
                  <div
                    key={tool.id}
                    className="overflow-hidden rounded-md border border-[#2a2a2e] bg-[#101012]"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setAudioSection((s) => (s === tool.id ? null : tool.id))
                      }
                      className="flex w-full items-center justify-between px-3 py-2.5 text-xs text-[#ddd] hover:bg-[#1a1a1d]"
                    >
                      {tool.label}
                      <span className="text-[#555]">{open ? "▾" : "‹"}</span>
                    </button>
                    {open && (
                      <div className="space-y-2 border-t border-[#2a2a2e] px-3 py-3 text-xs">
                        {tool.id === "volume" && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-[#aaa]">
                                مستوى الصوت {Math.round(volume * 100)}%
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextMuted = !muted;
                                  setPrimaryAudioVolume(nextMuted ? 0 : 1);
                                  setStatus(
                                    nextMuted
                                      ? "تم كتم صوت المقطع"
                                      : "تم إلغاء كتم الصوت",
                                  );
                                }}
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
                                setPrimaryAudioVolume(
                                  Number(e.target.value) / 100,
                                );
                              }}
                              className="w-full accent-sky-400"
                            />
                          </>
                        )}
                        {tool.id === "fade" && (
                          <>
                            <label className="block text-[#888]">
                              ظهور تدريجي {fadeIn.toFixed(1)}ث
                            </label>
                            <input
                              type="range"
                              min={0}
                              max={5}
                              step={0.1}
                              value={fadeIn}
                              onChange={(e) =>
                                setFadeIn(Number(e.target.value))
                              }
                              className="mb-2 w-full accent-sky-400"
                            />
                            <label className="block text-[#888]">
                              اختفاء تدريجي {fadeOut.toFixed(1)}ث
                            </label>
                            <input
                              type="range"
                              min={0}
                              max={5}
                              step={0.1}
                              value={fadeOut}
                              onChange={(e) =>
                                setFadeOut(Number(e.target.value))
                              }
                              className="w-full accent-sky-400"
                            />
                          </>
                        )}
                        {tool.id === "speed" && (
                          <>
                            <label className="block text-[#888]">
                              سرعة التشغيل {speed.toFixed(2)}×
                            </label>
                            <input
                              type="range"
                              min={50}
                              max={200}
                              value={Math.round(speed * 100)}
                              onChange={(e) =>
                                setSpeed(Number(e.target.value) / 100)
                              }
                              className="w-full accent-sky-400"
                            />
                          </>
                        )}
                        {tool.id === "voice" && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = !(muted || volume === 0);
                              setMuted(next);
                              if (next) setVolume(0);
                              else setVolume(1);
                              setStatus(
                                next
                                  ? "تم كتم/إزالة صوت المقطع"
                                  : "تم استعادة الصوت",
                              );
                            }}
                            className="w-full rounded-md bg-sky-600/30 px-3 py-2 font-semibold text-sky-200"
                          >
                            {muted || volume === 0
                              ? "استعادة الصوت"
                              : "كتم / مزيل الصوت"}
                          </button>
                        )}
                        {tool.id === "noise" && (
                          <label className="flex items-center justify-between gap-2 text-[#ccc]">
                            تفعيل تقليل الضوضاء عند التصدير
                            <input
                              type="checkbox"
                              checked={noiseReduce}
                              onChange={(e) => {
                                setNoiseReduce(e.target.checked);
                                setStatus(
                                  e.target.checked
                                    ? "تقليل الضوضاء مفعّل للتصدير"
                                    : "تم إيقاف تقليل الضوضاء",
                                );
                              }}
                            />
                          </label>
                        )}
                        {tool.id === "reverse" && (
                          <label className="flex items-center justify-between gap-2 text-[#ccc]">
                            عكس الصوت عند التصدير
                            <input
                              type="checkbox"
                              checked={audioReverse}
                              onChange={(e) => {
                                setAudioReverse(e.target.checked);
                                setStatus(
                                  e.target.checked
                                    ? "عكس الصوت مفعّل للتصدير"
                                    : "تم إيقاف عكس الصوت",
                                );
                              }}
                            />
                          </label>
                        )}
                        {tool.id === "pitch" && (
                          <>
                            <label className="block text-[#888]">
                              النبرة {audioPitch.toFixed(2)}×
                            </label>
                            <input
                              type="range"
                              min={50}
                              max={150}
                              value={Math.round(audioPitch * 100)}
                              onChange={(e) =>
                                setAudioPitch(Number(e.target.value) / 100)
                              }
                              className="w-full accent-sky-400"
                            />
                          </>
                        )}
                        {tool.id === "eq" && (
                          <p className="leading-5 text-[#888]">
                            استخدم النبرة وتقليل الضوضاء لضبط الترددات. تحسينات
                            المعادل الكامل قادمة.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                disabled={
                  detachBusy ||
                  !(
                    file ||
                    layerClips.some(
                      (c) => c.id === selectedId && c.kind === "video",
                    )
                  )
                }
                onClick={() => void detachAudio()}
                className="w-full rounded-md border border-[#3b82f6] bg-[#1e3a5f]/40 px-2 py-2.5 text-xs font-semibold text-[#93c5fd] disabled:opacity-50"
              >
                {detachBusy ? "جاري فصل الصوت…" : "فصل الصوت → مسار مستقل"}
              </button>
            </div>
          )}

          {selectedOverlay?.type === "image" && (
            <div className="mt-4 space-y-2 rounded-md border border-[#333] p-2 text-xs">
              <p className="font-semibold text-[#f5c518]">الصورة المحددة</p>
              <label className="text-[#888]">
                الشفافية {Math.round(selectedOverlay.opacity * 100)}%
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={Math.round(selectedOverlay.opacity * 100)}
                onChange={(e) =>
                  setOverlays((prev) =>
                    prev.map((o) =>
                      o.id === selectedOverlay.id && o.type === "image"
                        ? { ...o, opacity: Number(e.target.value) / 100 }
                        : o,
                    ),
                  )
                }
                className="w-full"
              />
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
                {selectedLayer && (
                  <div className="space-y-2 rounded-md border border-[#f5c518]/35 bg-[#1c1a12] p-2">
                    <p className="truncate font-semibold text-[#f5c518]">
                      طبقة فوق الفيديو · {selectedLayer.name}
                    </p>
                    <p className="text-[10px] leading-4 text-[#888]">
                      الطبقة الأعلى تغطي التي تحتها. صغّر الحجم لصورة داخل صورة.
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setLayerClips((prev) =>
                            prev.map((c) =>
                              c.id === selectedLayer.id
                                ? { ...c, x: 0, y: 0, w: 1, h: 1 }
                                : c,
                            ),
                          )
                        }
                        className="rounded border border-[#f5c518]/40 bg-[#f5c518]/10 py-1.5 text-[#f5c518]"
                      >
                        ملء الإطار
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setLayerClips((prev) =>
                            prev.map((c) =>
                              c.id === selectedLayer.id
                                ? { ...c, x: 0.55, y: 0.05, w: 0.4, h: 0.35 }
                                : c,
                            ),
                          )
                        }
                        className="rounded border border-[#333] py-1.5 text-[#ccc] hover:bg-[#222]"
                      >
                        صورة داخل صورة
                      </button>
                    </div>
                    <label className="block text-[#888]">
                      شفافية الطبقة {Math.round(selectedLayer.opacity * 100)}%
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={Math.round(selectedLayer.opacity * 100)}
                      onChange={(e) => {
                        const op = Number(e.target.value) / 100;
                        setLayerClips((prev) =>
                          prev.map((c) =>
                            c.id === selectedLayer.id
                              ? { ...c, opacity: op }
                              : c,
                          ),
                        );
                      }}
                      className="w-full"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-1">
                  {(
                    [
                      ["crop", "المحصول"],
                      ["chroma", "إزالة اللون"],
                      ["logo", "إزالة الشعار"],
                      ["speed", "السرعة"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        setVideoTool((t) => (t === id ? "none" : id))
                      }
                      className={`rounded px-2 py-2 ${
                        videoTool === id
                          ? "bg-[#f5c518] font-bold text-[#111]"
                          : "border border-[#333] text-[#ccc]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {videoTool === "crop" && (
                  <div className="space-y-2 rounded border border-[#333] p-2">
                    <label className="flex items-center justify-between">
                      تفعيل المحصول
                      <input
                        type="checkbox"
                        checked={cropEnabled}
                        onChange={(e) => setCropEnabled(e.target.checked)}
                      />
                    </label>
                    {(
                      [
                        ["x", "X"],
                        ["y", "Y"],
                        ["w", "عرض"],
                        ["h", "ارتفاع"],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key}>
                        <label className="text-[#888]">
                          {label} {Math.round(crop[key] * 100)}%
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={Math.round(crop[key] * 100)}
                          onChange={(e) =>
                            setCrop((c) => ({
                              ...c,
                              [key]: Number(e.target.value) / 100,
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {videoTool === "chroma" && (
                  <div className="space-y-2 rounded border border-[#333] p-2">
                    <label className="flex items-center justify-between">
                      تفعيل إزالة اللون
                      <input
                        type="checkbox"
                        checked={chromaEnabled}
                        onChange={(e) => setChromaEnabled(e.target.checked)}
                      />
                    </label>
                    <label className="text-[#888]">اللون</label>
                    <input
                      type="color"
                      value={chromaColor}
                      onChange={(e) => setChromaColor(e.target.value)}
                      className="h-8 w-full cursor-pointer rounded border border-[#333] bg-transparent"
                    />
                    <label className="text-[#888]">
                      الحساسية {chromaSensitivity}%
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={80}
                      value={chromaSensitivity}
                      onChange={(e) =>
                        setChromaSensitivity(Number(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                )}

                {videoTool === "logo" && (
                  <div className="space-y-2 rounded border border-[#333] p-2">
                    <label className="flex items-center justify-between">
                      تفعيل إزالة الشعار
                      <input
                        type="checkbox"
                        checked={logoEnabled}
                        onChange={(e) => setLogoEnabled(e.target.checked)}
                      />
                    </label>
                    {(
                      [
                        ["x", "X"],
                        ["y", "Y"],
                        ["w", "عرض"],
                        ["h", "ارتفاع"],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key}>
                        <label className="text-[#888]">
                          {label} {logoBox[key]}px
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={key === "x" || key === "w" ? 1280 : 720}
                          value={logoBox[key]}
                          onChange={(e) =>
                            setLogoBox((b) => ({
                              ...b,
                              [key]: Number(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <label className="text-[#888]">السرعة {speed.toFixed(2)}×</label>
                <input
                  type="range"
                  min={50}
                  max={200}
                  value={Math.round(speed * 100)}
                  onChange={(e) => setSpeed(Number(e.target.value) / 100)}
                  className="w-full"
                />
                <div className="space-y-2 rounded border border-[#333] p-2">
                  <p className="text-xs font-semibold text-[#ddd]">تحويل</p>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 text-[11px] text-[#888]">
                      حجم عرض {Math.round(videoBox.w * 100)}%
                      <input
                        type="range"
                        min={5}
                        max={200}
                        value={Math.round(videoBox.w * 100)}
                        onChange={(e) =>
                          updateVideoScale("w", Number(e.target.value))
                        }
                        className="mt-1 w-full"
                      />
                    </label>
                    <button
                      type="button"
                      title={scaleLock ? "فك قفل النسبة" : "قفل النسبة"}
                      onClick={() => setScaleLock((v) => !v)}
                      className={`mt-4 rounded border p-1.5 ${
                        scaleLock
                          ? "border-teal-500/50 text-teal-300"
                          : "border-[#333] text-[#888]"
                      }`}
                    >
                      {scaleLock ? (
                        <Lock className="h-3.5 w-3.5" />
                      ) : (
                        <LockOpen className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <label className="flex-1 text-[11px] text-[#888]">
                      حجم ارتفاع {Math.round(videoBox.h * 100)}%
                      <input
                        type="range"
                        min={5}
                        max={200}
                        value={Math.round(videoBox.h * 100)}
                        onChange={(e) =>
                          updateVideoScale("h", Number(e.target.value))
                        }
                        className="mt-1 w-full"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-[11px] text-[#888]">
                      موضع X
                      <input
                        type="number"
                        value={Math.round(videoBox.x * 100)}
                        onChange={(e) =>
                          updateVideoPos("x", Number(e.target.value))
                        }
                        className="mt-1 w-full rounded border border-[#333] bg-[#0a0a0b] px-2 py-1 text-xs text-white"
                      />
                    </label>
                    <label className="text-[11px] text-[#888]">
                      موضع Y
                      <input
                        type="number"
                        value={Math.round(videoBox.y * 100)}
                        onChange={(e) =>
                          updateVideoPos("y", Number(e.target.value))
                        }
                        className="mt-1 w-full rounded border border-[#333] bg-[#0a0a0b] px-2 py-1 text-xs text-white"
                      />
                    </label>
                  </div>
                </div>
                <label className="text-[#888]">عكس</label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setFlipH((v) => !v)}
                    className={`flex items-center justify-center gap-1 rounded py-1.5 ${
                      flipH
                        ? "bg-[#f5c518] font-bold text-[#111]"
                        : "border border-[#333]"
                    }`}
                  >
                    <FlipHorizontal className="h-3.5 w-3.5" />
                    أفقي
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlipV((v) => !v)}
                    className={`flex items-center justify-center gap-1 rounded py-1.5 ${
                      flipV
                        ? "bg-[#f5c518] font-bold text-[#111]"
                        : "border border-[#333]"
                    }`}
                  >
                    <FlipVertical className="h-3.5 w-3.5" />
                    رأسي
                  </button>
                </div>
                <label className="text-[#888]">
                  شفافية الفيديو {Math.round(opacity * 100)}%
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={Math.round(opacity * 100)}
                  onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                  className="w-full"
                />
                <label className="text-[#888]">
                  تدوير {Math.round(rotate)}°
                </label>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={(() => {
                    const n = ((rotate % 360) + 360) % 360;
                    return n > 180 ? n - 360 : n;
                  })()}
                  onChange={(e) => setRotate(Number(e.target.value))}
                  className="w-full"
                />
                <div className="grid grid-cols-4 gap-1">
                  {([0, 90, 180, 270] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRotate(r)}
                      className={`rounded py-1 ${
                        Math.abs((((rotate % 360) + 360) % 360) - r) < 0.5
                          ? "bg-[#f5c518] font-bold text-[#111]"
                          : "border border-[#333]"
                      }`}
                    >
                      {r}°
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={
                    detachBusy ||
                    !(
                      file ||
                      layerClips.some(
                        (c) => c.id === selectedId && c.kind === "video",
                      )
                    )
                  }
                  onClick={() => void detachAudio()}
                  className="mt-1 w-full rounded-md border border-[#3b82f6] bg-[#1e3a5f]/40 px-2 py-2 text-xs font-semibold text-[#93c5fd] disabled:opacity-50"
                >
                  {detachBusy ? "جاري فصل الصوت…" : "فصل الصوت → مسار مستقل"}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Preview + timeline */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#121214]">
          <div
            ref={stageHostRef}
            className={`flex min-h-[56vh] flex-1 items-center justify-center overflow-hidden p-3 ${
              fullscreen ? "min-h-0" : ""
            }`}
          >
            <div
              ref={stageRef}
              className={`relative shrink-0 overflow-hidden bg-black shadow-[0_0_0_1px_#3a3a40,0_12px_40px_rgba(0,0,0,0.55)] ${
                previewTool === "hand" ? "cursor-grab active:cursor-grabbing" : ""
              }`}
              style={{
                width: stagePx.w,
                height: stagePx.h,
              }}
              onPointerMove={onStagePointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onPointerDown={(e) => {
                if (previewTool === "hand") {
                  setSelectedId("video");
                  onVideoHandleDown(e, "video-move");
                }
              }}
              onClick={() => {
                if (previewTool === "select") setSelectedId("video");
              }}
            >
              <div className="pointer-events-none absolute start-2 top-2 z-30 rounded bg-black/70 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-teal-300">
                {aspectLabel} · {outSize.w}×{outSize.h}
              </div>
              {/* ضباب خلفية القماش */}
              <div
                className="absolute inset-0 z-0"
                style={{ background: canvasBg }}
              />
              {bgBlurEnabled && url && (
                <video
                  ref={blurVideoRef}
                  src={url}
                  muted
                  playsInline
                  draggable={false}
                  className="pointer-events-none absolute inset-0 z-[1] h-full w-full object-cover"
                  style={{
                    filter: `blur(${Math.max(4, (bgBlurAmount / 100) * 36)}px)`,
                    transform: "scale(1.18)",
                    opacity: videoLane.visible && mainClipAt(currentTime) ? 1 : 0,
                  }}
                />
              )}
              <div
                className={`absolute z-10 ${
                  selectedId === "video"
                    ? "outline outline-2 outline-[#f5c518]"
                    : ""
                } ${
                  previewTool === "hand"
                    ? "cursor-grab active:cursor-grabbing"
                    : "cursor-move"
                }`}
                style={{
                  left: `${videoBox.x * 100}%`,
                  top: `${videoBox.y * 100}%`,
                  width: `${videoBox.w * 100}%`,
                  height: `${videoBox.h * 100}%`,
                  opacity: videoLane.visible && mainClipAt(currentTime) ? opacity : 0,
                  visibility:
                    videoLane.visible && mainClipAt(currentTime)
                      ? "visible"
                      : "hidden",
                  transform: [
                    rotate ? `rotate(${rotate}deg)` : "",
                    flipH ? "scaleX(-1)" : "",
                    flipV ? "scaleY(-1)" : "",
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined,
                  transformOrigin: "center center",
                  touchAction: "none",
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSelectedId("video");
                  onVideoHandleDown(e, "video-move");
                }}
              >
                <video
                  ref={videoRef}
                  src={url}
                  className="pointer-events-none h-full w-full object-cover"
                  onLoadedMetadata={onLoadedMeta}
                  playsInline
                  draggable={false}
                />
                {selectedId === "video" && (
                  <>
                    {/* مقبض الاستدارة أعلى الإطار — مثل 123apps */}
                    <div className="pointer-events-none absolute left-1/2 top-0 z-30 flex -translate-x-1/2 -translate-y-full flex-col items-center">
                      <div
                        className="pointer-events-auto h-3.5 w-3.5 cursor-grab rounded-full border-2 border-[#f5c518] bg-white shadow active:cursor-grabbing"
                        title="اسحب للتدوير"
                        onPointerDown={(e) =>
                          onVideoHandleDown(e, "video-rotate")
                        }
                      />
                      <div className="h-4 w-px bg-[#f5c518]" />
                    </div>
                    <button
                      type="button"
                      title="اسحب لتحريك الفيديو"
                      className="absolute left-1/2 top-1/2 z-30 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-move items-center justify-center rounded-full border-2 border-[#f5c518] bg-black/50 text-[#f5c518] shadow-lg"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        onVideoHandleDown(e, "video-move");
                      }}
                    >
                      <span className="relative block h-3 w-3">
                        <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#f5c518]" />
                        <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-[#f5c518]" />
                        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f5c518]" />
                      </span>
                    </button>
                    {(
                      [
                        ["nw", "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize"],
                        ["ne", "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize"],
                        ["sw", "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize"],
                        ["se", "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize"],
                        ["n", "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize"],
                        ["s", "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-ns-resize"],
                        ["w", "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize"],
                        ["e", "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize"],
                      ] as const
                    ).map(([corner, pos]) => (
                      <div
                        key={corner}
                        className={`absolute z-20 h-3.5 w-3.5 rounded-full border-2 border-[#111] bg-white shadow ${pos}`}
                        onPointerDown={(e) =>
                          onVideoHandleDown(e, "video-resize", corner)
                        }
                      />
                    ))}
                  </>
                )}
              </div>

              {/* Montage layers (Video 2+) — stacked above base */}
              {videoLayers.map((track, trackIdx) => {
                if (!track.visible) return null;
                return layerClips
                  .filter((c) => c.trackId === track.id)
                  .map((clip) => {
                    const local = currentTime - trimIn - clip.start;
                    const active = local >= 0 && local < clip.duration;
                    if (!active) return null;
                    return (
                      <div
                        key={clip.id}
                        className={`absolute z-20 ${
                          selectedId === clip.id
                            ? "ring-2 ring-[#f5c518]"
                            : "ring-1 ring-white/25"
                        }`}
                        style={{
                          left: `${clip.x * 100}%`,
                          top: `${clip.y * 100}%`,
                          width: `${clip.w * 100}%`,
                          height: `${clip.h * 100}%`,
                          opacity: clip.opacity,
                          zIndex: 20 + trackIdx,
                        }}
                        onPointerDown={(e) =>
                          onOverlayPointerDown(e, clip.id, "move")
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(clip.id);
                        }}
                      >
                        {clip.kind === "image" ? (
                          <img
                            src={clip.url}
                            alt=""
                            className="h-full w-full object-cover"
                            draggable={false}
                          />
                        ) : (
                          <video
                            src={clip.url}
                            muted
                            playsInline
                            className="h-full w-full object-cover"
                            ref={(el) => {
                              if (el) layerVideoElsRef.current.set(clip.id, el);
                              else layerVideoElsRef.current.delete(clip.id);
                            }}
                          />
                        )}
                        {selectedId === clip.id && (
                          <div
                            className="absolute bottom-0 right-0 h-3.5 w-3.5 translate-x-1/2 translate-y-1/2 rounded-full border-2 border-[#111] bg-[#f5c518]"
                            onPointerDown={(e) =>
                              onOverlayPointerDown(e, clip.id, "resize")
                            }
                          />
                        )}
                      </div>
                    );
                  });
              })}

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
                      className="flex h-full w-full items-center justify-center rounded bg-black/50 px-2 text-center font-bold"
                      style={{
                        fontSize: Math.max(12, item.fontSize * 0.45),
                        fontFamily: item.fontFamily,
                        color: item.color,
                      }}
                    >
                      {item.text}
                    </div>
                  ) : item.type === "emoji" ? (
                    <div
                      className="flex h-full w-full items-center justify-center text-center leading-none"
                      style={{ fontSize: Math.max(24, item.fontSize * 0.5) }}
                    >
                      {item.text}
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.src}
                      alt=""
                      className="h-full w-full object-contain"
                      style={{ opacity: item.opacity }}
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
            <div className="relative" ref={aspectMenuRef}>
              <button
                type="button"
                onClick={() => setAspectMenuOpen((v) => !v)}
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold ${
                  aspectMenuOpen
                    ? "border-teal-400 bg-teal-500/15 text-teal-300"
                    : "border-[#333] text-[#ddd] hover:bg-[#222]"
                }`}
                title="حجم الفيديو / نسبة القماش"
              >
                <Ratio className="h-3.5 w-3.5 opacity-80" />
                {aspectLabel}
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </button>
              {aspectMenuOpen && (
                <div className="absolute bottom-[calc(100%+6px)] start-0 z-[90] w-56 overflow-hidden rounded-lg border border-[#3a3a40] bg-[#1c1c1f] shadow-2xl">
                  <div className="border-b border-[#2e2e32] px-3 py-2 text-[11px] font-medium text-[#aaa]">
                    نموذج وسائل التواصل الاجتماعي
                  </div>
                  <div className="max-h-72 overflow-y-auto py-1">
                    {ASPECT_PRESETS.map((p) => {
                      const active = aspect === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => applyAspect(p.id)}
                          className={`flex w-full items-center gap-3 px-3 py-2 text-start text-xs transition ${
                            active
                              ? "bg-teal-500/15 text-teal-300"
                              : "text-[#ddd] hover:bg-[#2a2a2e]"
                          }`}
                        >
                          <AspectThumb w={p.w} h={p.h} active={active} />
                          <span className="flex flex-col">
                            <span className="font-semibold">{p.label}</span>
                            <span className="text-[10px] text-[#777]">
                              {p.hint}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {aspect === "custom" && (
                    <div className="grid grid-cols-2 gap-2 border-t border-[#2e2e32] p-2">
                      <input
                        type="number"
                        min={64}
                        max={3840}
                        value={customSize.w}
                        onChange={(e) => {
                          const w = Math.max(
                            64,
                            Math.min(3840, Number(e.target.value) || 64),
                          );
                          setCustomSize((s) => ({ ...s, w }));
                          setProjectProfile((p) => ({ ...p, w }));
                          setLockProjectSize(false);
                        }}
                        className="rounded border border-[#333] bg-[#0a0a0b] px-2 py-1 text-[11px] text-white"
                        placeholder="عرض"
                        aria-label="عرض مخصص"
                      />
                      <input
                        type="number"
                        min={64}
                        max={3840}
                        value={customSize.h}
                        onChange={(e) => {
                          const h = Math.max(
                            64,
                            Math.min(3840, Number(e.target.value) || 64),
                          );
                          setCustomSize((s) => ({ ...s, h }));
                          setProjectProfile((p) => ({ ...p, h }));
                          setLockProjectSize(false);
                        }}
                        className="rounded border border-[#333] bg-[#0a0a0b] px-2 py-1 text-[11px] text-white"
                        placeholder="ارتفاع"
                        aria-label="ارتفاع مخصص"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={undoEdit}
              disabled={!canUndo}
              className="rounded border border-[#333] p-1.5 hover:bg-[#222] disabled:cursor-not-allowed disabled:opacity-35"
              title="تراجع خطوة (Ctrl/⌘+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={redoEdit}
              disabled={!canRedo}
              className="rounded border border-[#333] p-1.5 hover:bg-[#222] disabled:cursor-not-allowed disabled:opacity-35"
              title="تقدم خطوة (Ctrl/⌘+Shift+Z)"
            >
              <Redo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                setPreviewTool((t) => (t === "hand" ? "select" : "hand"))
              }
              className={`rounded border p-1.5 ${
                previewTool === "hand"
                  ? "border-[#f5c518] bg-[#f5c518]/20 text-[#f5c518]"
                  : "border-[#333] hover:bg-[#222]"
              }`}
              title="أداة اليد — اسحب لتحريك الفيديو"
            >
              <Hand className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={splitAtPlayhead}
              className="rounded border border-[#333] p-1.5 hover:bg-[#222]"
              title="تقسيم عند رأس التشغيل — مقص (B / S)"
            >
              <Scissors className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={copySelected}
              className="rounded border border-[#333] p-1.5 hover:bg-[#222]"
              title="نسخ الصوت (C)"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={duplicateSelected}
              className="rounded border border-[#333] p-1.5 hover:bg-[#222]"
              title="تكرار الصوت (D)"
            >
              <Copy className="h-4 w-4 opacity-70" />
            </button>
            <button
              type="button"
              onClick={deleteSelected}
              className="rounded border border-[#333] p-1.5 hover:bg-[#222]"
              title="حذف الصوت (Del)"
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
            <div
              className="ms-auto flex items-center gap-1 rounded-md border border-[#2e2e32] bg-[#1a1a1d] px-1.5 py-1"
              title="تكبير / تصغير التايملاين"
            >
              <button
                type="button"
                onClick={() => bumpTimelineZoom(timelineZoom <= 1 ? -0.1 : -0.5)}
                className="rounded p-1 text-[#aaa] hover:bg-[#2a2a2e] hover:text-white"
                title="تكبير للخارج"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <input
                type="range"
                min={TIMELINE_ZOOM_MIN}
                max={TIMELINE_ZOOM_MAX}
                step={0.05}
                value={timelineZoom}
                onChange={(e) => setTimelineZoom(Number(e.target.value))}
                className="h-1 w-28 cursor-pointer accent-[#9ca3af]"
                aria-label="تكبير التايملاين"
              />
              <button
                type="button"
                onClick={() => bumpTimelineZoom(timelineZoom < 1 ? 0.1 : 0.5)}
                className="rounded p-1 text-[#aaa] hover:bg-[#2a2a2e] hover:text-white"
                title="تكبير للداخل"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={fitTimelineZoom}
                className="group relative rounded border border-[#555] p-1 text-[#cfcfcf] hover:border-[#888] hover:bg-[#2a2a2e] hover:text-white"
                title="تكبير لتناسب الخط الزمني بشكل افضل"
                aria-label="تكبير لتناسب الخط الزمني بشكل افضل"
              >
                <UnfoldHorizontal className="h-3.5 w-3.5" strokeWidth={2} />
                <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-[#555] bg-[#2c2c30] px-2.5 py-1.5 text-[11px] text-white shadow-xl group-hover:block">
                  <span className="me-2 inline-flex items-center gap-0.5 rounded border border-[#777] bg-[#1a1a1d] px-1 py-0.5 font-mono text-[9px] text-[#ddd]">
                    ⇧Z
                  </span>
                  تكبير لتناسب الخط الزمني بشكل افضل
                </span>
              </button>
            </div>
          </div>

          {/* Multi-lane timeline + Filmora-style track headers */}
          <div className="shrink-0 border-t border-[#2a2a2e] bg-[#121214] p-3">
            {(() => {
              const RULER = 22;
              const VIDEO_H = 36;
              const LANE_H = 48;
              const LANE_GAP = 6;
              const ADD_H = 32;
              const HEADER_W = 118;
              const lanes = audioTracks;
              const layerCount = videoLayers.length;
              const videoBlockH = (1 + layerCount) * (VIDEO_H + 4);
              const audioBlockH =
                Math.max(1, lanes.length) * (LANE_H + LANE_GAP);
              const bodyH =
                RULER + videoBlockH + 8 + audioBlockH + ADD_H + 8;

              // أعلى القائمة = أعلى طبقة (فيديو N … فيديو 2) ثم فيديو 1
              const layersTopFirst = [...videoLayers].reverse();

              const laneHeader = (
                label: string,
                opts: {
                  visible: boolean;
                  muted: boolean;
                  locked: boolean;
                  solo?: boolean;
                  showSolo?: boolean;
                  onToggleVisible: () => void;
                  onToggleMute: () => void;
                  onToggleLock: () => void;
                  onToggleSolo?: () => void;
                },
              ) => (
                <div
                  className={`flex h-full flex-col justify-center gap-0.5 border-b border-[#2a2a2e] px-1.5 ${
                    !opts.visible ? "opacity-45" : ""
                  }`}
                >
                  <div className="truncate text-end text-[11px] font-medium text-[#ddd]">
                    {label}
                  </div>
                  <div className="flex items-center justify-end gap-0.5">
                    <TrackCtrlBtn
                      title={opts.visible ? "إخفاء المسار" : "إظهار المسار"}
                      active={!opts.visible}
                      onClick={opts.onToggleVisible}
                    >
                      {opts.visible ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                    </TrackCtrlBtn>
                    {opts.showSolo !== false && opts.onToggleSolo && (
                      <TrackCtrlBtn
                        title={opts.solo ? "إلغاء العزل" : "عزل المسار (Solo)"}
                        active={!!opts.solo}
                        onClick={opts.onToggleSolo}
                      >
                        <Mic className="h-3.5 w-3.5" />
                      </TrackCtrlBtn>
                    )}
                    <TrackCtrlBtn
                      title={opts.muted ? "إلغاء الكتم" : "كتم الصوت"}
                      danger={opts.muted}
                      active={opts.muted}
                      onClick={opts.onToggleMute}
                    >
                      {opts.muted ? (
                        <VolumeX className="h-3.5 w-3.5" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" />
                      )}
                    </TrackCtrlBtn>
                    <TrackCtrlBtn
                      title={opts.locked ? "فتح القفل" : "قفل المسار"}
                      active={opts.locked}
                      onClick={opts.onToggleLock}
                    >
                      {opts.locked ? (
                        <Lock className="h-3.5 w-3.5" />
                      ) : (
                        <LockOpen className="h-3.5 w-3.5" />
                      )}
                    </TrackCtrlBtn>
                  </div>
                </div>
              );

              return (
                <div
                  dir="ltr"
                  className="flex max-h-72 overflow-hidden rounded-md border border-[#2a2a2e] bg-[#1a1a1d]"
                >
                  {/* Track headers — يسار عند 00:00، تمرير عمودي متزامن */}
                  <div
                    ref={headerScrollRef}
                    className="shrink-0 overflow-y-auto overflow-x-hidden border-r border-[#2a2a2e] bg-[#161618]"
                    style={{ width: HEADER_W }}
                    dir="rtl"
                    onScroll={syncTimelineScroll}
                  >
                    <div
                      className="flex flex-col"
                      style={{ height: bodyH, minHeight: bodyH }}
                    >
                      <div
                        className="shrink-0 border-b border-[#2a2a2e] px-2 text-[9px] text-[#666]"
                        style={{ height: RULER }}
                      >
                        <span className="flex h-full items-end pb-0.5">
                          المسارات
                        </span>
                      </div>
                      {layersTopFirst.map((track, revIdx) => {
                        const num = videoLayers.length + 1 - revIdx;
                        const stackIdx = videoLayers.findIndex(
                          (t) => t.id === track.id,
                        );
                        return (
                          <div
                            key={track.id}
                            style={{ height: VIDEO_H + 4 }}
                            className={
                              timelineDropTarget === track.id
                                ? "bg-[#f5c518]/10"
                                : undefined
                            }
                          >
                            <div className="flex h-full items-stretch gap-0.5 border-b border-[#2a2a2e]">
                              <div className="flex w-5 shrink-0 flex-col justify-center gap-0.5">
                                <button
                                  type="button"
                                  title="رفع المسار للأعلى"
                                  disabled={stackIdx >= videoLayers.length - 1}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveVideoLayer(track.id, 1);
                                  }}
                                  className="inline-flex h-3.5 items-center justify-center rounded text-[#888] hover:bg-white/10 hover:text-[#f5c518] disabled:opacity-25"
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  title="إنزال المسار للأسفل"
                                  disabled={stackIdx <= 0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveVideoLayer(track.id, -1);
                                  }}
                                  className="inline-flex h-3.5 items-center justify-center rounded text-[#888] hover:bg-white/10 hover:text-[#f5c518] disabled:opacity-25"
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="min-w-0 flex-1">
                                {laneHeader(`فيديو ${num}`, {
                                  visible: track.visible,
                                  muted: track.muted,
                                  locked: track.locked,
                                  showSolo: false,
                                  onToggleVisible: () =>
                                    patchVideoLayer(track.id, {
                                      visible: !track.visible,
                                    }),
                                  onToggleMute: () =>
                                    patchVideoLayer(track.id, {
                                      muted: !track.muted,
                                    }),
                                  onToggleLock: () =>
                                    patchVideoLayer(track.id, {
                                      locked: !track.locked,
                                    }),
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ height: VIDEO_H + 4 }}>
                        {laneHeader("فيديو 1", {
                          visible: videoLane.visible,
                          muted: videoLane.muted,
                          locked: videoLane.locked,
                          solo: videoLane.solo,
                          onToggleVisible: () => toggleVideoLane("visible"),
                          onToggleMute: () => toggleVideoLane("muted"),
                          onToggleLock: () => toggleVideoLane("locked"),
                          onToggleSolo: toggleVideoSolo,
                        })}
                      </div>
                      {lanes.map((t, i) => (
                        <div
                          key={t.id}
                          style={{ height: LANE_H + LANE_GAP }}
                        >
                          {laneHeader(`صوت ${i + 1}`, {
                            visible: t.visible !== false,
                            muted: !!t.muted || t.volume <= 0,
                            locked: !!t.locked,
                            solo: !!t.solo,
                            onToggleVisible: () =>
                              patchAudioTrack(t.id, {
                                visible: t.visible === false,
                              }),
                            onToggleMute: () => {
                              const nextMuted = !(t.muted || t.volume <= 0);
                              patchAudioTrack(t.id, {
                                muted: nextMuted,
                                volume: nextMuted
                                  ? 0
                                  : t.volume <= 0
                                    ? 1
                                    : t.volume,
                              });
                            },
                            onToggleLock: () =>
                              patchAudioTrack(t.id, { locked: !t.locked }),
                            onToggleSolo: () => toggleAudioSolo(t.id),
                          })}
                        </div>
                      ))}
                      {lanes.length === 0 && (
                        <div style={{ height: LANE_H + LANE_GAP }} />
                      )}
                      <div
                        className="flex items-center justify-center gap-1"
                        style={{ height: ADD_H + 8 }}
                      >
                        <button
                          type="button"
                          title="إضافة مسار فيديو (طبقة مونتاج)"
                          onClick={addVideoLayerTrack}
                          className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#f5c518]/50 bg-[#2a2410] text-[#f5c518] hover:bg-[#3a3218]"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="إضافة مسار صوت"
                          onClick={() => {
                            musicRef.current?.click();
                            setPanel("media");
                          }}
                          className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#444] bg-[#222] text-[#ccc] hover:border-[#7dd3fc] hover:text-[#7dd3fc]"
                        >
                          <Music className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div
                    ref={timelineScrollRef}
                    dir="ltr"
                    className="min-w-0 flex-1 overflow-x-auto overflow-y-auto"
                    onScroll={syncHeaderScroll}
                  >
                    <div
                      ref={timelineRef}
                      className="relative ms-0"
                      style={{
                        width: `${Math.max(TIMELINE_ZOOM_MIN, timelineZoom) * 100}%`,
                        minWidth: timelineZoom >= 1 ? "100%" : undefined,
                        height: bodyH,
                      }}
                      onPointerMove={onTimelineMove}
                      onPointerUp={onPointerUp}
                      onPointerCancel={onPointerUp}
                      onPointerDown={(e) => onTimelinePointerDown(e, "playhead")}
                      onDragOver={(e) => {
                        if (
                          mediaDragActive ||
                          draggingAssetIdRef.current ||
                          e.dataTransfer.types.includes("Files") ||
                          e.dataTransfer.types.includes("text/plain")
                        ) {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "copy";
                          const gap = findGapAt(timeFromClientX(e.clientX));
                          if (gap) {
                            onTimelineDragOver(e, `gap-${gap.leftId}`);
                          }
                        }
                      }}
                      onDrop={(e) => {
                        const t = timeFromClientX(e.clientX);
                        const exactGap = findGapAt(t);
                        if (exactGap) {
                          void handleGapDrop(
                            e,
                            exactGap.start,
                            exactGap.duration,
                          );
                          return;
                        }
                        // إفلات حر على الخط — مسار جديد عند موضع الإفلات
                        e.preventDefault();
                        e.stopPropagation();
                        const start = Math.max(0, t - trimIn);
                        const assetId =
                          e.dataTransfer.getData(MEDIA_DND_MIME) ||
                          e.dataTransfer.getData("text/plain") ||
                          draggingAssetIdRef.current ||
                          "";
                        draggingAssetIdRef.current = null;
                        setMediaDragActive(false);
                        setTimelineDropTarget(null);
                        const asset = mediaLibrary.find((a) => a.id === assetId);
                        if (asset && asset.kind !== "audio") {
                          void placeAssetOnTimeline(asset, {
                            start,
                            newTrack: true,
                          });
                          return;
                        }
                        const f = e.dataTransfer.files?.[0];
                        if (
                          f &&
                          (f.type.startsWith("video/") ||
                            f.type.startsWith("image/"))
                        ) {
                          void placeFileAsLayer(f, {
                            start,
                            newTrack: true,
                          });
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCtxMenu(clampMenuPos(e.clientX, e.clientY));
                      }}
                    >
                      <div className="pointer-events-none absolute inset-x-0 top-0 flex h-[22px] items-end justify-between border-b border-[#2a2a2e] px-1 pb-0.5 text-[9px] text-[#777]">
                        {Array.from({
                          length: Math.max(
                            4,
                            Math.round(Math.max(timelineZoom, 0.4) * 8),
                          ),
                        }).map((_, i, arr) => (
                          <span key={i}>
                            {formatTime(
                              (projectEnd * i) / Math.max(1, arr.length - 1),
                            )}
                          </span>
                        ))}
                      </div>

                      {/* Extra video layers (top → just above Video 1) */}
                      {layersTopFirst.map((track, revIdx) => {
                        const top = RULER + 2 + revIdx * (VIDEO_H + 4);
                        const clips = layerClips.filter(
                          (c) => c.trackId === track.id,
                        );
                        const dropHot = timelineDropTarget === track.id;
                        const isBottomTrack = track.id === videoLayers[0]?.id;
                        const gaps = listMainGaps();
                        return (
                          <div
                            key={track.id}
                            className={`absolute inset-x-0 ${
                              dropHot
                                ? "z-20 bg-[#f5c518]/15 ring-1 ring-inset ring-[#f5c518]"
                                : ""
                            }`}
                            style={{ top, height: VIDEO_H }}
                            onDragOver={(e) => {
                              const gap = findGapAt(timeFromClientX(e.clientX));
                              if (gap) {
                                onTimelineDragOver(e, `gap-${gap.leftId}`);
                              } else {
                                onTimelineDragOver(e, track.id);
                              }
                            }}
                            onDragLeave={() =>
                              setTimelineDropTarget((t) =>
                                t === track.id || t?.startsWith("gap-")
                                  ? null
                                  : t,
                              )
                            }
                            onDrop={(e) => {
                              const gap = findGapAt(timeFromClientX(e.clientX));
                              if (gap) {
                                void handleGapDrop(e, gap.start, gap.duration);
                                return;
                              }
                              void dropMediaOnTimeline(e, {
                                type: "layer",
                                trackId: track.id,
                              });
                            }}
                          >
                            <div className="pointer-events-none absolute inset-y-0 w-full border-t border-[#252528]" />
                            {/* مناطق الإفلات فوق فراغات فيديو 1 (مسار فيديو 2) */}
                            {(isBottomTrack || mediaDragActive) &&
                              gaps.map((gap) => {
                                const left = timelinePct(gap.start);
                                const width = Math.max(
                                  2,
                                  timelinePct(gap.start + gap.duration) - left,
                                );
                                const hot =
                                  timelineDropTarget === `gap-${gap.leftId}` ||
                                  mediaDragActive;
                                return (
                                  <div
                                    key={`above-gap-${track.id}-${gap.leftId}`}
                                    className={`absolute inset-y-0.5 z-40 flex items-center justify-center rounded border-2 border-dashed text-[9px] font-bold ${
                                      hot
                                        ? "border-[#f5c518] bg-[#f5c518]/40 text-[#111] shadow-[0_0_14px_rgba(245,197,24,0.45)]"
                                        : "border-[#f5c518]/70 bg-[#2a2410]/90 text-[#f5c518]"
                                    }`}
                                    style={{
                                      left: `${left}%`,
                                      width: `${width}%`,
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onDragOver={(e) =>
                                      onTimelineDragOver(
                                        e,
                                        `gap-${gap.leftId}`,
                                      )
                                    }
                                    onDragLeave={() =>
                                      setTimelineDropTarget((t) =>
                                        t === `gap-${gap.leftId}` ? null : t,
                                      )
                                    }
                                    onDrop={(e) =>
                                      void handleGapDrop(
                                        e,
                                        gap.start,
                                        gap.duration,
                                      )
                                    }
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      void insertMediaInGap(
                                        gap.start,
                                        gap.duration,
                                      );
                                    }}
                                  >
                                    {hot
                                      ? "أفلت هنا فوق الفراغ"
                                      : "↑ فوق الفراغ"}
                                  </div>
                                );
                              })}
                            {dropHot && !mediaDragActive && (
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-[#f5c518]">
                                أفلت على هذا المسار
                              </div>
                            )}
                            {clips.map((clip) => {
                              const left = timelinePct(trimIn + clip.start);
                              const width = Math.max(
                                1.2,
                                timelinePct(
                                  trimIn + clip.start + clip.duration,
                                ) - left,
                              );
                              const selected = selectedId === clip.id;
                              return (
                                <div
                                  key={clip.id}
                                  role="button"
                                  tabIndex={0}
                                  className={`absolute z-50 h-full overflow-hidden rounded border ${
                                    track.locked || clip.locked
                                      ? "cursor-not-allowed"
                                      : "cursor-grab active:cursor-grabbing"
                                  } ${
                                    selected
                                      ? "border-[#f5c518] ring-1 ring-[#f5c518]/40"
                                      : clip.kind === "image"
                                        ? "border-violet-600"
                                        : "border-amber-600"
                                  } ${
                                    clip.kind === "image"
                                      ? "bg-violet-900/80"
                                      : "bg-[#5a3a10]"
                                  } ${!track.visible ? "opacity-35" : ""}`}
                                  style={{
                                    left: `${left}%`,
                                    width: `${width}%`,
                                  }}
                                  title={clip.name}
                                  onPointerDown={(e) =>
                                    onLayerClipPointerDown(
                                      e,
                                      clip.id,
                                      "layer-move",
                                    )
                                  }
                                  onPointerMove={onTimelineMove}
                                  onPointerUp={onPointerUp}
                                  onPointerCancel={onPointerUp}
                                  onContextMenu={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedId(clip.id);
                                    setCtxMenu(
                                      clampMenuPos(e.clientX, e.clientY),
                                    );
                                  }}
                                >
                                  <div className="pointer-events-none flex h-full items-center gap-1 px-2 text-[10px] font-semibold text-amber-100">
                                    {(track.locked || clip.locked) && (
                                      <Lock className="h-3 w-3 shrink-0" />
                                    )}
                                    <span className="truncate">{clip.name}</span>
                                  </div>
                                  {!(track.locked || clip.locked) && (
                                    <>
                                      <div
                                        className="absolute inset-y-0 left-0 z-20 w-2 cursor-ew-resize bg-white/80"
                                        onPointerDown={(e) =>
                                          onLayerClipPointerDown(
                                            e,
                                            clip.id,
                                            "layer-trim-in",
                                          )
                                        }
                                      />
                                      <div
                                        className="absolute inset-y-0 right-0 z-20 w-2 cursor-ew-resize bg-white/80"
                                        onPointerDown={(e) =>
                                          onLayerClipPointerDown(
                                            e,
                                            clip.id,
                                            "layer-trim-out",
                                          )
                                        }
                                      />
                                    </>
                                  )}
                                </div>
                              );
                            })}
                            {clips.length === 0 && gaps.length === 0 && (
                              <button
                                type="button"
                                className="absolute inset-x-2 inset-y-1 rounded border border-dashed border-[#444] text-[10px] text-[#888] hover:border-[#f5c518] hover:text-[#f5c518]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  layerTargetTrackRef.current = track.id;
                                  layerMediaRef.current?.click();
                                }}
                              >
                                + فيديو أو صورة
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {/* Video 1 base lane — مقاطع بعد القص + إفلات في الفراغ */}
                      <div
                        className={`absolute inset-x-0 ${
                          timelineDropTarget === "base-video"
                            ? "z-20 bg-[#f5c518]/15 ring-1 ring-inset ring-[#f5c518]"
                            : ""
                        }`}
                        style={{
                          top: RULER + 2 + layerCount * (VIDEO_H + 4),
                          height: VIDEO_H,
                        }}
                        onDragOver={(e) => {
                          const abs = timeFromClientX(e.clientX);
                          const gap = findGapAt(abs);
                          if (gap) {
                            onTimelineDragOver(e, `gap-${gap.leftId}`);
                          } else {
                            onTimelineDragOver(e, "base-video");
                          }
                        }}
                        onDragLeave={() =>
                          setTimelineDropTarget((t) =>
                            t === "base-video" || t?.startsWith("gap-")
                              ? null
                              : t,
                          )
                        }
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const abs = timeFromClientX(e.clientX);
                          const gap = findGapAt(abs);
                          if (gap) {
                            const assetId =
                              e.dataTransfer.getData(MEDIA_DND_MIME) ||
                              e.dataTransfer.getData("text/plain");
                            const asset = mediaLibrary.find(
                              (a) => a.id === assetId,
                            );
                            if (asset && asset.kind !== "audio") {
                              void insertMediaInGap(
                                gap.start,
                                gap.duration,
                                null,
                                asset,
                              );
                              setTimelineDropTarget(null);
                              return;
                            }
                            const f = e.dataTransfer.files?.[0];
                            if (
                              f &&
                              (f.type.startsWith("video/") ||
                                f.type.startsWith("image/"))
                            ) {
                              const trackOpts = resolveTrackForGapPlacement();
                              void placeFileAsLayer(f, {
                                start: gap.start - trimIn + 0.01,
                                trackId: trackOpts.trackId,
                                newTrack: trackOpts.newTrack,
                                fitGap: true,
                              });
                              setTimelineDropTarget(null);
                              return;
                            }
                            void insertMediaInGap(gap.start, gap.duration);
                            setTimelineDropTarget(null);
                            return;
                          }
                          void dropMediaOnTimeline(e, { type: "new-layer" });
                        }}
                      >
                        <div className="pointer-events-none absolute inset-y-0 w-full border-t border-[#252528]" />
                        {/* فراغات بين اللقطات — أسقط صورة/فيديو هنا */}
                        {[...mainClips]
                          .sort((a, b) => a.start - b.start)
                          .map((clip, i, arr) => {
                            if (i >= arr.length - 1) return null;
                            const next = arr[i + 1]!;
                            const gapStart = clip.start + clip.duration;
                            const gapDur = next.start - gapStart;
                            if (gapDur < 0.15) return null;
                            const left = timelinePct(gapStart);
                            const width = Math.max(
                              2,
                              timelinePct(gapStart + gapDur) - left,
                            );
                            const hot =
                              timelineDropTarget === `gap-${clip.id}`;
                            return (
                              <div
                                key={`gap-${clip.id}`}
                                role="button"
                                tabIndex={0}
                                title="اسحب فيديو/صورة إلى هنا أو اضغط للاختيار"
                                className={`absolute inset-y-0.5 z-30 flex cursor-pointer items-center justify-center rounded border-2 border-dashed text-[9px] font-semibold ${
                                  hot
                                    ? "border-[#f5c518] bg-[#f5c518]/35 text-[#f5c518] shadow-[0_0_12px_rgba(245,197,24,0.35)]"
                                    : "border-[#888] bg-[#2a2a2e]/95 text-[#ddd] hover:border-[#f5c518] hover:text-[#f5c518]"
                                }`}
                                style={{ left: `${left}%`, width: `${width}%` }}
                                onPointerDown={(e) => {
                                  // منع خط الزمن من preventDefault الذي يلغي النقر
                                  e.stopPropagation();
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  void insertMediaInGap(gapStart, gapDur);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    void insertMediaInGap(gapStart, gapDur);
                                  }
                                }}
                                onPointerUp={(e) => {
                                  const drag = dragRef.current;
                                  if (
                                    drag?.kind === "layer-move" &&
                                    drag.id
                                  ) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    snapLayerIntoGap(
                                      drag.id,
                                      {
                                        start: gapStart,
                                        duration: gapDur,
                                        leftId: clip.id,
                                      },
                                      bottomLayerTrackId(),
                                    );
                                    dragRef.current = null;
                                    setTimelineDropTarget(null);
                                  }
                                }}
                                onDragOver={(e) =>
                                  onTimelineDragOver(e, `gap-${clip.id}`)
                                }
                                onDragLeave={() =>
                                  setTimelineDropTarget((t) =>
                                    t === `gap-${clip.id}` ? null : t,
                                  )
                                }
                                onDrop={(e) =>
                                  void handleGapDrop(e, gapStart, gapDur)
                                }
                              >
                                {hot || mediaDragActive
                                  ? "أفلت فوق الفراغ"
                                  : "+ صورة / فيديو هنا"}
                              </div>
                            );
                          })}
                        {(mainClips.length > 0
                          ? mainClips
                          : [
                              {
                                id: "main-fallback",
                                start: trimIn,
                                duration: Math.max(0.1, trimOut - trimIn),
                                offset: trimIn,
                              },
                            ]
                        ).map((clip) => {
                          const left = timelinePct(clip.start);
                          const width = Math.max(
                            1.2,
                            timelinePct(clip.start + clip.duration) - left,
                          );
                          const selected =
                            selectedId === "video" || selectedId === clip.id;
                          return (
                            <div
                              key={clip.id}
                              className={`absolute h-full overflow-hidden rounded border-2 border-amber-400 ${
                                !videoLane.visible ? "opacity-35" : ""
                              } ${
                                videoLane.locked
                                  ? "cursor-not-allowed"
                                  : "cursor-grab active:cursor-grabbing"
                              } ${
                                selected
                                  ? "ring-1 ring-[#f5c518]/50"
                                  : ""
                              }`}
                              style={{
                                left: `${left}%`,
                                width: `${width}%`,
                                background:
                                  "linear-gradient(to left, #5a3a10, #3a2810)",
                              }}
                              title="اسحب يميناً/يساراً · مقص رأس التشغيل للقص"
                              onPointerDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (videoLane.locked) return;
                                setSelectedId("video");
                                setPropTab("video");
                                dragRef.current = {
                                  kind: "main-move",
                                  id: clip.id,
                                  startX: e.clientX,
                                  startY: e.clientY,
                                  ox: clip.start,
                                  oy: clip.offset,
                                  ow: clip.duration,
                                  oh: duration || clip.duration,
                                };
                                (e.currentTarget as HTMLElement).setPointerCapture(
                                  e.pointerId,
                                );
                              }}
                            >
                              <div className="flex h-full items-center gap-1 px-2 text-[10px] font-semibold text-amber-400">
                                {videoLane.locked && (
                                  <Lock className="h-3 w-3 shrink-0" />
                                )}
                                <span className="truncate">{file.name}</span>
                                {videoLane.muted && (
                                  <VolumeX className="ms-auto h-3 w-3 shrink-0 opacity-80" />
                                )}
                              </div>
                              {!videoLane.locked && (
                                <>
                                  <div
                                    className="absolute inset-y-0 left-0 w-2 cursor-ew-resize bg-amber-400"
                                    onPointerDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSelectedId(clip.id);
                                      dragRef.current = {
                                        kind: "main-trim-in",
                                        id: clip.id,
                                        startX: e.clientX,
                                        startY: e.clientY,
                                        ox: clip.start,
                                        oy: clip.offset,
                                        ow: clip.duration,
                                        oh: duration || clip.duration,
                                      };
                                      (
                                        e.currentTarget as HTMLElement
                                      ).setPointerCapture(e.pointerId);
                                    }}
                                  />
                                  <div
                                    className="absolute inset-y-0 right-0 w-2 cursor-ew-resize bg-amber-400"
                                    onPointerDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSelectedId(clip.id);
                                      dragRef.current = {
                                        kind: "main-trim-out",
                                        id: clip.id,
                                        startX: e.clientX,
                                        startY: e.clientY,
                                        ox: clip.start,
                                        oy: clip.offset,
                                        ow: clip.duration,
                                        oh: duration || clip.duration,
                                      };
                                      (
                                        e.currentTarget as HTMLElement
                                      ).setPointerCapture(e.pointerId);
                                    }}
                                  />
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Audio lanes */}
                      {lanes.map((t, i) => {
                        const top =
                          RULER +
                          2 +
                          layerCount * (VIDEO_H + 4) +
                          VIDEO_H +
                          8 +
                          i * (LANE_H + LANE_GAP);
                        const left = timelinePct(trimIn + t.start);
                        const width = projectEnd
                          ? Math.max(1.2, (t.duration / projectEnd) * 100)
                          : 1;
                        const peaks = peaksForClip(
                          t.peaks?.length ? t.peaks : videoPeaks,
                          t.offset || 0,
                          t.duration,
                          t.sourceDuration || duration || 1,
                        );
                        const selected =
                          selectedId === t.id || selectedId === "audio";
                        const isTts = t.id.startsWith("tts-");
                        const hidden = t.visible === false;
                        const locked = !!t.locked;
                        return (
                          <div
                            key={t.id}
                            className={`absolute inset-x-0 ${
                              timelineDropTarget === `audio-${t.id}`
                                ? "z-20 bg-[#7dd3fc]/15 ring-1 ring-inset ring-[#7dd3fc]"
                                : ""
                            }`}
                            style={{ top, height: LANE_H }}
                            onDragOver={(e) =>
                              onTimelineDragOver(e, `audio-${t.id}`)
                            }
                            onDragLeave={() =>
                              setTimelineDropTarget((cur) =>
                                cur === `audio-${t.id}` ? null : cur,
                              )
                            }
                            onDrop={(e) =>
                              void dropMediaOnTimeline(e, { type: "audio" })
                            }
                          >
                            <div className="pointer-events-none absolute inset-y-0 start-0 w-full border-t border-[#252528]" />
                            <div
                              role="button"
                              tabIndex={0}
                              className={`absolute h-full overflow-hidden rounded-[3px] border ${
                                locked
                                  ? "cursor-not-allowed"
                                  : "cursor-grab active:cursor-grabbing"
                              } ${
                                selected
                                  ? "border-[#7dd3fc] ring-1 ring-[#7dd3fc]/40"
                                  : isTts
                                    ? "border-emerald-700"
                                    : "border-[#0e4d73]"
                              } ${isTts ? "bg-emerald-800" : "bg-[#0c5f8f]"} ${
                                hidden ? "opacity-35" : ""
                              }`}
                              style={{ left: `${left}%`, width: `${width}%` }}
                              title={
                                locked
                                  ? "المسار مقفل"
                                  : "اسحب الطبقة · قص الحواف · كليك يمين"
                              }
                              onPointerDown={(e) =>
                                onAudioClipPointerDown(e, t.id, "audio-move")
                              }
                              onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedId(t.id);
                                setPanel("audio");
                                setCtxMenu(clampMenuPos(e.clientX, e.clientY));
                              }}
                            >
                              <div className="pointer-events-none absolute start-1 top-0.5 z-10 flex max-w-[70%] items-center gap-1 truncate rounded bg-black/35 px-1.5 py-[1px] text-[9px] font-semibold text-white">
                                {locked && <Lock className="h-2.5 w-2.5" />}
                                <span className="truncate">{t.name}</span>
                              </div>
                              <div className="pointer-events-none absolute inset-x-0 bottom-1.5 top-4">
                                <WaveformBars
                                  peaks={peaks}
                                  dimmed={
                                    t.volume <= 0 || !!t.muted || hidden
                                  }
                                />
                              </div>
                              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 bg-black/35" />
                              {!locked && (
                                <>
                                  <div
                                    className="absolute inset-y-0 left-0 z-20 w-2 cursor-ew-resize rounded-s-[2px] bg-white/90"
                                    onPointerDown={(e) =>
                                      onAudioClipPointerDown(
                                        e,
                                        t.id,
                                        "audio-trim-in",
                                      )
                                    }
                                  />
                                  <div
                                    className="absolute inset-y-0 right-0 z-20 w-2 cursor-ew-resize rounded-e-[2px] bg-white/90"
                                    onPointerDown={(e) =>
                                      onAudioClipPointerDown(
                                        e,
                                        t.id,
                                        "audio-trim-out",
                                      )
                                    }
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      <div
                        className={`absolute inset-x-2 flex items-center justify-center gap-2 rounded border border-dashed text-[11px] ${
                          timelineDropTarget === "new-layer-zone"
                            ? "border-[#f5c518] bg-[#f5c518]/10 text-[#f5c518]"
                            : "border-[#333] text-[#666]"
                        }`}
                        style={{
                          top:
                            RULER +
                            2 +
                            layerCount * (VIDEO_H + 4) +
                            VIDEO_H +
                            8 +
                            Math.max(1, lanes.length) * (LANE_H + LANE_GAP),
                          height: ADD_H,
                        }}
                        onDragOver={(e) =>
                          onTimelineDragOver(e, "new-layer-zone")
                        }
                        onDragLeave={() =>
                          setTimelineDropTarget((t) =>
                            t === "new-layer-zone" ? null : t,
                          )
                        }
                        onDrop={(e) =>
                          void dropMediaOnTimeline(e, { type: "new-layer" })
                        }
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addVideoLayerTrack();
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-[#f5c518]/40 bg-[#2a2410] px-2 py-0.5 text-[#f5c518] hover:bg-[#3a3218]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          مسار فيديو
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            musicRef.current?.click();
                            setPanel("media");
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-[#444] bg-[#222] px-2 py-0.5 text-[#ccc] hover:border-[#7dd3fc] hover:text-[#7dd3fc]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          مسار صوت
                        </button>
                      </div>

                      <div
                        className="pointer-events-none absolute top-0 z-[80] h-full"
                        style={{ left: `${timelinePct(currentTime)}%` }}
                      >
                        {/* خط الرأس فوق كل الشرائط */}
                        <div
                          className="pointer-events-auto absolute inset-y-0 left-1/2 z-[81] w-3 -translate-x-1/2 cursor-ew-resize"
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            onTimelinePointerDown(e, "playhead");
                          }}
                        >
                          <div className="mx-auto h-full w-[2px] bg-[#ff4d2e] shadow-[0_0_0_1px_rgba(0,0,0,0.35)]" />
                        </div>
                        {/* المقص أسفل المسطرة قليلاً — على المسارات مثل Filmora/CapCut */}
                        <button
                          type="button"
                          title="انقر للتقسيم (B)"
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            splitAtPlayhead();
                          }}
                          className="group pointer-events-auto absolute top-[26px] left-1/2 z-[82] flex -translate-x-1/2 flex-col items-center"
                        >
                          <span className="inline-flex h-11 w-7 items-center justify-center rounded-full border-2 border-white/90 bg-[#e11d2e] text-white shadow-[0_2px_10px_rgba(0,0,0,0.45)] hover:scale-105 hover:bg-[#f12a3c]">
                            <Scissors className="h-4 w-4" strokeWidth={2.5} />
                          </span>
                          <span className="pointer-events-none absolute start-full top-1/2 ms-2 hidden -translate-y-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-1 text-center text-[10px] leading-4 text-white group-hover:block">
                            انقر للتقسيم (B)
                            <br />
                            اسحب الخط لتحريك الرأس
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
            <p className="mt-2 text-center text-[11px] text-[#666]">
              ضع الفيديو/الصورة بحرية: اسحب من المكتبة إلى أي مسار ووقت، ثم حرّك
              المقطع يميناً/يساراً أو أعلى/أسفل · الفراغ المنقّط اختياري لملء
              القص فقط
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

      {mediaPrompt &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/65 p-4">
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-md rounded-2xl border border-[#333] bg-[#1c1c1f] p-5 text-white shadow-2xl"
            >
              <div className="mb-3 flex items-center gap-2">
                <Clapperboard className="h-5 w-5 text-[#2dd4bf]" />
                <h2 className="text-base font-bold">Tool2Day</h2>
              </div>
              <p className="text-sm leading-7 text-[#ccc]">
                دقة أو معدل إطارات الفيديو لا يتطابق مع إعدادات المشروع. هل تريد
                تحديث إعدادات المشروع لتطابق الوسائط؟
              </p>
              <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs text-[#aaa]">
                <input
                  type="checkbox"
                  checked={mediaPrompt.skipChecked}
                  onChange={(e) =>
                    setMediaPrompt((p) =>
                      p ? { ...p, skipChecked: e.target.checked } : p,
                    )
                  }
                />
                لا تعرض هذه مرة أخرى
              </label>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => confirmMediaPrompt("keep")}
                  className="rounded-xl border border-[#444] bg-[#2a2a2e] px-3 py-3 text-center hover:bg-[#333]"
                >
                  <div className="text-sm font-semibold text-[#ddd]">
                    احتفظ بالإعدادات الحالية
                  </div>
                  <div className="mt-1 text-xs text-[#888]">
                    {projectProfile.w}×{projectProfile.h} {projectProfile.fps}
                    fps
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => confirmMediaPrompt("match")}
                  className="rounded-xl bg-[#2dd4bf] px-3 py-3 text-center font-bold text-[#042f2e] hover:bg-[#5eead4]"
                >
                  <div className="text-sm">المطابقة مع الوسائط</div>
                  <div className="mt-1 text-xs opacity-80">
                    {mediaPrompt.media.w}×{mediaPrompt.media.h}{" "}
                    {mediaPrompt.media.fps}fps
                  </div>
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {ctxMenu &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[9998] cursor-default bg-transparent"
              aria-label="إغلاق القائمة"
              onClick={() => setCtxMenu(null)}
              onContextMenu={(e) => {
                e.preventDefault();
                setCtxMenu(null);
              }}
            />
            <div
              ref={ctxMenuRef}
              role="menu"
              className="fixed z-[9999] min-w-52 rounded-lg border border-[#444] bg-[#1a1a1d] py-1 text-sm shadow-2xl"
              style={{ left: ctxMenu.x, top: ctxMenu.y }}
              onClick={(e) => e.stopPropagation()}
            >
              {(
                [
                  { label: "تقسيم", shortcut: "S", fn: () => splitAtPlayhead() },
                  {
                    label: "تكرار",
                    shortcut: "D",
                    fn: () => duplicateSelected(),
                  },
                  {
                    label: "نسخ",
                    shortcut: "C",
                    fn: () => copySelected(),
                  },
                  {
                    label: "لصق",
                    shortcut: "V",
                    fn: () => pasteAudioFromClipboard(),
                  },
                  {
                    label: "صامت",
                    shortcut: "M",
                    fn: () => setPrimaryAudioVolume(0),
                  },
                  {
                    label: "فصل الصوت",
                    shortcut: "A",
                    fn: () => {
                      void detachAudio();
                    },
                  },
                  {
                    label: "حذف",
                    shortcut: "Del",
                    fn: () => deleteSelected(),
                    danger: true,
                  },
                ] as const
              ).map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-right hover:bg-[#2a2a2e] ${
                    "danger" in item && item.danger
                      ? "text-red-400"
                      : "text-[#ddd]"
                  }`}
                  onClick={() => {
                    item.fn();
                    setCtxMenu(null);
                  }}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] text-[#666]">{item.shortcut}</span>
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}

      {showRecordStudio && (
        <RecordStudio
          onClose={() => setShowRecordStudio(false)}
          onRecorded={(f) => void loadVideoFile(f)}
        />
      )}
    </div>
  );
}
