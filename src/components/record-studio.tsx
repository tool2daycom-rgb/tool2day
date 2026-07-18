"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ArrowRight,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Monitor,
  Square,
} from "lucide-react";

type Props = {
  onClose: () => void;
  onRecorded: (file: File) => void;
};

function formatRecTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function RecordStudio({ onClose, onRecorded }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const camVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const dragRef = useRef<{
    mode: "move" | "resize";
    startX: number;
    startY: number;
    ox: number;
    oy: number;
    ow: number;
    oh: number;
  } | null>(null);

  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenOn, setScreenOn] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("فعّل الكاميرا/الشاشة ثم اضغط سجّل");
  const [camBox, setCamBox] = useState({
    x: 24,
    y: 0,
    w: 220,
    h: 160,
  });
  const [camReady, setCamReady] = useState(false);
  const [screenReady, setScreenReady] = useState(false);

  const camStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Place cam near bottom-left once stage known
    const canvas = canvasRef.current;
    if (canvas) {
      setCamBox((b) => ({
        ...b,
        y: Math.max(40, canvas.clientHeight - b.h - 24),
      }));
    }
    return () => {
      stopAllStreams();
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  function stopAllStreams() {
    [camStreamRef, screenStreamRef, micStreamRef].forEach((ref) => {
      ref.current?.getTracks().forEach((t) => t.stop());
      ref.current = null;
    });
  }

  async function enableCamera(on: boolean) {
    setError(null);
    if (!on) {
      camStreamRef.current?.getTracks().forEach((t) => t.stop());
      camStreamRef.current = null;
      if (camVideoRef.current) camVideoRef.current.srcObject = null;
      setCamOn(false);
      setCamReady(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      camStreamRef.current?.getTracks().forEach((t) => t.stop());
      camStreamRef.current = stream;
      if (camVideoRef.current) {
        camVideoRef.current.srcObject = stream;
        await camVideoRef.current.play();
      }
      setCamOn(true);
      setCamReady(true);
      setStatus("الكاميرا جاهزة — يمكنك تحريكها وتغيير حجمها");
    } catch {
      setError("تعذر الوصول للكاميرا — اسمح من إعدادات المتصفح");
      setCamOn(false);
      setCamReady(false);
    }
  }

  async function enableMic(on: boolean) {
    setError(null);
    if (!on) {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      setMicOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = stream;
      setMicOn(true);
    } catch {
      setError("تعذر الوصول للميكروفون");
      setMicOn(false);
    }
  }

  async function enableScreen(on: boolean) {
    setError(null);
    if (!on) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
      setScreenOn(false);
      setScreenReady(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = stream;
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        setScreenOn(false);
        setScreenReady(false);
        if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
      });
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
        await screenVideoRef.current.play();
      }
      setScreenOn(true);
      setScreenReady(true);
      setStatus("الشاشة جاهزة — اضغط سجّل للبدء");
    } catch {
      setError("تم إلغاء مشاركة الشاشة");
      setScreenOn(false);
      setScreenReady(false);
    }
  }

  function drawLoop() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = "#1a1a1d";
    ctx.fillRect(0, 0, w, h);

    const screenVid = screenVideoRef.current;
    if (screenReady && screenVid && screenVid.readyState >= 2) {
      // cover
      const vw = screenVid.videoWidth || w;
      const vh = screenVid.videoHeight || h;
      const scale = Math.max(w / vw, h / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      ctx.drawImage(screenVid, (w - dw) / 2, (h - dh) / 2, dw, dh);
    } else if (!camReady) {
      ctx.fillStyle = "#888";
      ctx.font = "18px Cairo, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("فعّل الشاشة أو الكاميرا ثم اضغط سجّل", w / 2, h / 2);
    }

    const camVid = camVideoRef.current;
    if (camReady && camOn && camVid && camVid.readyState >= 2) {
      const { x, y, w: cw, h: ch } = camBox;
      ctx.save();
      // rounded rect clip
      const r = 12;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + cw, y, x + cw, y + ch, r);
      ctx.arcTo(x + cw, y + ch, x, y + ch, r);
      ctx.arcTo(x, y + ch, x, y, r);
      ctx.arcTo(x, y, x + cw, y, r);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(camVid, x, y, cw, ch);
      ctx.restore();
      // border
      ctx.strokeStyle = "#f5c518";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + cw, y, x + cw, y + ch, r);
      ctx.arcTo(x + cw, y + ch, x, y + ch, r);
      ctx.arcTo(x, y + ch, x, y, r);
      ctx.arcTo(x, y, x + cw, y, r);
      ctx.closePath();
      ctx.stroke();
    }

    rafRef.current = requestAnimationFrame(drawLoop);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    rafRef.current = requestAnimationFrame(drawLoop);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camReady, screenReady, camOn, camBox]);

  function onCamPointerDown(e: ReactPointerEvent, mode: "move" | "resize") {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      ox: camBox.x,
      oy: camBox.y,
      ow: camBox.w,
      oh: camBox.h,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onCamPointerMove(e: ReactPointerEvent) {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (drag.mode === "move") {
      setCamBox({
        x: Math.max(0, Math.min(canvas.width - drag.ow, drag.ox + dx)),
        y: Math.max(0, Math.min(canvas.height - drag.oh, drag.oy + dy)),
        w: drag.ow,
        h: drag.oh,
      });
    } else {
      const w = Math.max(120, Math.min(canvas.width - drag.ox, drag.ow + dx));
      const h = Math.max(90, Math.min(canvas.height - drag.oy, drag.oh + dy));
      setCamBox({ x: drag.ox, y: drag.oy, w, h });
    }
  }

  function onCamPointerUp() {
    dragRef.current = null;
  }

  async function startRecording() {
    setError(null);
    if (!screenReady && !camReady) {
      setError("فعّل الشاشة أو الكاميرا أولاً");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Ensure mic if requested
    if (micOn && !micStreamRef.current) {
      await enableMic(true);
    }

    const canvasStream = canvas.captureStream(30);
    const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

    if (micOn && micStreamRef.current) {
      tracks.push(...micStreamRef.current.getAudioTracks());
    } else if (screenStreamRef.current) {
      const sysAudio = screenStreamRef.current.getAudioTracks();
      if (sysAudio.length) tracks.push(...sysAudio);
    }

    const mixed = new MediaStream(tracks);
    chunksRef.current = [];
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";
    const recorder = new MediaRecorder(mixed, { mimeType: mime });
    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunksRef.current.push(ev.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const file = new File([blob], `recording-${Date.now()}.webm`, {
        type: "video/webm",
      });
      onRecorded(file);
      setRecording(false);
      setStatus("تم حفظ التسجيل وإضافته للمحرر");
    };
    recorderRef.current = recorder;
    recorder.start(250);
    setElapsed(0);
    setRecording(true);
    setStatus("جاري التسجيل…");
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
  }

  // Auto-start camera on mount for 123apps-like feel
  useEffect(() => {
    void enableCamera(true);
    void enableMic(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#0e0e10] text-white">
      <div className="flex items-center justify-between border-b border-[#2a2a2e] px-4 py-3">
        <button
          type="button"
          onClick={() => {
            stopRecording();
            stopAllStreams();
            onClose();
          }}
          className="inline-flex items-center gap-2 text-sm text-[#ccc] hover:text-white"
        >
          <ArrowRight className="h-4 w-4" />
          الرجوع للخلف
        </button>
        <p className="text-sm font-semibold text-[#f5c518]">استوديو التسجيل</p>
        <span className="w-24" />
      </div>

      <div className="relative min-h-0 flex-1 bg-[#151518] p-4">
        <div className="relative mx-auto h-full max-w-6xl overflow-hidden rounded-2xl bg-[#1a1a1d]">
          <canvas ref={canvasRef} className="h-full w-full" />
          {/* Hidden video elements for streams */}
          <video ref={camVideoRef} className="hidden" muted playsInline />
          <video ref={screenVideoRef} className="hidden" muted playsInline />

          {/* Interactive cam handles overlay (UI only — drawing is on canvas) */}
          {camOn && camReady && (
            <div
              className="absolute z-10 cursor-move"
              style={{
                left: camBox.x,
                top: camBox.y,
                width: camBox.w,
                height: camBox.h,
              }}
              onPointerDown={(e) => onCamPointerDown(e, "move")}
              onPointerMove={onCamPointerMove}
              onPointerUp={onCamPointerUp}
              onPointerCancel={onCamPointerUp}
            >
              <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-[#f5c518]" />
              {(
                [
                  ["nw", "left-0 top-0 -translate-x-1/2 -translate-y-1/2"],
                  ["ne", "right-0 top-0 translate-x-1/2 -translate-y-1/2"],
                  ["sw", "left-0 bottom-0 -translate-x-1/2 translate-y-1/2"],
                  ["se", "right-0 bottom-0 translate-x-1/2 translate-y-1/2"],
                ] as const
              ).map(([corner, cls]) => (
                <div
                  key={corner}
                  className={`absolute h-3.5 w-3.5 rounded-sm bg-[#f5c518] ${cls}`}
                  onPointerDown={(e) => onCamPointerDown(e, "resize")}
                />
              ))}
            </div>
          )}

          {!screenReady && !camReady && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 text-[#888]">
              <div className="flex gap-6 text-[#f97316]">
                <Camera className="h-10 w-10" strokeWidth={1.5} />
                <Mic className="h-10 w-10" strokeWidth={1.5} />
                <Monitor className="h-10 w-10" strokeWidth={1.5} />
              </div>
              <p className="max-w-md text-center text-sm leading-7">
                اسمح بالوصول للكاميرا والميكروفون، أو فعّل مشاركة الشاشة لبدء
                التسجيل
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom control bar — 123apps style */}
      <div className="border-t border-[#2a2a2e] bg-[#121214] px-4 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void enableCamera(!camOn)}
              className={`flex h-11 w-11 items-center justify-center rounded-lg border ${
                camOn
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                  : "border-[#333] text-[#888]"
              }`}
              title="الكاميرا"
            >
              {camOn ? (
                <Camera className="h-5 w-5" />
              ) : (
                <CameraOff className="h-5 w-5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => void enableMic(!micOn)}
              className={`flex h-11 w-11 items-center justify-center rounded-lg border ${
                micOn
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                  : "border-[#333] text-[#888]"
              }`}
              title="الميكروفون"
            >
              {micOn ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => void enableScreen(!screenOn)}
              className={`inline-flex h-11 items-center gap-2 rounded-lg border px-3 text-sm ${
                screenOn
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                  : "border-[#333] text-[#ccc]"
              }`}
            >
              <Monitor className="h-5 w-5" />
              الشاشة
            </button>
          </div>

          <p className="font-mono text-sm text-white">
            {formatRecTime(elapsed)} / 01:30:00
          </p>

          {recording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="inline-flex items-center gap-2 rounded-xl bg-[#ef4444] px-8 py-3 text-sm font-bold text-white"
            >
              <Square className="h-4 w-4 fill-white" />
              إيقاف
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void startRecording()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#f97316] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-orange-900/30"
            >
              <span className="h-3.5 w-3.5 rounded-full bg-white" />
              سجّل
            </button>
          )}
        </div>
        {(status || error) && (
          <p
            className={`mx-auto mt-3 max-w-6xl text-center text-xs ${
              error ? "text-red-400" : "text-[#888]"
            }`}
          >
            {error || status}
          </p>
        )}
      </div>
    </div>
  );
}
