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
- **Present:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL` (= `https://www.qlickqr.com`), `VISITOR_SALT`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY` (sending-only, domain qlickqr.com), `MAIL_FROM` (`Qlick <info@qlickqr.com>`).
- **Missing:** `ANTHROPIC_API_KEY` (optional, AI menu import).

### Domain & mail
- Domain **qlickqr.com** (DNS at Hostinger; apex redirects to `www`). Mailbox `info@qlickqr.com` (Hostinger) = contact + admin e-mail.
- Resend domain `qlickqr.com` (id `4b5eaf77-2ec7-421e-9fc4-e705b50a441b`); DNS records set at Hostinger, verification was pending.
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
| Hosted pages | `src/components/pages/hosted-pages.tsx` (shell + switch), `pages-v2.tsx` (site, links, vCard, review, coupon, event, PDF in the Showcase style), `menu-showcase.tsx` + `menu-showcase.css` (Showcase menu and all shared `sc-`/`pv-` styles), `menu-page.tsx` (classic menu engine), `poll-page.tsx`, `smart-img.tsx`, `rsvp-card.tsx` |
| Opening hours | `src/lib/hours.ts` parses free text ("Mo–Fr 11–22 Uhr") for the live "Geöffnet · bis 22:00" state and today's line |
| Page looks | `PAGE_LOOKS` in `src/lib/page-design.ts` (14 looks), picker `src/components/studio/page-look-picker.tsx` (live previews, all types except menu). Heroes: card, full, cover (= card), centered, minimal |
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

## 7. Last state (2026-11-17)

Done and pushed (commits "Menu: Showcase templates …" and "Hosted pages: new Showcase-style designs …"):

- The owner rejected the old menu designs as too plain and approved a delivery-app style preview ("Rocco's"). It is now the **Showcase menu** (`menu-showcase.tsx`):
  - 10 templates at the top of the picker (Feuer = default, Glut, Granatapfel, Trattoria, Schwarz & Gold, Street, Meer, Kaffeehaus, Rosé, Lime Night); `engine: "showcase"`, `hero: "card" | "full"`.
  - Cover with parallax, profile card (logo, rating, live open state), delivery/pickup/online chips, actions (call, WhatsApp, route, reviews), auto promo slider, search, sticky category chips with icons from the title, "Beliebt" carousel, per-category layout (auto/list/grid/cards/compact, set in the menu builder), dish sheet (portal) with sizes and allergens, reviews with count-up, hours with "Heute", map card, socials, floating call bar, light/dark switch.
  - New menu fields: whatsapp, orderUrl, delivery, pickup, instagram/tiktok/facebook, promos[], rating, ratingCount, reviewUrl, reviews[]; section `layout`.
- All other hosted pages except the poll were rebuilt in the same language (`pages-v2.tsx`). New fields: site (whatsapp, gallery[], rating, reviews), review (`feedback` = e-mail/WhatsApp for direct feedback; the Google button always stays visible, no review gating).
- 14 "Looks" with live previews above "Farben & Schrift" for every non-menu type.
- Shell uses `overflow-x-clip` (not hidden) so sticky nav and the floating bar work.
- Studio round 2 (owner feedback: empty strip beside previews, old starter designs, step dock too weak):
  - `live-thumb.tsx` scales a live page to exactly the box width (used by both pickers and the starter gallery).
  - Pickers and starters show **demo content with photos** (`src/lib/samples.ts`, Unsplash hot-links, placeholder on failure). Picking a template/look only changes the design; starters copy texts **without photos and contact data** (`withoutPhotos` in `templates.ts`).
  - `STARTERS` rebuilt: 15 starters in 3 categories (Gastronomie, Geschäft & Kontakt, Aktionen & Events) with filter tabs (`starter-gallery.tsx`), all on the new templates/looks.
  - Editor: right column `live-pane.tsx` = sticky phone that fits the window height (uses CSS `zoom`, so scrolling inside is exact), toggle Handy-Seite / QR-Code (step 2 opens on the phone, step 3 on the code).
  - New step bar (`step-dock.tsx`): sticky at the bottom of the editor column, back, clickable steps 1–4, big next button; on phones "Vorschau" opens a sheet (portal to body).
  - Unsplash photo IDs in `samples.ts` were not all verified from the cloud session (Unsplash is blocked there). Check the studio once in production and swap any that do not load.
- Round 3: preview cards smaller again; hovering/touching a card glides slowly down through the whole page (`live-thumb.tsx`).
- Link page: 52 platforms with real brand icons and colours (`src/lib/platforms.ts`, paths in `brand-paths.ts` generated from simple-icons, CC0; LinkedIn/Lieferando/Wolt/Amazon/E-Mail/Telefon/Website drawn or lucide). Links now have `icon` (platform key or auto), `image` (own icon) and `highlight`. New editor `links-editor.tsx` (quick-add chips, icon menu with search + upload). Six link styles (`linkStyle`: cards, brand, tiles, glass, outline, spotlight) with live preview picker `link-style-picker.tsx`. `brandOf()` now uses the platform list everywhere.
- Test images for screenshots: put photos into `public/_shot/` and use `http://localhost:3000/_shot/x.jpg` in `/v#` payloads (the proxy 404s, the image then loads directly). Delete before committing.

### Session 2026-11-17 (late): accounts, admin, trash
- Migration `20261117200000_admin_trash.sql` + `20261117201000_admin_user.sql` (both applied live):
  - profiles: `role`, `plan_until`, `plan_source` (free/paid/gift), `plan_note`, `suspended_at/_reason`. `admin_emails` table (seeded `info@qlickqr.com`): signing up with that address makes the account admin.
  - `effective_plan()` (gift expires → free). Codes: `archived_at`, `deleted_at` (trash, purged after 30 days by pg_cron `purge-qr-trash`), `locked_at/_reason` (admin lock, owner cannot undo). Locked codes / suspended owners show the pause page; trashed codes 404.
  - Admin RPCs (all call `require_admin()`): `admin_overview`, `admin_users`, `admin_user`, `admin_codes`, `admin_audit_log`, `admin_set_plan`, `admin_suspend_user`, `admin_set_role`, `admin_code_action`. Every action is written to `admin_audit`.
- User side: `/dashboard/codes` has tabs Aktiv / Archiv / Papierkorb; delete = trash, restore, delete forever only from trash.
- Admin UI `/admin` (only visible to admins, sidebar "Verwaltung"): Übersicht (KPIs, 30-day bars), Nutzer (search/filter, detail page with gift plan + duration, suspend, role, user's codes), Codes (filters incl. trash/locked/guest, actions menu), Protokoll.
- The admin pages were not screenshot-checked (needs a logged-in admin). Check once in production after the owner signs up.
- Google sign-in works (Google Cloud project "My First Project", app published, External). Branding verification: first attempt failed (domain not verified, privacy page empty). Fixed: full `/datenschutz` (with "Anmeldung mit Google" + Limited Use), Search Console domain property verified via TXT at Hostinger (keep that record). Owner re-submits after 24 h ("I have fixed the issues").
- `site.owner` (name/street/city/phone) in `src/lib/site.ts` is still empty; Impressum is still a placeholder. Needs the owner's legal name and address.

## 8. Open items / ideas

1. **Owner setup:** in Google Cloud OAuth add origins `https://www.qlickqr.com`, `https://qlickqr.com`; in Supabase Auth set Site URL `https://www.qlickqr.com` + redirect `https://www.qlickqr.com/**`; sign up with `info@qlickqr.com` (becomes admin). Resend domain is verified; then move Supabase auth e-mails to custom SMTP (Resend) from info@qlickqr.com.
   - **Phase 3 payments (Stripe)** waits on: Gewerbe, Stripe account, tax decision (Kleinunternehmer or MwSt), final prices/trial, legal pages (AGB, Widerruf, Impressum, Datenschutz).
2. **Translate the studio and dashboard to English.** Only the public site is translated so far.
3. **Guests (no account)** can still create unlimited dynamic codes server-side (the limit only applies to accounts). Close that if the owner wants it.
4. **More QR design options** (design panel), requested earlier.
5. **Test the menu import on real sites** (needs a link from the owner, e.g. Kepizza).
6. **Poll page** still has the older look; bring it to the Showcase style.
7. Owner feedback on the new pages is pending (only the menu was approved explicitly).
8. Ideas I proposed (the owner has not decided yet):
   - ordering at the table via WhatsApp;
   - multilingual menus;
   - daily dish / happy hour by time;
   - one code per table with statistics;
   - review prompt after visiting the menu;
   - printable table displays in the template style.
