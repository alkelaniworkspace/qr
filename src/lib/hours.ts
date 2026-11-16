/**
 * Reads free-text opening hours ("Mo–Fr 11–22 Uhr", "Sa, So 12:00 - 23:30",
 * "täglich 11–22", "Di Ruhetag") into per-weekday time ranges, so pages can
 * show "Geöffnet · bis 22:00" and mark today's line. Lines it cannot read are
 * simply ignored; the owner's own text is always what gets displayed.
 */

// index = Date.getDay() (0 = Sunday)
const DAYS = ["so", "mo", "di", "mi", "do", "fr", "sa"] as const;
const DAY_RE = "(so|mo|di|mi|do|fr|sa)[a-zäöü]*\\.?";

export type Range = [number, number]; // minutes since midnight, close may exceed 1440
export type Week = Range[][];

function daysOf(head: string): number[] {
  const h = head.toLowerCase();
  if (/täglich|jeden tag/.test(h)) return [0, 1, 2, 3, 4, 5, 6];
  const out = new Set<number>();
  const parts = h.split(/[,&+]|\bund\b/);
  for (const p of parts) {
    const range = p.match(new RegExp(`${DAY_RE}\\s*(?:-|–|—|bis)\\s*${DAY_RE}`));
    if (range) {
      let a = DAYS.indexOf(range[1] as (typeof DAYS)[number]);
      const b = DAYS.indexOf(range[2] as (typeof DAYS)[number]);
      for (let k = 0; k < 7; k++) {
        out.add(a);
        if (a === b) break;
        a = (a + 1) % 7;
      }
      continue;
    }
    for (const m of p.matchAll(new RegExp(DAY_RE, "g"))) out.add(DAYS.indexOf(m[1] as (typeof DAYS)[number]));
  }
  return [...out];
}

function toMin(t: string): number {
  const [h, m = "0"] = t.split(/[:.]/);
  return Number(h) * 60 + Number(m);
}

export function parseHours(text: string): Week {
  const week: Week = [[], [], [], [], [], [], []];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const firstTime = line.search(/\d{1,2}([:.]\d{2})?\s*(?:-|–|—|bis)\s*\d{1,2}/);
    const head = firstTime >= 0 ? line.slice(0, firstTime) : line;
    const days = daysOf(head);
    if (!days.length) continue;
    const ranges: Range[] = [];
    for (const m of line.slice(Math.max(0, firstTime)).matchAll(/(\d{1,2}(?:[:.]\d{2})?)\s*(?:uhr\s*)?(?:-|–|—|bis)\s*(\d{1,2}(?:[:.]\d{2})?)/gi)) {
      const a = toMin(m[1]);
      let b = toMin(m[2]);
      if (b <= a) b += 1440; // past midnight
      if (a < 1440) ranges.push([a, b]);
    }
    for (const d of days) week[d] = firstTime >= 0 ? [...week[d], ...ranges] : []; // "Ruhetag" lines close the day
  }
  return week;
}

export function hasHours(week: Week) {
  return week.some((d) => d.length > 0);
}

const fmt = (m: number) => `${String(Math.floor((m % 1440) / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export interface OpenState {
  open: boolean;
  label: string;
}

/** "Geöffnet · bis 22:00" / "Geschlossen · öffnet 11:00" / "Geschlossen · öffnet Mo 11:00". */
export function openState(week: Week, now = new Date()): OpenState | null {
  if (!hasHours(week)) return null;
  const day = now.getDay();
  const min = now.getHours() * 60 + now.getMinutes();
  // yesterday's ranges that run past midnight
  for (const [, b] of week[(day + 6) % 7]) if (b > 1440 && min < b - 1440) return { open: true, label: `Geöffnet · bis ${fmt(b)}` };
  for (const [a, b] of week[day]) if (min >= a && min < b) return { open: true, label: `Geöffnet · bis ${fmt(b)}` };
  const later = week[day].filter(([a]) => a > min).sort((x, y) => x[0] - y[0])[0];
  if (later) return { open: false, label: `Geschlossen · öffnet ${fmt(later[0])}` };
  for (let k = 1; k <= 7; k++) {
    const d = (day + k) % 7;
    const first = [...week[d]].sort((x, y) => x[0] - y[0])[0];
    if (first) return { open: false, label: `Geschlossen · öffnet ${k === 1 ? "morgen" : ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d]} ${fmt(first[0])}` };
  }
  return null;
}

/** Index of the text line that covers today (for highlighting), or -1. */
export function todayLine(text: string, now = new Date()): number {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const day = now.getDay();
  return lines.findLastIndex((l) => {
    const t = l.search(/\d/);
    return daysOf(t >= 0 ? l.slice(0, t) : l).includes(day);
  });
}
