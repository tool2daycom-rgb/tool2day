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
  | "audio-convert"
  | "audio-trim"
  | "audio-volume"
  | "audio-speed"
  | "audio-pitch"
  | "audio-reverse"
  | "audio-join"
  | "pdf-merge"
  | "pdf-split"
  | "pdf-rotate"
  | "pdf-compress"
  | "jpg-to-pdf"
  | "image-convert"
  | "screen-recorder"
  | "voice-recorder"
  | "video-recorder"
  | "coming-soon";

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
  "screen-recorder": "screen-recorder",
  "video-recorder": "video-recorder",
  "audio-converter": "audio-convert",
  "trim-audio": "audio-trim",
  "change-audio-volume": "audio-volume",
  "change-audio-speed": "audio-speed",
  "change-pitch": "audio-pitch",
  "reverse-audio": "audio-reverse",
  "audio-joiner": "audio-join",
  "voice-recorder": "voice-recorder",
  "pdf-merge": "pdf-merge",
  "pdf-split": "pdf-split",
  "pdf-rotate": "pdf-rotate",
  "pdf-compress": "pdf-compress",
  "jpg-to-pdf": "jpg-to-pdf",
  "image-converter": "image-convert",
};

export function getToolKind(slug: string): ActiveToolKind {
  return activeToolKinds[slug] ?? "coming-soon";
}

export function isToolLive(slug: string) {
  return getToolKind(slug) !== "coming-soon";
}

export const MAX_CLIENT_FILE_MB = 80;
