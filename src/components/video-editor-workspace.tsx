"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
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
  Ratio,
  Scissors,
  SkipBack,
  SkipForward,
  Sticker,
  Trash2,
  Type,
  Volume2,
  VolumeX,
  Download,
  Upload,
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
type Aspect = "original" | "16:9" | "9:16" | "1:1";

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
  start: number;
  volume: number;
  duration: number;
  peaks?: number[];
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

function WaveformBars({
  peaks,
  className = "bg-sky-300",
  dimmed = false,
}: {
  peaks: number[];
  className?: string;
  dimmed?: boolean;
}) {
  const bars = peaks.length > 0 ? peaks : Array.from({ length: 64 }, () => 0.35);
  return (
    <div
      className={`flex h-full items-center gap-px px-0.5 ${dimmed ? "opacity-35" : "opacity-90"}`}
      aria-hidden
    >
      {bars.map((p, i) => (
        <span
          key={i}
          className={`min-w-[1px] flex-1 rounded-[1px] ${className}`}
          style={{ height: `${Math.max(8, Math.round(p * 88))}%` }}
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
  const [audioPitch, setAudioPitch] = useState(1);
  const [audioReverse, setAudioReverse] = useState(false);
  const [noiseReduce, setNoiseReduce] = useState(false);
  const [audioSection, setAudioSection] = useState<AudioSection>("volume");
  const [videoPeaks, setVideoPeaks] = useState<number[]>([]);
  const audioElsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [rotate, setRotate] = useState<0 | 90 | 180 | 270>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [aspect, setAspect] = useState<Aspect>("original");
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
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [showRecordStudio, setShowRecordStudio] = useState(false);
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

  // Keep secondary audio tracks in sync with the playhead
  useEffect(() => {
    const map = audioElsRef.current;
    const liveIds = new Set(audioTracks.map((t) => t.id));
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
      el.volume = Math.max(0, Math.min(1, t.volume));
      const local = currentTime - trimIn - t.start;
      if (local >= 0 && local < t.duration - 0.02) {
        if (Math.abs(el.currentTime - local) > 0.3) {
          el.currentTime = Math.max(0, local);
        }
        if (playing && el.paused) void el.play().catch(() => undefined);
        if (!playing && !el.paused) el.pause();
      } else if (!el.paused) {
        el.pause();
      }
    }
  }, [audioTracks, currentTime, playing, trimIn]);

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

  async function onPick(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    await loadVideoFile(f);
  }

  async function loadVideoFile(f: File) {
    if (url) URL.revokeObjectURL(url);
    const next = URL.createObjectURL(f);
    setFile(f);
    setUrl(next);
    setOverlays((prev) => {
      prev.forEach((o) => {
        if (o.type === "image") URL.revokeObjectURL(o.src);
      });
      return [];
    });
    setAudioTracks((prev) => {
      prev.forEach((t) => URL.revokeObjectURL(t.url));
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
    void analyzeWaveform(f, 180).then((peaks) => {
      setVideoPeaks(peaks);
      setStatus(`تم تحميل: ${f.name} · ذبذبات الصوت جاهزة`);
    });
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

  async function detachAudio() {
    if (!file) return;
    if (audioTracks.some((t) => t.id.startsWith("detached-"))) {
      setStatus("الصوت مفصول مسبقاً على مسار مستقل");
      setMuted(true);
      setVolume(0);
      return;
    }
    setDetachBusy(true);
    setError(null);
    setStatus("جاري فصل الصوت عن الفيديو…");
    try {
      const audioFile = await extractAudioTrack(file, (r) =>
        setProgress(Math.round(r * 100)),
      );
      const audioUrl = URL.createObjectURL(audioFile);
      const dur = (await loadMediaDuration(audioUrl)) || clipDuration;
      const peaks =
        videoPeaks.length > 0
          ? videoPeaks
          : await analyzeWaveform(audioFile, 180);
      const id = nextId(idCounterRef, "detached");
      setAudioTracks((prev) => [
        ...prev.filter((t) => !t.id.startsWith("detached-")),
        {
          id,
          name: "صوت مفصول",
          file: audioFile,
          url: audioUrl,
          start: 0,
          volume: volume > 0 ? volume : 1,
          duration: dur,
          peaks,
        },
      ]);
      setMuted(true);
      setVolume(0);
      setSelectedId(id);
      setStatus("تم فصل الصوت — مسار أزرق مستقل تحت الفيديو");
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
    const id = nextId(idCounterRef, "i");
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
        opacity: 1,
      },
    ]);
    setSelectedId(id);
    setStatus("اسحب زوايا الصورة لتغيير الحجم");
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
      if (victim) URL.revokeObjectURL(victim.url);
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

  function deleteSelected() {
    if (selectedId === "video" || selectedId === "audio") return;
    const track = audioTracks.find((t) => t.id === selectedId);
    if (track) {
      removeAudioTrack(track.id);
      setSelectedId("video");
      return;
    }
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
    const id = nextId(idCounterRef, src.type[0]);
    setOverlays((prev) => [
      ...prev,
      {
        ...src,
        id,
        x: Math.min(0.8, src.x + 0.04),
        y: Math.min(0.8, src.y + 0.04),
      },
    ]);
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
          flipH,
          flipV,
          opacity,
          volume,
          muted,
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
          audioTracks: audioTracks.map((t) => ({
            file: t.file,
            start: t.start,
            volume: t.volume,
          })),
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
          {navBtn("media", "وسائط", ImageIcon)}
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
                استخدم تبويب &quot;وسائط&quot; لإضافة صور أو موسيقى أو استبدال
                الفيديو، و&quot;ملصقات&quot; للإيموجي والعبارات الجاهزة.
              </p>
            </div>
          )}

          {panel === "media" && (
            <div className="space-y-3 text-sm">
              <p className="font-semibold text-[#f5c518]">الوسائط</p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => imageRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-md border border-[#333] px-3 py-2 text-xs hover:bg-[#222]"
                >
                  <ImagePlus className="h-4 w-4" />
                  رفع صورة (إضافة كطبقة)
                </button>
                <button
                  type="button"
                  onClick={() => musicRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-md border border-[#333] px-3 py-2 text-xs hover:bg-[#222]"
                >
                  <Music className="h-4 w-4" />
                  رفع موسيقى
                </button>
                <button
                  type="button"
                  onClick={() => videoSwapRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-md border border-[#333] px-3 py-2 text-xs hover:bg-[#222]"
                >
                  <FileVideo className="h-4 w-4" />
                  استبدال الفيديو
                </button>
              </div>
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
                onChange={(e) => void uploadMusic(e.target.files)}
              />
              <input
                ref={videoSwapRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => void onPick(e.target.files)}
              />
              <p className="text-[11px] leading-5 text-[#777]">
                تظهر الموسيقى في المخطط الزمني بالأصفر، والتعليق الصوتي (تحويل
                النص إلى كلام) بالأخضر.
              </p>
              {audioTracks.filter((t) => !t.id.startsWith("tts-")).length >
                0 && (
                <div className="space-y-1 border-t border-[#2a2a2e] pt-2">
                  <p className="text-[11px] text-[#888]">الموسيقى المضافة</p>
                  {audioTracks
                    .filter((t) => !t.id.startsWith("tts-"))
                    .map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-2 rounded border border-[#333] px-2 py-1 text-[11px]"
                      >
                        <span className="truncate">{t.name}</span>
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
                                  setMuted((m) => !m);
                                  setStatus(
                                    muted
                                      ? "تم إلغاء كتم الصوت"
                                      : "تم كتم صوت المقطع",
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
                                const v = Number(e.target.value) / 100;
                                setVolume(v);
                                setMuted(v <= 0);
                                const det = audioTracks.find((t) =>
                                  t.id.startsWith("detached-"),
                                );
                                if (det) {
                                  setAudioTracks((prev) =>
                                    prev.map((t) =>
                                      t.id === det.id
                                        ? { ...t, volume: Math.max(0.01, v) }
                                        : t,
                                    ),
                                  );
                                }
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
                disabled={detachBusy || !file}
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
                <button
                  type="button"
                  disabled={detachBusy || !file}
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
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#0a0a0b]">
          <div
            className={`flex flex-1 items-center justify-center p-4 ${
              fullscreen ? "min-h-0" : ""
            }`}
          >
            <div
              ref={stageRef}
              className={`relative w-full max-w-4xl bg-black shadow-2xl ${
                fullscreen ? "max-h-full" : "max-h-[48vh]"
              }`}
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
                  opacity,
                  transform: [
                    rotate ? `rotate(${rotate}deg)` : "",
                    flipH ? "scaleX(-1)" : "",
                    flipV ? "scaleY(-1)" : "",
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined,
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
          <div className="shrink-0 border-t border-[#2a2a2e] bg-[#121214] p-3">
            <div
              ref={timelineRef}
              className="relative h-32 overflow-hidden rounded-md bg-[#1a1a1d]"
              style={{
                transform: `scaleX(${timelineZoom})`,
                transformOrigin: "right center",
              }}
              onPointerMove={onTimelineMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onPointerDown={(e) => onTimelinePointerDown(e, "playhead")}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCtxMenu(clampMenuPos(e.clientX, e.clientY));
              }}
            >
              {/* Ruler ticks */}
              <div className="pointer-events-none absolute inset-x-0 top-0 flex h-4 justify-between px-1 text-[9px] text-[#666]">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i}>{formatTime((duration * i) / 5)}</span>
                ))}
              </div>

              {/* Video clip */}
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

              {/* Primary blue audio waveform (linked or detached) */}
              {(() => {
                const detached = audioTracks.find((t) =>
                  t.id.startsWith("detached-"),
                );
                const peaks = detached?.peaks?.length
                  ? detached.peaks
                  : slicePeaks(videoPeaks, trimIn, trimOut, duration);
                const left = detached
                  ? timelinePct(trimIn + detached.start)
                  : timelinePct(trimIn);
                const width = detached
                  ? duration
                    ? Math.max(1, (detached.duration / duration) * 100)
                    : 1
                  : Math.max(1, timelinePct(trimOut) - timelinePct(trimIn));
                const dimmed = detached
                  ? detached.volume <= 0
                  : muted || volume <= 0;
                return (
                  <button
                    type="button"
                    className={`absolute top-[3.65rem] h-10 overflow-hidden rounded border-2 text-left ${
                      selectedId === (detached?.id ?? "audio")
                        ? "border-sky-300"
                        : "border-sky-600"
                    } bg-[#0b4f7a]`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={detached ? detached.name : "صوت الفيديو"}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(detached?.id ?? "audio");
                      setPanel("audio");
                      setPropTab("audio");
                      setAudioSection("volume");
                    }}
                  >
                    <WaveformBars peaks={peaks} dimmed={dimmed} />
                  </button>
                );
              })()}

              {/* Extra audio tracks (music / TTS) */}
              {audioTracks.filter((t) => !t.id.startsWith("detached-")).length >
                0 && (
                <div className="absolute inset-x-0 top-[6.9rem] h-5">
                  {audioTracks
                    .filter((t) => !t.id.startsWith("detached-"))
                    .map((t) => {
                      const isTts = t.id.startsWith("tts-");
                      const left = timelinePct(trimIn + t.start);
                      const width = duration
                        ? Math.max(1, (t.duration / duration) * 100)
                        : 1;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          className={`absolute h-5 overflow-hidden rounded border ${
                            isTts
                              ? "border-emerald-600 bg-emerald-500/90"
                              : "border-amber-500 bg-yellow-400/90"
                          }`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={t.name}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(t.id);
                            setPanel("audio");
                          }}
                        >
                          {t.peaks?.length ? (
                            <WaveformBars
                              peaks={t.peaks}
                              className={
                                isTts ? "bg-emerald-950" : "bg-amber-900"
                              }
                            />
                          ) : (
                            <span className="px-1 text-[9px] font-semibold text-black">
                              {isTts ? "🎙" : "🎵"} {t.name}
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              )}

              {/* Playhead */}
              <div
                className="absolute top-0 z-20 h-full w-0.5 bg-white"
                style={{ left: `${timelinePct(currentTime)}%` }}
              >
                <div className="absolute -top-0 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-sm bg-white" />
              </div>
            </div>
            <p className="mt-2 text-center text-[11px] text-[#666]">
              المسار الأزرق = ذبذبات الصوت · اضغطه لفتح أدوات الصوت · كليك يمين
              للفصل
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
                    fn: () => setStatus("تم نسخ العنصر المحدد"),
                  },
                  {
                    label: "صامت",
                    shortcut: "M",
                    fn: () => {
                      setMuted(true);
                      setVolume(0);
                    },
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
