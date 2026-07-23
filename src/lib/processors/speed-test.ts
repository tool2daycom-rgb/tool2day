/** قياس سرعة حقيقي: عدة اتصالات متوازية + فترة قياس مستمرة */

const CHUNK = 65536;
/** حد جسم الطلب على Vercel تقريباً 4.5MB — نبقى تحته */
export const UPLOAD_CHUNK_BYTES = 2 * 1024 * 1024;
export const DOWNLOAD_STREAM_BYTES = 8 * 1024 * 1024;

export type SpeedSample = {
  pingMs: number;
  downloadMbps: number;
  uploadMbps: number;
};

/** تعبئة آمنة — getRandomValues بحد أقصى 65536 بايت لكل استدعاء */
export function fillRandomBytes(size: number): Uint8Array {
  const out = new Uint8Array(size);
  const block = new Uint8Array(CHUNK);
  for (let offset = 0; offset < size; offset += CHUNK) {
    crypto.getRandomValues(block);
    out.set(block.subarray(0, Math.min(CHUNK, size - offset)), offset);
  }
  return out;
}

function mbps(bytes: number, ms: number): number {
  if (ms <= 0) return 0;
  return (bytes * 8) / (ms / 1000) / 1_000_000;
}

export async function measurePing(rounds = 6): Promise<number> {
  const samples: number[] = [];
  // تسخين مرة واحدة (لا تُحسب)
  await fetch(`/api/speed-test?ping=1&warm=1`, { cache: "no-store" }).catch(
    () => undefined,
  );
  for (let i = 0; i < rounds; i++) {
    const t0 = performance.now();
    const res = await fetch(`/api/speed-test?ping=1&n=${i}&t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("فشل قياس الاستجابة");
    await res.arrayBuffer();
    samples.push(performance.now() - t0);
  }
  samples.sort((a, b) => a - b);
  // الوسيط أكثر استقراراً من المتوسط
  const mid = samples[Math.floor(samples.length / 2)] ?? samples[0] ?? 0;
  return Math.round(mid);
}

async function readDownloadStream(
  bytes: number,
  signal?: AbortSignal,
): Promise<number> {
  const res = await fetch(
    `/api/speed-test?bytes=${bytes}&t=${Date.now()}&r=${Math.random()}`,
    { cache: "no-store", signal },
  );
  if (!res.ok || !res.body) throw new Error("فشل قياس التنزيل");
  const reader = res.body.getReader();
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value?.byteLength ?? 0;
  }
  return received;
}

/**
 * تنزيل متوازٍ لعدة ثوانٍ — يشبه اختبارات السرعة الحقيقية.
 * يتجاهل الثانية الأولى (بطء البدء) ويحسب الذروة المستدامة.
 */
export async function measureDownload(opts: {
  durationMs?: number;
  parallel?: number;
  onProgress?: (mbpsLive: number) => void;
}): Promise<number> {
  const durationMs = opts.durationMs ?? 8000;
  const parallel = opts.parallel ?? 4;
  const controllers = Array.from(
    { length: parallel },
    () => new AbortController(),
  );

  let totalBytes = 0;
  let bytesAfterWarmup = 0;
  const start = performance.now();
  const warmUntil = start + 1000;
  const endAt = start + durationMs;
  let stopped = false;

  const tick = window.setInterval(() => {
    const now = performance.now();
    if (now <= warmUntil) return;
    const elapsed = now - warmUntil;
    if (elapsed > 200) {
      opts.onProgress?.(Number(mbps(bytesAfterWarmup, elapsed).toFixed(1)));
    }
  }, 200);

  async function worker(ctrl: AbortController) {
    while (!stopped && performance.now() < endAt) {
      try {
        const n = await readDownloadStream(DOWNLOAD_STREAM_BYTES, ctrl.signal);
        const now = performance.now();
        totalBytes += n;
        if (now >= warmUntil) bytesAfterWarmup += n;
      } catch {
        if (ctrl.signal.aborted || stopped) return;
        await new Promise((r) => setTimeout(r, 80));
      }
    }
  }

  try {
    await Promise.all(controllers.map((c) => worker(c)));
  } finally {
    stopped = true;
    controllers.forEach((c) => c.abort());
    clearInterval(tick);
  }

  const elapsed = Math.max(1, performance.now() - warmUntil);
  const used = bytesAfterWarmup > 0 ? bytesAfterWarmup : totalBytes;
  const elapsedAll =
    bytesAfterWarmup > 0 ? elapsed : Math.max(1, performance.now() - start);
  return Number(mbps(used, elapsedAll).toFixed(1));
}

export async function measureUpload(opts: {
  durationMs?: number;
  parallel?: number;
  onProgress?: (mbpsLive: number) => void;
}): Promise<number> {
  const durationMs = opts.durationMs ?? 6000;
  const parallel = opts.parallel ?? 3;
  const payload = fillRandomBytes(UPLOAD_CHUNK_BYTES);

  let totalBytes = 0;
  let bytesAfterWarmup = 0;
  const start = performance.now();
  const warmUntil = start + 800;
  const endAt = start + durationMs;
  let stopped = false;

  const tick = window.setInterval(() => {
    const now = performance.now();
    if (now <= warmUntil) return;
    const elapsed = now - warmUntil;
    if (elapsed > 200) {
      opts.onProgress?.(Number(mbps(bytesAfterWarmup, elapsed).toFixed(1)));
    }
  }, 200);

  async function worker() {
    while (!stopped && performance.now() < endAt) {
      try {
        const res = await fetch(`/api/speed-test?t=${Date.now()}`, {
          method: "POST",
          body: payload.buffer.slice(
            payload.byteOffset,
            payload.byteOffset + payload.byteLength,
          ) as ArrayBuffer,
          headers: { "Content-Type": "application/octet-stream" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("upload failed");
        await res.arrayBuffer();
        const now = performance.now();
        totalBytes += payload.byteLength;
        if (now >= warmUntil) bytesAfterWarmup += payload.byteLength;
      } catch {
        if (stopped) return;
        await new Promise((r) => setTimeout(r, 80));
      }
    }
  }

  try {
    await Promise.all(Array.from({ length: parallel }, () => worker()));
  } finally {
    stopped = true;
    clearInterval(tick);
  }

  const elapsed = Math.max(1, performance.now() - warmUntil);
  const used = bytesAfterWarmup > 0 ? bytesAfterWarmup : totalBytes;
  const elapsedAll =
    bytesAfterWarmup > 0 ? elapsed : Math.max(1, performance.now() - start);
  return Number(mbps(used, elapsedAll).toFixed(1));
}

export async function runFullSpeedTest(hooks: {
  onPhase?: (phase: string) => void;
  onPing?: (ms: number) => void;
  onDownload?: (mbps: number) => void;
  onUpload?: (mbps: number) => void;
}): Promise<SpeedSample> {
  hooks.onPhase?.("قياس الاستجابة…");
  const pingMs = await measurePing();
  hooks.onPing?.(pingMs);

  hooks.onPhase?.("قياس سرعة التنزيل…");
  const downloadMbps = await measureDownload({
    durationMs: 9000,
    parallel: 4,
    onProgress: hooks.onDownload,
  });
  hooks.onDownload?.(downloadMbps);

  hooks.onPhase?.("قياس سرعة الرفع…");
  const uploadMbps = await measureUpload({
    durationMs: 7000,
    parallel: 3,
    onProgress: hooks.onUpload,
  });
  hooks.onUpload?.(uploadMbps);

  hooks.onPhase?.("اكتمل الفحص");
  return { pingMs, downloadMbps, uploadMbps };
}
