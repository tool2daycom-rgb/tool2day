/** حفظ مشاريع محرر الفيديو محلياً في IndexedDB (تلقائياً عند المغادرة). */

const DB_NAME = "tool2day-video-editor";
const DB_VERSION = 1;
const STORE = "projects";
const MAX_PROJECTS = 8;

export type SavedProjectListItem = {
  id: string;
  name: string;
  updatedAt: number;
  duration: number;
  thumbnail: string | null;
  sizeBytes: number;
};

export type ProjectAssetBlob = {
  id: string;
  kind: "video" | "image" | "audio";
  name: string;
  type: string;
  blob: Blob;
};

/** حالة قابلة للتسلسل (بدون File/URL مباشرة) */
export type ProjectEditState = {
  trimIn: number;
  trimOut: number;
  volume: number;
  muted: boolean;
  fadeIn: number;
  fadeOut: number;
  speed: number;
  audioPitch: number;
  audioReverse: boolean;
  noiseReduce: boolean;
  rotate: number;
  flipH: boolean;
  flipV: boolean;
  opacity: number;
  aspect: string;
  customSize: { w: number; h: number };
  scaleLock: boolean;
  bgBlurEnabled: boolean;
  bgBlurAmount: number;
  canvasBg: string;
  projectProfile: { w: number; h: number; fps: number };
  lockProjectSize: boolean;
  videoBox: { x: number; y: number; w: number; h: number };
  videoNatural: { w: number; h: number };
  duration: number;
  mainClips: Array<{
    id: string;
    start: number;
    duration: number;
    offset: number;
  }>;
  videoLane: {
    visible: boolean;
    locked: boolean;
    muted: boolean;
    solo: boolean;
  };
  videoLayers: Array<{
    id: string;
    visible: boolean;
    locked: boolean;
    muted: boolean;
  }>;
  /** overlays: صور تشير إلى assetId */
  overlays: Array<Record<string, unknown>>;
  audioTracks: Array<Record<string, unknown>>;
  layerClips: Array<Record<string, unknown>>;
  mediaLibrary: Array<{
    id: string;
    kind: "video" | "image" | "audio";
    name: string;
    duration: number;
  }>;
};

export type SavedProjectRecord = {
  id: string;
  name: string;
  updatedAt: number;
  duration: number;
  thumbnail: string | null;
  sizeBytes: number;
  mainVideoName: string;
  mainVideoType: string;
  mainVideo: Blob;
  state: ProjectEditState;
  assets: ProjectAssetBlob[];
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

function idbReq<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB request failed"));
  });
}

export async function listSavedProjects(): Promise<SavedProjectListItem[]> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, "readonly");
    const all = await idbReq(tx.objectStore(STORE).getAll());
    return (all as SavedProjectRecord[])
      .map((p) => ({
        id: p.id,
        name: p.name,
        updatedAt: p.updatedAt,
        duration: p.duration,
        thumbnail: p.thumbnail,
        sizeBytes: p.sizeBytes,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } finally {
    db.close();
  }
}

export async function getSavedProject(
  id: string,
): Promise<SavedProjectRecord | null> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, "readonly");
    const row = await idbReq(tx.objectStore(STORE).get(id));
    return (row as SavedProjectRecord) ?? null;
  } finally {
    db.close();
  }
}

export async function deleteSavedProject(id: string): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, "readwrite");
    await idbReq(tx.objectStore(STORE).delete(id));
  } finally {
    db.close();
  }
}

async function pruneOldest(db: IDBDatabase, keepId?: string) {
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  const all = (await idbReq(store.getAll())) as SavedProjectRecord[];
  if (all.length <= MAX_PROJECTS) return;
  const sorted = [...all].sort((a, b) => a.updatedAt - b.updatedAt);
  const excess = sorted.length - MAX_PROJECTS;
  for (let i = 0; i < excess; i++) {
    const p = sorted[i];
    if (p.id === keepId) continue;
    await idbReq(store.delete(p.id));
  }
}

export async function saveVideoEditorProject(
  record: Omit<SavedProjectRecord, "sizeBytes" | "updatedAt"> & {
    updatedAt?: number;
  },
): Promise<void> {
  const assetsSize = record.assets.reduce((s, a) => s + a.blob.size, 0);
  const sizeBytes = record.mainVideo.size + assetsSize;
  const full: SavedProjectRecord = {
    ...record,
    updatedAt: record.updatedAt ?? Date.now(),
    sizeBytes,
  };

  const db = await openDb();
  try {
    const tx = db.transaction(STORE, "readwrite");
    await idbReq(tx.objectStore(STORE).put(full));
    await pruneOldest(db, full.id);
  } finally {
    db.close();
  }
}

export function newProjectId() {
  return `ve_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function formatProjectDate(ts: number) {
  try {
    return new Intl.DateTimeFormat("ar", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleString();
  }
}

export function formatBytes(n: number) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} ك.ب`;
  return `${(n / (1024 * 1024)).toFixed(1)} م.ب`;
}

/** لقطة مصغّرة من عنصر فيديو */
export async function captureVideoThumbnail(
  video: HTMLVideoElement | null,
): Promise<string | null> {
  if (!video || !video.videoWidth) return null;
  try {
    const canvas = document.createElement("canvas");
    const maxW = 160;
    const scale = maxW / video.videoWidth;
    canvas.width = maxW;
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.72);
  } catch {
    return null;
  }
}
