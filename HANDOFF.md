# Handoff: Qlick (QR-Code SaaS)

This file explains the current state of the project and how to continue work.
Read it before starting a task. Update the "Last state" and "Open items" sections at the end of every session.

---

## 1. The product

**Qlick** (working name, earlier "Scanwerk"; change in one place: `src/lib/site.ts`) is a QR-code SaaS for small businesses in the DACH region (restaurants, cafés, shops, events).

- The UI is **German**. The public site (header, home, `/preise`, footer) is also available in **English**.
- **Static codes** are free and unlimited. They work without an account, stored in the browser.
- **Dynamic codes** use a short link (`/r/[slug]`): the content can be changed later and scans are counted.
- **Hosted mobile pages**: menu, link page, vCard, Google review, coupon, PDF, event (with sign-up), mini website, poll, forms.
- **Print & video**: posters A6 to A0 (PDF), stickers with a cut line (SVG/PNG/JPG/PDF), animation as MP4 (WebCodecs + mp4-muxer).

## 2. Talking to the owner

- The owner writes **Arabic (Levantine dialect)**. Reply in the same dialect, short and direct. Technical terms may stay in English.
- The owner cares about strong, professional design. Earlier feedback:
  - **No overload.** Simple, clean, strong.
  - **No all-caps and no letter spacing** in the app UI.
  - **No green in the app.** The brand colour is **lime** (`#bdfb04` / CTA `#c8ff2e`) with black/white, in light and dark mode.
  - Pricing page: stays in the site theme. Pro = black card with a lime halo, Business = **pomegranate red** (`#c8102e` / `#e2294f`). The 150+ quote also uses red. Gold and navy were tried and **rejected**.
  - Fonts: professional ones only (Inter, Plus Jakarta Sans, Poppins, Fraunces, Playfair, Cormorant, DM Serif Display). No handwriting and no Bebas.
- Before showing a visual change, render it yourself (Playwright screenshot, see §6) and check it.

## 3. Stack & infrastructure

- **Next.js 16** (App Router, Turbopack), React 19, Tailwind 4 (tokens in `src/app/globals.css` → `@theme`), motion/react, lucide-react.
  - ⚠️ `AGENTS.md`: Next 16 differs from your training data. Read `node_modules/next/dist/docs/` before using a Next API.
- **Supabase** (Postgres + Auth + Storage), project ref `qcpjgmdzlhauydkangqh`.
  - Migrations live in `supabase/migrations/`. Apply new ones to the live project with the Supabase MCP (`apply_migration`).
  - Writes go through security-definer RPCs and RLS.
- **Vercel**: project `qr`, team `alkelani-workspace`.
  - Production alias: `qr-woad-three.vercel.app`.
  - **Every push to `main` deploys production.**
- **Resend** for email (RSVP confirmation). See `src/lib/email.ts`, env vars `RESEND_API_KEY` and `MAIL_FROM`.

### Env vars (Vercel)
- **Present:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`, `VISITOR_SALT`.
- **Missing (owner has to add):**
  - `SUPABASE_SECRET_KEY`: needed for polls, RSVP and the scan RPCs. Without it those features fail in production.
  - `RESEND_API_KEY`, `MAIL_FROM` (e.g. `Qlick <events@DOMAIN>`).
  - `ANTHROPIC_API_KEY`: optional, for the AI menu import.
- **Never** print, commit or ask for secrets in chat.

## 4. Git workflow

- Working branch: `design-polish-studios-auth`. After each finished piece of work, push to **both**:
  `git push origin HEAD:design-polish-studios-auth HEAD:main`
- Before committing, run `npm run verify` (typecheck, lint, QR decode test, SQL test with PGlite, import test) and `npx next build`.
- Delete temporary test images (e.g. `public/_shot/`) before committing.
- Never put model names into commits or code.

## 5. Code map (the most important files)

| Area | Files |
|---|---|
| Code types, fields, schemas, defaults | `src/lib/codes/types.ts` |
| Studio (4 steps: Type → Content → Design → Print) | `src/components/studio/wizard.tsx`, `content-form.tsx`, `design-panel.tsx` (QR design), `design-editor.tsx` (page colours/font), `preview.tsx`, `step-dock.tsx` (floating back/next + mobile preview sheet) |
| Date/time picker | `src/components/ui/date-time-field.tsx` (used for `datetime`/`date` fields) |
| App frame with sidebar | `src/components/shell/app-shell.tsx`, `studio-nav.tsx`, `src/lib/shell-data.ts` (calls `connection()`, rendered per request) |
| Hosted pages | `src/components/pages/hosted-pages.tsx` (shell + all types), `menu-page.tsx` (menu engine), `smart-img.tsx`, `rsvp-card.tsx` |
| Page design system | `src/lib/page-design.ts` (FONTS, PRESETS, `resolveDesign`, `designVars`); CSS `.pg …` in `globals.css` |
| 20 menu templates | `src/lib/menu-templates.ts` (header/nav/heading/items/texture + design; retired IDs are mapped in `RETIRED`), picker `src/components/studio/menu-template-picker.tsx` |
| Menu import | `src/lib/menu-import.ts`, `menu-dom.ts`, `menu-capture.ts` (bookmarklet), `src/app/import/` |
| Images | `src/app/api/img/route.ts` (sharp WebP proxy), `src/lib/image-url.ts`, `src/lib/safe-fetch.ts` (SSRF-safe) |
| Print/sticker/video | `src/components/print/*`, `src/lib/print/*`, `src/lib/video/mp4.ts` |
| Plans & limits | `src/lib/plans.ts`: Free 1, Start 15, Pro 50, Business 150 dynamic codes, 150+ on request. **Keep in sync with** `plan_dynamic_limit()` in `supabase/migrations/20261116100000_plan_limits_v2.sql` |
| Pricing | `src/app/preise/page.tsx`, `src/components/marketing/pricing-plans.tsx` (cards + ruler calculator); also used on the home page |
| Public site | `src/app/page.tsx`, `src/components/marketing/*` (header, footer, hero …) |
| i18n | `src/lib/i18n.ts` (`pick`), `src/lib/i18n-server.ts` (`getT()` for server components), `src/components/i18n/lang-provider.tsx` (`useT()`, `LangSwitch`). Texts are pairs: `T("Deutsch", "English")`. Cookie `qlick.lang`. |
| Events/RSVP | `src/app/api/rsvp/*`, `supabase/migrations/20261115160000_event_rsvp.sql`, `src/components/dashboard/rsvp-list.tsx` |
| Polls | `supabase/migrations/20261115150000_polls.sql`, `src/components/dashboard/poll-results.tsx` |
| Tests | `scripts/verify-qr.mts`, `verify-sql.mts`, `verify-import.mts` |

## 6. Testing & pitfalls

- **Dev server:** `npx next dev -p 3000`.
  - If new CSS rules don't show up, Turbopack has a stale cache: `pkill -f "next dev"; rm -rf .next`, then restart.
- **Screenshots:** Playwright is preinstalled (`require('playwright')`, `chromium.launch()`).
  - Theme: `localStorage.setItem('scanwerk.theme','dark'|'light')` via `addInitScript`.
  - Language: cookie `qlick.lang=en`.
  - Menu previews without a database: `/v#…` URLs via `encodePage` from `src/lib/codes/page-link.ts`.
- **Network:** the cloud session only reaches hosts that are allowed (package registries, Pinterest). Other sites (Unsplash, the owner's sites) are blocked here.
- The React-Compiler ESLint rules are strict (e.g. no assignments to `document.*` inside a component; move them into a helper function).
- `verify-qr` imports `sticker-studio` → `content-form`. Anything that pulls in page CSS must be loaded lazily (`next/dynamic`), see `menu-template-picker.tsx`.

## 7. Last state (2026-11-16)

Done and live on `main` (last commit: "Studio: floating step dock, preview sheet on phones, custom date picker; drop page presets"):

- 20 clean menu templates (shop cards like a delivery app, editorial, noir, Swiss …) and professional fonts.
- Sidebar in the app frame on all app pages (studio, codes, dashboard). Not on the pricing page or other marketing pages.
- Pricing page `/preise`:
  - lime/black theme, Pro spotlight card, Business in red;
  - ruler calculator (1 to 150+), 150+ leads to "Angebot anfragen" by mail;
  - comparison table and FAQ.
- New limits 1/15/50/150. The migration is applied to the live database.
- English for the public site. Header navigation sits next to the logo. Larger footer.
- Subtle motion: `.rise`, `.shimmer-text`, `.nav-link`, `.card-light`, `.pr-sheen`.
- Studio:
  - floating step dock (back/progress/next), mobile preview as a bottom sheet;
  - custom date/time picker;
  - the duplicated page preset grid was removed (fine-tuning lives under "Farben & Schrift").
- Event registration with double opt-in by email and a public count (names are never shown).

## 8. Open items / ideas

1. **Keys (owner):** `SUPABASE_SECRET_KEY` on Vercel, then redeploy.
   - The owner wants a **new sending domain for Qlick on Resend** but has not named it yet.
   - Once it is named: create the domain in Resend (MCP), pass on the DNS records, create a sending-only API key after verification, then set `RESEND_API_KEY` and `MAIL_FROM` on Vercel.
2. **Translate the studio and dashboard to English.** Only the public site is translated so far.
3. **Guests (no account)** can still create unlimited dynamic codes server-side (the limit only applies to accounts). Close that if the owner wants it.
4. **More QR design options** (design panel), requested earlier.
5. **Test the menu import on real sites** (needs a link from the owner, e.g. Kepizza).
6. Ideas I proposed (the owner has not decided yet):
   - ordering at the table via WhatsApp;
   - multilingual menus;
   - daily dish / happy hour by time;
   - one code per table with statistics;
   - review prompt after visiting the menu;
   - printable table displays in the template style.
