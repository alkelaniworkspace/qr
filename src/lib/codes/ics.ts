const s = (v: unknown) => String(v ?? "").trim();
const esc = (v: string) => v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\;");

/** "2026-12-24T18:30" (local, from <input type=datetime-local>) -> floating ICS time */
function icsTime(local: string): string {
  return local.replace(/[-:]/g, "").slice(0, 13).padEnd(13, "0") + "00";
}

export function buildIcs(c: Record<string, unknown>, uid: string): string {
  const start = s(c.start);
  const end = s(c.end) || start;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Scanwerk//DE",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${icsTime(start)}`,
    `DTEND:${icsTime(end)}`,
    `SUMMARY:${esc(s(c.title))}`,
    s(c.location) ? `LOCATION:${esc(s(c.location))}` : "",
    s(c.description) ? `DESCRIPTION:${esc(s(c.description))}` : "",
    s(c.url) ? `URL:${s(c.url)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}
