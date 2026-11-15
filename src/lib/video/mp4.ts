"use client";

/**
 * Renders an animation to a real MP4 (H.264) file, frame by frame, with
 * WebCodecs + mp4-muxer. Unlike screen recording this is deterministic,
 * faster than real time, never drops frames, and plays everywhere
 * (Instagram, WhatsApp, PowerPoint, iPhone). Falls back to MediaRecorder
 * (WebM) only in browsers without WebCodecs.
 */

export interface RenderOptions {
  width: number;
  height: number;
  fps: number;
  seconds: number;
  /** draw frame at time t (seconds) */
  draw: (ctx: CanvasRenderingContext2D, t: number) => void;
  onProgress?: (p: number) => void;
}

export function canEncodeMp4(): boolean {
  return typeof window !== "undefined" && "VideoEncoder" in window && "VideoFrame" in window;
}

async function pickCodec(width: number, height: number, fps: number): Promise<string | null> {
  // High profile level 5.1/4.2/4.0, then Main/Baseline: first one the browser accepts.
  for (const codec of ["avc1.640033", "avc1.64002A", "avc1.640028", "avc1.4D4028", "avc1.42E01F"]) {
    try {
      const s = await VideoEncoder.isConfigSupported({ codec, width, height, bitrate: 8_000_000, framerate: fps });
      if (s.supported) return codec;
    } catch {
      /* try next */
    }
  }
  return null;
}

export async function renderMp4(o: RenderOptions): Promise<Blob> {
  const W = o.width - (o.width % 2);
  const H = o.height - (o.height % 2);
  const codec = canEncodeMp4() ? await pickCodec(W, H, o.fps) : null;
  if (!codec) return renderWebmFallback({ ...o, width: W, height: H });

  const { Muxer, ArrayBufferTarget } = await import("mp4-muxer");
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({ target, video: { codec: "avc", width: W, height: H, frameRate: o.fps }, fastStart: "in-memory" });
  let failure: unknown = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => { failure = e; },
  });
  encoder.configure({ codec, width: W, height: H, bitrate: Math.min(16_000_000, Math.round(W * H * o.fps * 0.12)), framerate: o.fps, latencyMode: "quality" });

  const canvas = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(W, H) : Object.assign(document.createElement("canvas"), { width: W, height: H });
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const frames = Math.round(o.seconds * o.fps);
  for (let i = 0; i < frames; i++) {
    if (failure) throw failure;
    o.draw(ctx, i / o.fps);
    const frame = new VideoFrame(canvas as CanvasImageSource, { timestamp: Math.round((i * 1e6) / o.fps), duration: Math.round(1e6 / o.fps) });
    encoder.encode(frame, { keyFrame: i % (o.fps * 2) === 0 });
    frame.close();
    // keep the encoder queue short and the page responsive
    if (encoder.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 0));
    if (i % 6 === 0) {
      o.onProgress?.(i / frames);
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  await encoder.flush();
  encoder.close();
  if (failure) throw failure;
  muxer.finalize();
  o.onProgress?.(1);
  return new Blob([target.buffer], { type: "video/mp4" });
}

/** Real-time recording for browsers without WebCodecs (older Firefox). */
async function renderWebmFallback(o: RenderOptions): Promise<Blob> {
  const canvas = Object.assign(document.createElement("canvas"), { width: o.width, height: o.height });
  const ctx = canvas.getContext("2d")!;
  const mime = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find((m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m));
  if (!mime) throw new Error("Dieser Browser kann keine Videos erzeugen. Bitte Chrome, Edge oder Safari nutzen.");
  const stream = canvas.captureStream(o.fps);
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 10_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const done = new Promise<void>((r) => (rec.onstop = () => r()));
  rec.start();
  const t0 = performance.now();
  await new Promise<void>((resolve) => {
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      o.draw(ctx, Math.min(t, o.seconds));
      o.onProgress?.(Math.min(1, t / o.seconds));
      if (t >= o.seconds) resolve();
      else requestAnimationFrame(tick);
    };
    tick();
  });
  rec.stop();
  stream.getTracks().forEach((tr) => tr.stop());
  await done;
  return new Blob(chunks, { type: mime.split(";")[0] });
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
