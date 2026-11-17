import "server-only";
import { env } from "@/lib/env";
import { site } from "@/lib/site";
import { escapeHtml } from "@/lib/email";

/** One look for every e-mail Qlick sends: logo, white card, lime accent, footer. */
export const FONT = "Inter,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function mailLayout({ preheader, title, intro, cta, link, after, code, block, accent = "#c8ff2e" }: {
  preheader: string; title: string; intro: string; cta?: string; link?: string; after: string; code?: string;
  /** Extra HTML between the text and the button (e.g. a gift card). */
  block?: string;
  accent?: string;
}): string {
  const button = cta && link ? `
    <tr><td style="padding:28px 0 8px">
      <a href="${link}" style="display:inline-block;background:#c8ff2e;color:#111111;font:700 16px/1 ${FONT};text-decoration:none;padding:17px 30px;border-radius:999px">${escapeHtml(cta)}</a>
    </td></tr>` : "";
  const otp = code ? `
    <tr><td style="padding:26px 0 6px">
      <div style="display:inline-block;background:#f4f4f0;border-radius:16px;padding:16px 26px;font:800 32px/1 ${FONT};letter-spacing:6px;color:#111111">${escapeHtml(code)}</div>
    </td></tr>` : "";
  const fallback = link ? `
    <tr><td style="padding:22px 0 0;font:400 13px/1.55 ${FONT};color:#8a8a85">
      Der Button funktioniert nicht? Kopiere diesen Link in deinen Browser:<br>
      <a href="${link}" style="color:#111111;word-break:break-all">${escapeHtml(link)}</a>
    </td></tr>` : "";
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f0">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0"><tr><td align="center" style="padding:40px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
    <tr><td style="padding:0 8px 22px">
      <a href="${env.appUrl}" style="text-decoration:none"><img src="${env.appUrl}/email/qlick-logo.png" width="92" height="32" alt="${site.name}" style="display:block;border:0"></a>
    </td></tr>
    <tr><td style="background:#ffffff;border-radius:24px;padding:40px 36px;border:1px solid #e8e8e2">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td><div style="width:44px;height:6px;border-radius:6px;background:${accent}"></div></td></tr>
        <tr><td style="padding:22px 0 0;font:800 28px/1.15 ${FONT};color:#111111;letter-spacing:-0.5px">${escapeHtml(title)}</td></tr>
        <tr><td style="padding:14px 0 0;font:400 16px/1.6 ${FONT};color:#3d3d3a">${intro}</td></tr>
        ${block ? `<tr><td style="padding:24px 0 0">${block}</td></tr>` : ""}
        ${button}${otp}
        <tr><td style="padding:22px 0 0;font:400 14px/1.6 ${FONT};color:#6b6b66">${after}</td></tr>
        ${fallback}
      </table>
    </td></tr>
    <tr><td style="padding:24px 8px 0;font:400 12px/1.6 ${FONT};color:#8a8a85">
      ${site.name} · QR-Codes für dein Business · <a href="${env.appUrl}" style="color:#8a8a85">${site.domain}</a><br>
      Fragen? Schreib uns an <a href="mailto:${site.email}" style="color:#8a8a85">${site.email}</a> · <a href="${env.appUrl}/datenschutz" style="color:#8a8a85">Datenschutz</a>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

