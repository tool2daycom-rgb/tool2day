"use client";

import { useRef, useState } from "react";
import type { Tool } from "@/lib/tools";

type Props = {
  tool: Tool;
};

export function ToolWorkspace({ tool }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setFileName(file.name);
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 backdrop-blur sm:p-8">
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
          onFiles(e.dataTransfer.files);
        }}
        className={`flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed px-4 text-center transition ${
          dragging
            ? "border-accent bg-accent-soft/40"
            : "border-line bg-white/50"
        }`}
      >
        <p className="text-base font-semibold text-ink">
          اسحب الملف هنا أو اختر من جهازك
        </p>
        <p className="mt-2 max-w-sm text-sm leading-7 text-ink-soft">
          {tool.description}
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-5 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep"
        >
          اختيار ملف
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={tool.accept}
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {fileName ? (
        <div className="mt-5 rounded-lg border border-line bg-white/70 px-4 py-3">
          <p className="text-sm text-ink">
            الملف المحدد: <span className="font-semibold">{fileName}</span>
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            واجهة الأداة جاهزة. معالجة الملفات ستُربط لاحقاً بمحرك التحويل.
          </p>
          <button
            type="button"
            className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
          >
            متابعة
          </button>
        </div>
      ) : null}
    </div>
  );
}
