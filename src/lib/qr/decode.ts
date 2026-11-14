/**
 * Phone cameras usually see a printed code at roughly 3–6 pixels per module.
 * Decoding at those resolutions mirrors real scanning far better than a
 * high-resolution render, where stylised dots look like separate shapes.
 */
export const DECODE_PX_PER_MODULE = [4, 6, 3] as const;

/** Browser only: rasterise an SVG and try to read it back with jsQR. */
export async function decodeSvgInBrowser(svg: string, expected: string): Promise<boolean> {
  const { default: jsQR } = await import("jsqr");
  const units = Number(svg.match(/viewBox="0 0 ([\d.]+)/)?.[1] ?? 40);
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    for (const ppm of DECODE_PX_PER_MODULE) {
      const w = Math.round(units * ppm);
      const h = Math.round((w * img.naturalHeight) / img.naturalWidth);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return false;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);
      if (jsQR(data, w, h)?.data === expected) return true;
    }
    return false;
  } finally {
    URL.revokeObjectURL(url);
  }
}
