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

type MediaProfile = {
  w: number;
  h: number;
  fps: number;
};

const SETTINGS_PROMPT_KEY = "tool2day-skip-media-settings-prompt";
const DEFAULT_PROJECT: MediaProfile = { w: 1080, h: 1920, fps: 25 };

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
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    kind:
      | "move"
      | "resize"
      | "trim-in"
      | "trim-out"
      | "playhead"
      | "video-move"
      | "video-resize"
      | "audio-move"
      | "audio-trim-in"
      | "audio-trim-out";
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
  const [rotate, setRotate] = useState<0 | 90 | 180 | 270>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [aspect, setAspect] = useState<Aspect>("original");
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

  const outSize = useMemo(() => {
    if (lockProjectSize) {
      return {
        w: projectProfile.w,
        h: projectProfile.h,
      };
    }
    return aspectSize(aspect, videoNatural.w, videoNatural.h);
  }, [aspect, videoNatural, lockProjectSize, projectProfile]);

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
    // When an audio lane owns sound, keep the video element silent
    const hasAudioLane = audioTracks.some(
      (t) => t.id === "linked-audio" || t.id.startsWith("detached-"),
    );
    if (hasAudioLane) {
      v.muted = true;
      v.volume = 0;
    } else {
      v.volume = muted ? 0 : volume;
      v.muted = muted;
    }
  }, [speed, volume, muted, audioTracks]);

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

  // Keep audio-lane elements in sync with the playhead (supports left/right offset)
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
      const timelineLocal = currentTime - trimIn - t.start;
      if (timelineLocal >= 0 && timelineLocal < t.duration - 0.02) {
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

  const TIMELINE_ZOOM_MIN = 0.15;
  const TIMELINE_ZOOM_MAX = 10;

  useEffect(() => {
    const scroll = timelineScrollRef.current;
    if (!scroll) return;
    function onWheel(e: WheelEvent) {
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
    setStatus("تكبير لتناسب الخط الزمني");
  }
  useEffect(() => {
    if (!file) return;
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        splitAtPlayhead();
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
  }, [file, selectedId, audioTracks, muted, volume, currentTime, trimIn]);

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
    setVideoBox({ x: 0, y: 0, w: 1, h: 1 });
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
      const linked = audioTracks.find((t) => t.id === "linked-audio");
      const id = nextId(idCounterRef, "detached");
      setAudioTracks((prev) => [
        ...prev.filter(
          (t) => t.id !== "linked-audio" && !t.id.startsWith("detached-"),
        ),
        {
          id,
          name: file.name,
          file: audioFile,
          url: audioUrl,
          start: linked?.start ?? 0,
          volume: linked?.volume ?? (volume > 0 ? volume : 1),
          duration: linked?.duration ?? dur,
          offset: linked?.offset ?? 0,
          sourceDuration: dur,
          peaks,
        },
      ]);
      setMuted(true);
      setVolume(0);
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

  function splitAtPlayhead() {
    const track = getSelectedAudioTrack();
    if (track) {
      const local = currentTime - trimIn - track.start;
      if (local <= 0.15 || local >= track.duration - 0.15) {
        setError("حرّك رأس التشغيل داخل مسار الصوت الأزرق ثم اقسم");
        return;
      }
      const rightId = nextId(
        idCounterRef,
        track.id.startsWith("detached")
          ? "detached"
          : track.id === "linked-audio"
            ? "audio"
            : "audio",
      );
      const left: AudioTrack = { ...track, duration: local };
      const right: AudioTrack = {
        ...track,
        id: rightId,
        name: `${track.name} (2)`,
        start: track.start + local,
        offset: (track.offset || 0) + local,
        duration: track.duration - local,
      };
      setAudioTracks((prev) => [
        ...prev.filter((t) => t.id !== track.id),
        left,
        right,
      ]);
      setSelectedId(rightId);
      setStatus(`تم تقسيم الصوت عند ${formatTime(currentTime)}`);
      setError(null);
      return;
    }

    if (currentTime <= trimIn + 0.1 || currentTime >= trimOut - 0.1) {
      setError("حرّك رأس التشغيل داخل المقطع ثم اقسم");
      return;
    }
    setTrimOut(currentTime);
    setStatus(`تم قص الفيديو عند ${formatTime(currentTime)}`);
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

  function onAudioClipPointerDown(
    e: ReactPointerEvent,
    id: string,
    kind: "audio-move" | "audio-trim-in" | "audio-trim-out",
  ) {
    e.preventDefault();
    e.stopPropagation();
    const track = audioTracks.find((t) => t.id === id);
    if (!track) return;
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
      if (!el || !duration) return;
      const rect = el.getBoundingClientRect();
      const dt = ((e.clientX - drag.startX) / Math.max(1, rect.width)) * duration;
      if (drag.kind === "audio-move") {
        const maxStart = Math.max(0, duration - drag.ow);
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
            offset: t.offset || 0,
            duration: t.duration,
            linked: t.id === "linked-audio",
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
              <div className="rounded-md border border-[#333] bg-[#101012] px-3 py-2 text-xs text-[#aaa]">
                المشروع: {projectProfile.w}×{projectProfile.h}{" "}
                {projectProfile.fps}fps
                {lockProjectSize ? " · مقفل على الإعدادات" : ""}
              </div>
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
                      setLockProjectSize(false);
                      setVideoBox({ x: 0, y: 0, w: 1, h: 1 });
                    }}
                    className={`rounded-md px-2 py-2 text-xs ${
                      aspect === id && !lockProjectSize
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
              } ${previewTool === "hand" ? "cursor-grab active:cursor-grabbing" : ""}`}
              style={{
                aspectRatio: `${outSize.w} / ${outSize.h}`,
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
              <div
                className={`absolute overflow-hidden ${
                  selectedId === "video" ? "ring-2 ring-[#f5c518]" : ""
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
                  opacity,
                  transform: [
                    rotate ? `rotate(${rotate}deg)` : "",
                    flipH ? "scaleX(-1)" : "",
                    flipV ? "scaleY(-1)" : "",
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined,
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
              title="تقسيم الصوت/الفيديو (S)"
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

          {/* Multi-lane timeline */}
          <div className="shrink-0 border-t border-[#2a2a2e] bg-[#121214] p-3">
            {(() => {
              const RULER = 22;
              const VIDEO_H = 36;
              const LANE_H = 48;
              const LANE_GAP = 6;
              const ADD_H = 32;
              const lanes = audioTracks;
              const bodyH =
                RULER +
                VIDEO_H +
                8 +
                Math.max(1, lanes.length) * (LANE_H + LANE_GAP) +
                ADD_H +
                8;
              return (
                <div
                  ref={timelineScrollRef}
                  dir="ltr"
                  className="max-h-72 overflow-x-auto overflow-y-auto rounded-md border border-[#2a2a2e] bg-[#1a1a1d]"
                >
                  <div
                    ref={timelineRef}
                    className="relative ms-0"
                    style={{
                      // zoom=1 يملأ العرض من البداية؛ <1 يصغّر مع إبقاء البداية؛ >1 يوسّع للتمرير
                      width: `${Math.max(TIMELINE_ZOOM_MIN, timelineZoom) * 100}%`,
                      minWidth: timelineZoom >= 1 ? "100%" : undefined,
                      height: bodyH,
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
                    {/* Ruler */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 flex h-[22px] items-end justify-between border-b border-[#2a2a2e] px-1 pb-0.5 text-[9px] text-[#777]">
                      {Array.from({
                        length: Math.max(
                          4,
                          Math.round(Math.max(timelineZoom, 0.4) * 8),
                        ),
                      }).map((_, i, arr) => (
                          <span key={i}>
                            {formatTime((duration * i) / Math.max(1, arr.length - 1))}
                          </span>
                        ),
                      )}
                    </div>

                    {/* Video lane — دائماً من بداية الخط الزمني (0) */}
                    <div
                      className="absolute inset-x-0"
                      style={{ top: RULER + 4, height: VIDEO_H }}
                    >
                      <div
                        className="absolute h-full overflow-hidden rounded border-2 border-amber-400"
                        style={{
                          left: `${timelinePct(trimIn)}%`,
                          width: `${Math.max(1, timelinePct(trimOut) - timelinePct(trimIn))}%`,
                          background:
                            "linear-gradient(to left, #5a3a10, #3a2810)",
                        }}
                      >
                        <div className="flex h-full items-center px-2 text-[10px] font-semibold text-amber-400">
                          {file.name}
                        </div>
                        <div
                          className="absolute inset-y-0 left-0 w-2 cursor-ew-resize bg-amber-400"
                          onPointerDown={(e) =>
                            onTimelinePointerDown(e, "trim-in")
                          }
                        />
                        <div
                          className="absolute inset-y-0 right-0 w-2 cursor-ew-resize bg-amber-400"
                          onPointerDown={(e) =>
                            onTimelinePointerDown(e, "trim-out")
                          }
                        />
                      </div>
                    </div>

                    {/* Stacked audio lanes (montage) */}
                    {lanes.map((t, i) => {
                      const top =
                        RULER + VIDEO_H + 12 + i * (LANE_H + LANE_GAP);
                      const left = timelinePct(trimIn + t.start);
                      const width = duration
                        ? Math.max(1.2, (t.duration / duration) * 100)
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
                      return (
                        <div
                          key={t.id}
                          className="absolute inset-x-0"
                          style={{ top, height: LANE_H }}
                        >
                          <div className="pointer-events-none absolute inset-y-0 start-0 w-full border-t border-[#252528]" />
                          <div
                            role="button"
                            tabIndex={0}
                            className={`absolute h-full cursor-grab overflow-hidden rounded-[3px] border active:cursor-grabbing ${
                              selected
                                ? "border-[#7dd3fc] ring-1 ring-[#7dd3fc]/40"
                                : isTts
                                  ? "border-emerald-700"
                                  : "border-[#0e4d73]"
                            } ${isTts ? "bg-emerald-800" : "bg-[#0c5f8f]"}`}
                            style={{ left: `${left}%`, width: `${width}%` }}
                            title="اسحب الطبقة · قص الحواف · كليك يمين"
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
                            <div className="pointer-events-none absolute start-1 top-0.5 z-10 max-w-[70%] truncate rounded bg-black/35 px-1.5 py-[1px] text-[9px] font-semibold text-white">
                              {t.name}
                            </div>
                            <div className="pointer-events-none absolute inset-x-0 bottom-1.5 top-4">
                              <WaveformBars
                                peaks={peaks}
                                dimmed={t.volume <= 0}
                              />
                            </div>
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 bg-black/35" />
                            <div
                              className="absolute inset-y-0 left-0 z-20 w-2 cursor-ew-resize rounded-s-[2px] bg-white/90"
                              onPointerDown={(e) =>
                                onAudioClipPointerDown(e, t.id, "audio-trim-in")
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
                          </div>
                        </div>
                      );
                    })}

                    {/* Empty placeholder lane + add button */}
                    <div
                      className="absolute inset-x-2 flex items-center justify-center gap-2 rounded border border-dashed border-[#333] text-[11px] text-[#666]"
                      style={{
                        top:
                          RULER +
                          VIDEO_H +
                          12 +
                          Math.max(1, lanes.length) * (LANE_H + LANE_GAP),
                        height: ADD_H,
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          musicRef.current?.click();
                          setPanel("media");
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-[#444] bg-[#222] px-2 py-0.5 text-[#ccc] hover:border-[#f5c518] hover:text-[#f5c518]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        أضف مسار صوت
                      </button>
                      <span>ضع الملفات هنا أو اضغط للرفع</span>
                    </div>

                    {/* Playhead */}
                    <div
                      className="pointer-events-none absolute top-0 z-30 h-full w-0.5 bg-[#ff4d2e]"
                      style={{ left: `${timelinePct(currentTime)}%` }}
                    >
                      <div className="absolute -top-0 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-sm bg-[#ff4d2e]" />
                    </div>
                  </div>
                </div>
              );
            })()}
            <p className="mt-2 text-center text-[11px] text-[#666]">
              المقاطع تبدأ من 0:00 · أداة اليد لتحريك الفيديو · عجلة الماوس
              للتكبير
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
