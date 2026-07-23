export type ActiveToolKind =
  | "video-convert"
  | "video-trim"
  | "video-rotate"
  | "video-flip"
  | "video-resize"
  | "video-speed"
  | "video-volume"
  | "video-loop"
  | "video-merge"
  | "video-editor"
  | "video-crop"
  | "video-add-audio"
  | "video-add-image"
  | "video-add-text"
  | "video-delogo"
  | "video-stabilize"
  | "video-enhance"
  | "audio-convert"
  | "audio-trim"
  | "audio-volume"
  | "audio-speed"
  | "audio-pitch"
  | "audio-reverse"
  | "audio-join"
  | "audio-eq"
  | "pdf-editor"
  | "pdf-merge"
  | "pdf-split"
  | "pdf-rotate"
  | "pdf-compress"
  | "pdf-pages"
  | "pdf-protect"
  | "pdf-unlock"
  | "pdf-to-word"
  | "pdf-to-excel"
  | "pdf-to-jpg"
  | "pdf-to-png"
  | "jpg-to-pdf"
  | "word-to-pdf"
  | "excel-to-pdf"
  | "ppt-to-pdf"
  | "doc-to-pdf"
  | "image-convert"
  | "screen-recorder"
  | "voice-recorder"
  | "video-recorder"
  | "tts"
  | "media-downloader"
  | "video-to-text"
  | "text-tools"
  | "error-detector"
  | "speed-test"
  | "archive-extract"
  | "archive-convert"
  | "ebook-convert"
  | "font-convert";

/** Every catalog slug maps to a working kind — no coming-soon. */
export const activeToolKinds: Record<string, ActiveToolKind> = {
  "video-converter": "video-convert",
  "trim-video": "video-trim",
  "rotate-video": "video-rotate",
  "flip-video": "video-flip",
  "resize-video": "video-resize",
  "change-video-speed": "video-speed",
  "change-video-volume": "video-volume",
  "loop-video": "video-loop",
  "merge-videos": "video-merge",
  "video-editor": "video-editor",
  "crop-video": "video-crop",
  "add-audio-to-video": "video-add-audio",
  "add-image-to-video": "video-add-image",
  "add-text-to-video": "video-add-text",
  "remove-logo": "video-delogo",
  "stabilize-video": "video-stabilize",
  "enhance-video": "video-enhance",
  "screen-recorder": "screen-recorder",
  "video-recorder": "video-recorder",
  "text-to-speech": "tts",
  "media-downloader": "media-downloader",
  "video-to-text": "video-to-text",
  "text-tools": "text-tools",
  "error-detector": "error-detector",
  "speed-test": "speed-test",
  "audio-converter": "audio-convert",
  "trim-audio": "audio-trim",
  "change-audio-volume": "audio-volume",
  "change-audio-speed": "audio-speed",
  "change-pitch": "audio-pitch",
  "reverse-audio": "audio-reverse",
  "audio-joiner": "audio-join",
  equalizer: "audio-eq",
  "voice-recorder": "voice-recorder",
  "pdf-editor": "pdf-editor",
  "pdf-merge": "pdf-merge",
  "pdf-split": "pdf-split",
  "pdf-rotate": "pdf-rotate",
  "pdf-compress": "pdf-compress",
  "pdf-page-numbers": "pdf-pages",
  "pdf-protect": "pdf-protect",
  "pdf-unlock": "pdf-unlock",
  "pdf-to-word": "pdf-to-word",
  "pdf-to-excel": "pdf-to-excel",
  "pdf-to-jpg": "pdf-to-jpg",
  "pdf-to-png": "pdf-to-png",
  "jpg-to-pdf": "jpg-to-pdf",
  "word-to-pdf": "word-to-pdf",
  "excel-to-pdf": "excel-to-pdf",
  "ppt-to-pdf": "ppt-to-pdf",
  "document-converter": "doc-to-pdf",
  "image-converter": "image-convert",
  "archive-extractor": "archive-extract",
  "archive-converter": "archive-convert",
  "ebook-converter": "ebook-convert",
  "font-converter": "font-convert",
};

export function getToolKind(slug: string): ActiveToolKind {
  return activeToolKinds[slug] ?? "image-convert";
}

export function isToolLive(_slug: string) {
  return true;
}

export const MAX_CLIENT_FILE_MB = 80;
