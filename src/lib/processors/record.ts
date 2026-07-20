import { downloadBlob } from "./ffmpeg-client";

export async function recordScreen(seconds = 15): Promise<void> {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true,
  });
  await recordStream(stream, seconds, "screen-recording.webm");
}

export async function recordVoice(seconds = 15): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  await recordStream(stream, seconds, "voice-recording.webm");
}

export async function recordCamera(seconds = 15): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  await recordStream(stream, seconds, "camera-recording.webm");
}

async function recordStream(stream: MediaStream, seconds: number, name: string) {
  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  recorder.start();
  await new Promise((r) => setTimeout(r, Math.max(3, seconds) * 1000));
  if (recorder.state !== "inactive") recorder.stop();
  stream.getTracks().forEach((t) => t.stop());
  await stopped;

  await downloadBlob(new Blob(chunks, { type: "video/webm" }), name);
}
