import type { QrStyle } from "./style";

export interface ScanCheck {
  score: number;
  level: "excellent" | "good" | "risky" | "bad";
  issues: { severity: "warn" | "error"; message: string }[];
}

function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.trim().replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Heuristic check that runs on every change in the studio. The studio also
 * decodes the rendered image with a real QR reader (see decode.ts); this
 * function explains *why* a design might fail.
 */
export function checkScannability(style: QrStyle): ScanCheck {
  const issues: ScanCheck["issues"] = [];
  let score = 100;
  const bg = style.transparent ? "#ffffff" : style.background;
  const fgColors = style.fill.type === "solid" ? [style.fill.color] : [...style.fill.colors];
  if (style.eyeColor) fgColors.push(style.eyeColor);

  const worst = Math.min(...fgColors.map((c) => contrastRatio(c, bg)));
  if (worst < 2.5) {
    score -= 55;
    issues.push({ severity: "error", message: `Kontrast zu niedrig (${worst.toFixed(1)}:1). Mindestens 4:1 empfohlen.` });
  } else if (worst < 4) {
    score -= 20;
    issues.push({ severity: "warn", message: `Kontrast knapp (${worst.toFixed(1)}:1). Dunklere Farbe oder hellerer Hintergrund hilft.` });
  }

  if (fgColors.some((c) => luminance(c) > luminance(bg))) {
    score -= 15;
    issues.push({ severity: "warn", message: "Helle Punkte auf dunklem Grund: Manche ältere Scanner lesen invertierte Codes nicht." });
  }

  if (style.transparent) {
    score -= 5;
    issues.push({ severity: "warn", message: "Transparenter Hintergrund: Nur auf hellem, ruhigem Untergrund drucken." });
  }

  if (style.margin < 2) {
    score -= 15;
    issues.push({ severity: "warn", message: "Ruhezone sehr schmal. Mindestens 2 Module Rand lassen." });
  }

  if (style.logo) {
    if (style.logo.size > 0.26) {
      score -= 12;
      issues.push({ severity: "warn", message: "Logo ist groß. Unter 25 % Breite ist es sicherer." });
    }
  } else if (style.ecc === "L") {
    score -= 5;
    issues.push({ severity: "warn", message: "Niedrige Fehlerkorrektur: Kratzer oder Knicke im Druck verkraftet der Code schlecht." });
  }

  if (style.dots === "dots" || style.dots === "diamond") score -= 4;

  score = Math.max(0, Math.min(100, score));
  const level = score >= 90 ? "excellent" : score >= 75 ? "good" : score >= 50 ? "risky" : "bad";
  return { score, level, issues };
}
