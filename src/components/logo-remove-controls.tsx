"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type DelogoBox = { x: number; y: number; w: number; h: number };

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

type Mode = "auto" | "corner" | "draw";

function clampBox(box: DelogoBox, vw: number, vh: number): DelogoBox {
  let { x, y, w, h } = box;
  x = Math.max(1, Math.min(vw - 4, Math.round(x)));
  y = Math.max(1, Math.min(vh - 4, Math.round(y)));
  w = Math.max(4, Math.min(vw - x - 1, Math.round(w)));
  h = Math.max(4, Math.min(vh - y - 1, Math.round(h)));
  if (w % 2) w -= 1;
  if (h % 2) h -= 1;
  if (x % 2) x += 1;
  if (y % 2) y += 1;
  return { x, y, w: Math.max(4, w), h: Math.max(4, h) };
}

function cornerBox(
  corner: Corner,
  vw: number,
  vh: number,
  size: "s" | "m" | "l",
): DelogoBox {
  const frac = size === "s" ? 0.09 : size === "l" ? 0.16 : 0.12;
  const w = Math.round(vw * frac);
  const h = Math.round(vh * (frac * 0.55));
  const m = Math.max(6, Math.round(Math.min(vw, vh) * 0.012));
  switch (corner) {
    case "top-right":
      return clampBox({ x: vw - w - m, y: m, w, h }, vw, vh);
    case "bottom-left":
      return clampBox({ x: m, y: vh - h - m, w, h }, vw, vh);
    case "bottom-right":
      return clampBox({ x: vw - w - m, y: vh - h - m, w, h }, vw, vh);
    case "top-left":
    default:
      return clampBox({ x: m, y: m, w, h }, vw, vh);
  }
}

function allCornerBoxes(
  vw: number,
  vh: number,
  size: "s" | "m" | "l",
): DelogoBox[] {
  return (
    ["top-left", "top-right", "bottom-left", "bottom-right"] as Corner[]
  ).map((c) => cornerBox(c, vw, vh, size));
}

/** Wait until the browser has a real decoded frame (not a blank canvas). */
function captureVideoFrame(
  file: File,
): Promise<{ w: number; h: number; bitmap: ImageBitmap; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.crossOrigin = "anonymous";

    let settled = false;
    const fail = (msg: string) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      reject(new Error(msg));
    };

    const finish = async () => {
      if (settled) return;
      const w = video.videoWidth || 0;
      const h = video.videoHeight || 0;
      if (!w || !h) {
        fail("تعذّر قراءة أبعاد الفيديو");
        return;
      }
      try {
        const bitmap = await createImageBitmap(video);
        settled = true;
        resolve({ w, h, bitmap, url });
      } catch {
        // Fallback: draw via canvas then bitmap
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        if (!ctx) {
          fail("تعذّر إنشاء معاينة الفيديو");
          return;
        }
        ctx.drawImage(video, 0, 0, w, h);
        try {
          const bitmap = await createImageBitmap(c);
          settled = true;
          resolve({ w, h, bitmap, url });
        } catch {
          fail("تعذّر التقاط إطار من الفيديو");
        }
      }
    };

    video.onerror = () => fail("تعذّر تحميل الفيديو للمعاينة");

    video.onloadedmetadata = () => {
      // Seek slightly forward so Chrome/Safari decode a visible frame.
      const t =
        Number.isFinite(video.duration) && video.duration > 0.2
          ? Math.min(0.15, video.duration * 0.02)
          : 0.001;
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        void finish();
      };
      video.addEventListener("seeked", onSeeked);
      try {
        video.currentTime = t;
      } catch {
        // Some files reject seek — try play/pause instead.
        void video
          .play()
          .then(() => {
            video.pause();
            void finish();
          })
          .catch(() => void finish());
      }
    };

    video.src = url;
    video.load();
  });
}

type Props = {
  file: File | null;
  onBoxesChange: (boxes: DelogoBox[]) => void;
};

export function LogoRemoveControls({ file, onBoxesChange }: Props) {
  const [mode, setMode] = useState<Mode>("draw");
  const [corner, setCorner] = useState<Corner>("top-right");
  const [size, setSize] = useState<"s" | "m" | "l">("s");
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [drawBox, setDrawBox] = useState<DelogoBox | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<ImageBitmap | null>(null);
  const dragRef = useRef<{ x0: number; y0: number } | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const paint = useCallback(
    (overlay?: DelogoBox | null) => {
      const canvas = canvasRef.current;
      const frame = frameRef.current;
      if (!canvas || !frame || !dims.w) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);

      const boxes =
        mode === "auto"
          ? allCornerBoxes(dims.w, dims.h, size)
          : mode === "corner"
            ? [cornerBox(corner, dims.w, dims.h, size)]
            : overlay
              ? [overlay]
              : drawBox
                ? [drawBox]
                : [];

      const sx = canvas.width / dims.w;
      const sy = canvas.height / dims.h;
      ctx.strokeStyle = "#E8874A";
      ctx.fillStyle = "rgba(232,135,74,0.28)";
      ctx.lineWidth = 2;
      for (const b of boxes) {
        ctx.fillRect(b.x * sx, b.y * sy, b.w * sx, b.h * sy);
        ctx.strokeRect(b.x * sx, b.y * sy, b.w * sx, b.h * sy);
      }
    },
    [corner, dims.h, dims.w, drawBox, mode, size],
  );

  useEffect(() => {
    let cancelled = false;

    if (!file) {
      setPreviewUrl(null);
      setDims({ w: 0, h: 0 });
      setDrawBox(null);
      setPreviewError(null);
      setLoadingPreview(false);
      frameRef.current?.close();
      frameRef.current = null;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      onBoxesChange([]);
      return;
    }

    setLoadingPreview(true);
    setPreviewError(null);
    setDrawBox(null);

    void captureVideoFrame(file)
      .then(({ w, h, bitmap, url }) => {
        if (cancelled) {
          bitmap.close();
          URL.revokeObjectURL(url);
          return;
        }
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = url;
        frameRef.current?.close();
        frameRef.current = bitmap;

        const maxW = 720;
        const scale = Math.min(1, maxW / w);
        const cw = Math.max(2, Math.round(w * scale));
        const ch = Math.max(2, Math.round(h * scale));

        setDims({ w, h });
        setPreviewUrl(url);
        setLoadingPreview(false);

        // Paint after canvas mounts — use captured size (state may not flush yet).
        requestAnimationFrame(() => {
          const canvas = canvasRef.current;
          const frame = frameRef.current;
          if (!canvas || !frame || cancelled) return;
          canvas.width = cw;
          canvas.height = ch;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(frame, 0, 0, cw, ch);
        });
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadingPreview(false);
        setPreviewError(
          e instanceof Error ? e.message : "تعذّر عرض معاينة الفيديو",
        );
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  useEffect(() => {
    if (!dims.w || !dims.h) return;
    if (mode === "auto") {
      onBoxesChange(allCornerBoxes(dims.w, dims.h, size));
    } else if (mode === "corner") {
      onBoxesChange([cornerBox(corner, dims.w, dims.h, size)]);
    } else if (mode === "draw" && drawBox) {
      onBoxesChange([clampBox(drawBox, dims.w, dims.h)]);
    } else {
      onBoxesChange([]);
    }
  }, [mode, corner, size, dims, drawBox, onBoxesChange]);

  useEffect(() => {
    paint(drawBox);
  }, [paint, drawBox, previewUrl]);

  function pointerToCanvas(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(1, rect.width);
    const scaleY = canvas.height / Math.max(1, rect.height);
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function canvasToVideo(cx: number, cy: number) {
    const canvas = canvasRef.current!;
    return {
      x: (cx / canvas.width) * dims.w,
      y: (cy / canvas.height) * dims.h,
    };
  }

  return (
    <div className="sm:col-span-2 space-y-4 rounded-xl border border-[#e8e8e8] bg-[#fafafa] p-4">
      <div>
        <p className="text-sm font-bold text-[#111]">
          إزالة الشعار / العلامة المائية
        </p>
        <p className="mt-1 text-xs leading-6 text-[#666]">
          ارسم مربعاً <strong>على النجمة/العلامة فقط</strong> بدون ما يلمس الحذاء.
          التنظيف يتم برقعة ناعمة الحواف تندمج مع الخلفية — بدون مربع ظاهر.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["draw", "⭐ تحديد بالرسم (الأفضل)"],
            ["corner", "زاوية واحدة"],
            ["auto", "تلقائي — الزوايا"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`rounded-md border px-3 py-2 text-xs font-semibold ${
              mode === id
                ? "border-[#111] bg-[#111] text-white"
                : "border-[#ddd] bg-white text-[#333]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "corner" ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              ["top-right", "أعلى يمين"],
              ["top-left", "أعلى يسار"],
              ["bottom-right", "أسفل يمين"],
              ["bottom-left", "أسفل يسار"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setCorner(id)}
              className={`rounded-md border px-2 py-2 text-xs font-semibold ${
                corner === id
                  ? "border-[#111] bg-[#111] text-white"
                  : "border-[#ddd] bg-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      <label className="block text-sm text-[#333]">
        حجم منطقة الإزالة
        <select
          className="mt-2 block w-full rounded-md border border-[#ddd] bg-white px-3 py-2"
          value={size}
          onChange={(e) => setSize(e.target.value as "s" | "m" | "l")}
        >
          <option value="s">صغير (شعار صغير)</option>
          <option value="m">متوسط (الأكثر شيوعاً)</option>
          <option value="l">كبير (شعار عريض)</option>
        </select>
      </label>

      {loadingPreview ? (
        <p className="text-xs font-medium text-[#555]">
          جارٍ تحميل معاينة الفيديو…
        </p>
      ) : null}
      {previewError ? (
        <p className="text-xs font-medium text-red-600">{previewError}</p>
      ) : null}

      {previewUrl && dims.w > 0 ? (
        <div>
          <p className="mb-2 text-xs text-[#888]">
            معاينة {dims.w}×{dims.h} —{" "}
            {mode === "draw"
              ? "اسحب مربعاً فوق العلامة المائية"
              : "المناطق المحددة بالبرتقالي"}
            {" · "}التصدير بنفس هذه الدقة
          </p>
          <canvas
            ref={canvasRef}
            className={`max-w-full rounded-lg border border-[#ddd] bg-[#111] ${
              mode === "draw" ? "cursor-crosshair" : ""
            }`}
            onPointerDown={(e) => {
              if (mode !== "draw" || !canvasRef.current) return;
              const { x, y } = pointerToCanvas(e);
              dragRef.current = { x0: x, y0: y };
              canvasRef.current.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (mode !== "draw" || !dragRef.current || !canvasRef.current)
                return;
              const { x: cx, y: cy } = pointerToCanvas(e);
              const { x0, y0 } = dragRef.current;
              const p1 = canvasToVideo(Math.min(x0, cx), Math.min(y0, cy));
              const p2 = canvasToVideo(Math.max(x0, cx), Math.max(y0, cy));
              const next = {
                x: p1.x,
                y: p1.y,
                w: Math.max(4, p2.x - p1.x),
                h: Math.max(4, p2.y - p1.y),
              };
              setDrawBox(next);
              paint(next);
            }}
            onPointerUp={() => {
              dragRef.current = null;
            }}
          />
        </div>
      ) : !loadingPreview && !previewError ? (
        <p className="text-xs text-[#888]">ارفع فيديو أولاً لعرض المعاينة</p>
      ) : null}
    </div>
  );
}
