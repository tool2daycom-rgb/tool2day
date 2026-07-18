export type ActiveToolKind =
  | "video-convert"
  | "video-trim"
  | "audio-convert"
  | "audio-trim"
  | "pdf-merge"
  | "pdf-split"
  | "coming-soon";

export const activeToolKinds: Record<string, ActiveToolKind> = {
  "video-converter": "video-convert",
  "trim-video": "video-trim",
  "audio-converter": "audio-convert",
  "trim-audio": "audio-trim",
  "pdf-merge": "pdf-merge",
  "pdf-split": "pdf-split",
};

export function getToolKind(slug: string): ActiveToolKind {
  return activeToolKinds[slug] ?? "coming-soon";
}

export const MAX_CLIENT_FILE_MB = 80;
