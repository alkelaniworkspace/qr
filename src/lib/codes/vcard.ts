type VCardInput = Record<string, unknown>;
const s = (v: unknown) => String(v ?? "").trim();
const esc = (v: string) => v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\;");

/** vCard 3.0, understood by iOS, Android and Outlook. */
export function buildVCard(c: VCardInput): string {
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  lines.push(`N:${esc(s(c.lastName))};${esc(s(c.firstName))};;;`);
  lines.push(`FN:${esc([s(c.firstName), s(c.lastName)].filter(Boolean).join(" ") || s(c.company))}`);
  if (s(c.company)) lines.push(`ORG:${esc(s(c.company))}`);
  if (s(c.title)) lines.push(`TITLE:${esc(s(c.title))}`);
  if (s(c.phone)) lines.push(`TEL;TYPE=WORK,VOICE:${s(c.phone)}`);
  if (s(c.mobile)) lines.push(`TEL;TYPE=CELL:${s(c.mobile)}`);
  if (s(c.email)) lines.push(`EMAIL;TYPE=INTERNET:${s(c.email)}`);
  if (s(c.website)) lines.push(`URL:${s(c.website)}`);
  if (s(c.street) || s(c.city)) lines.push(`ADR;TYPE=WORK:;;${esc(s(c.street))};${esc(s(c.city))};;;`);
  if (s(c.note)) lines.push(`NOTE:${esc(s(c.note))}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}
