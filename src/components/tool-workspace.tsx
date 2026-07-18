"use client";

import { useRef, useState } from "react";

type Props = {
  title: string;
  description: string;
  accept: string;
};

export function ToolWorkspace({ title, description, accept }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setFileName(file.name);
  }

  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 sm:p-8">
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
        className={`flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed px-4 text-center transition ${
          dragging
            ? "border-[#2563eb] bg-[#eff6ff]"
            : "border-[#d4d4d4] bg-[#fafafa]"
        }`}
      >
        <p className="text-base font-semibold text-[#111]">
          اسحب الملف هنا أو اختر من جهازك
        </p>
        <p className="mt-2 max-w-sm text-sm leading-7 text-[#666]">
          {description}
        </p>
        <p className="mt-1 text-xs text-[#999]">{title}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-5 rounded-md bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
        >
          اختيار ملف
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {fileName ? (
        <div className="mt-5 rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-4 py-3">
          <p className="text-sm text-[#222]">
            الملف المحدد: <span className="font-semibold">{fileName}</span>
          </p>
          <p className="mt-1 text-sm text-[#666]">
            واجهة الأداة جاهزة. معالجة الملفات ستُربط لاحقاً.
          </p>
          <button
            type="button"
            className="mt-4 rounded-md bg-[#111] px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
          >
            متابعة
          </button>
        </div>
      ) : null}
    </div>
  );
}
