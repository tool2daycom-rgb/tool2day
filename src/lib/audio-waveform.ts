/** Build normalized peak bars (0–1) for timeline waveform display. */
export async function analyzeWaveform(
  source: File | Blob | ArrayBuffer,
  bars = 160,
): Promise<number[]> {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const raw =
      source instanceof ArrayBuffer
        ? source.slice(0)
        : await source.arrayBuffer();
    const audio = await ctx.decodeAudioData(raw);
    const channel = audio.getChannelData(0);
    const block = Math.max(1, Math.floor(channel.length / bars));
    const peaks: number[] = [];
    for (let i = 0; i < bars; i++) {
      let peak = 0;
      const start = i * block;
      const end = Math.min(channel.length, start + block);
      for (let j = start; j < end; j++) {
        const v = Math.abs(channel[j] ?? 0);
        if (v > peak) peak = v;
      }
      peaks.push(peak);
    }
    await ctx.close();
    const max = Math.max(...peaks, 0.0001);
    return peaks.map((p) => Math.min(1, p / max));
  } catch {
    return syntheticPeaks(bars);
  }
}

function syntheticPeaks(bars: number): number[] {
  return Array.from({ length: bars }, (_, i) => {
    const a = 0.25 + 0.55 * Math.abs(Math.sin(i * 0.37));
    const b = 0.15 * Math.abs(Math.sin(i * 1.1));
    return Math.min(1, a + b);
  });
}
