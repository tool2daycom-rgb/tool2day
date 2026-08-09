"use client";

import { useEffect, useRef, useState } from "react";

export type DelogoBox = { x: number; y: number; w: number; h: number };

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

type Mode = "auto" | "corner" | "draw";

function clampBox(
  box: DelogoBox,
  vw: number,
  vh: number,
): DelogoBox {
  let { x, y, w, h } = box;
  // حدود آمنة داخل الإطار (أرقام زوجية للمعالجة)
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
  // مناطق أصغر بكثير لتفادي اللطخات الكبيرة
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ x0: number; y0: number } | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setDims({ w: 0, h: 0 });
      onBoxesChange([]);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = url;
    video.onloadeddata = () => {
      const w = video.videoWidth || 1280;
      const h = video.videoHeight || 720;
      setDims({ w, h });
      const canvas = canvasRef.current;
      if (canvas) {
        const maxW = 640;
        const scale = Math.min(1, maxW / w);
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
      }
    };
    return () => URL.revokeObjectURL(url);
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

  function redraw(overlay?: DelogoBox | null) {
    const canvas = canvasRef.current;
    if (!canvas || !previewUrl || !dims.w) return;
    const video = document.createElement("video");
    video.src = previewUrl;
    video.muted = true;
    video.onloadeddata = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
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
      ctx.fillStyle = "rgba(232,135,74,0.25)";
      ctx.lineWidth = 2;
      for (const b of boxes) {
        ctx.fillRect(b.x * sx, b.y * sy, b.w * sx, b.h * sy);
        ctx.strokeRect(b.x * sx, b.y * sy, b.w * sx, b.h * sy);
      }
    };
  }

  useEffect(() => {
    redraw(drawBox);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, corner, size, dims, drawBox, previewUrl]);

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
        <p className="text-sm font-bold text-[#111]">إزالة الشعار / العلامة المائية</p>
        <p className="mt-1 text-xs leading-6 text-[#666]">
          لأفضل نتيجة بلا أثر واضح: استخدم <strong>تحديد بالرسم</strong> وارسم
          مربعاً صغيراً يحيط بالشعار فقط (ليس أكبر منه).
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

      {previewUrl && dims.w > 0 ? (
        <div>
          <p className="mb-2 text-xs text-[#888]">
            معاينة — {mode === "draw" ? "اسحب مربعاً فوق الشعار" : "المناطق المحددة بالبرتقالي"}
          </p>
          <canvas
            ref={canvasRef}
            className={`max-w-full rounded-lg border border-[#ddd] ${
              mode === "draw" ? "cursor-crosshair" : ""
            }`}
            onPointerDown={(e) => {
              if (mode !== "draw" || !canvasRef.current) return;
              const rect = canvasRef.current.getBoundingClientRect();
              const cx = e.clientX - rect.left;
              const cy = e.clientY - rect.top;
              dragRef.current = { x0: cx, y0: cy };
              canvasRef.current.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (mode !== "draw" || !dragRef.current || !canvasRef.current)
                return;
              const rect = canvasRef.current.getBoundingClientRect();
              const cx = e.clientX - rect.left;
              const cy = e.clientY - rect.top;
              const { x0, y0 } = dragRef.current;
              const p1 = canvasToVideo(Math.min(x0, cx), Math.min(y0, cy));
              const p2 = canvasToVideo(Math.max(x0, cx), Math.max(y0, cy));
              setDrawBox({
                x: p1.x,
                y: p1.y,
                w: Math.max(4, p2.x - p1.x),
                h: Math.max(4, p2.y - p1.y),
              });
            }}
            onPointerUp={() => {
              dragRef.current = null;
            }}
          />
        </div>
      ) : (
        <p className="text-xs text-[#888]">ارفع فيديو أولاً لعرض المعاينة</p>
      )}
    </div>
  );
}
