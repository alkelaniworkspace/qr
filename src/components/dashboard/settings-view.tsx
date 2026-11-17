"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, Check, Download, KeyRound, Languages, Loader2, LogOut, Mail, Monitor, Moon, Palette, ShieldCheck, Sun, Trash2, User,
} from "lucide-react";
import { changeEmail, deleteAccount, savePrefs, sendPasswordLink, signOutEverywhere, updateName, type SettingsResult } from "@/app/dashboard/settings/actions";
import { AvatarEditor } from "@/components/dashboard/avatar-editor";
import { cn } from "@/lib/cn";

const SECTIONS = [
  { id: "profil", label: "Profil", icon: User },
  { id: "sicherheit", label: "Anmeldung & Sicherheit", icon: ShieldCheck },
  { id: "benachrichtigungen", label: "Benachrichtigungen", icon: Bell },
  { id: "darstellung", label: "Darstellung", icon: Palette },
  { id: "daten", label: "Daten & Datenschutz", icon: Download },
  { id: "konto", label: "Konto löschen", icon: Trash2 },
];

const dateFmt = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/* ── small building blocks ── */
function Section({ id, title, desc, children, danger }: { id: string; title: string; desc?: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <section id={id} className={cn("scroll-mt-24 rounded-[24px] border bg-surface p-6 sm:p-7", danger ? "border-rose/30" : "border-edge")}>
      <h2 className={cn("text-lg font-bold", danger && "text-rose")}>{title}</h2>
      {desc && <p className="mt-1 text-sm text-dim">{desc}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 border-t border-edge py-5 first:border-0 first:pt-0 last:pb-0 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-8">
      <div><p className="text-sm font-semibold">{label}</p>{hint && <p className="mt-0.5 text-[12.5px] text-faint">{hint}</p>}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Note({ r }: { r: SettingsResult | null }) {
  if (!r || (!r.ok && !r.error)) return null;
  return <p className={cn("mt-2.5 text-[13px] font-medium animate-rise", r.error ? "text-rose" : "text-fg")}>{r.error ?? <span className="inline-flex items-center gap-1.5"><Check className="size-3.5" /> {r.ok}</span>}</p>;
}

function Toggle({ on, onChange, label, hint, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; hint: string; disabled?: boolean }) {
  return (
    <label className={cn("flex cursor-pointer items-start justify-between gap-6 border-t border-edge py-4 first:border-0 first:pt-0", disabled && "opacity-50")}>
      <span><span className="block text-sm font-semibold">{label}</span><span className="mt-0.5 block text-[12.5px] text-dim">{hint}</span></span>
      <span className={cn("relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition", on ? "bg-lime" : "bg-hi/20")}>
        <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
      </span>
      <input type="checkbox" className="sr-only" checked={on} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

const input = "h-11 w-full rounded-xl border border-edge bg-bg px-3.5 text-sm outline-none placeholder:text-faint focus:border-brand/60";
const btn = "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition disabled:opacity-40";

/* ── theme + language, stored in the browser ── */
type Theme = "light" | "dark" | "system";
const themeListeners = new Set<() => void>();
function readTheme(): Theme {
  try { const t = localStorage.getItem("scanwerk.theme"); return t === "light" || t === "dark" ? t : "system"; } catch { return "system"; }
}
function applyTheme(t: Theme) {
  try {
    if (t === "system") localStorage.removeItem("scanwerk.theme"); else localStorage.setItem("scanwerk.theme", t);
  } catch { /* not remembered */ }
  const resolved = t === "system" ? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : t;
  document.documentElement.dataset.theme = resolved;
  themeListeners.forEach((l) => l());
}
function saveLangCookie(l: "de" | "en") {
  document.cookie = `qlick.lang=${l}; path=/; max-age=31536000; samesite=lax`;
}

export function SettingsView(p: {
  userId: string;
  name: string; email: string; pendingEmail: string | null; createdAt: string; lastSignIn: string | null; providers: string[]; avatar: string | null;
  notifyProduct: boolean; notifyReports: boolean; admin: boolean; lang: "de" | "en";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const run = (key: string, fn: () => Promise<SettingsResult>, set: (r: SettingsResult) => void) => {
    setBusy(key);
    start(async () => { const r = await fn(); set(r); setBusy(null); if (r.ok) router.refresh(); });
  };

  const [name, setName] = useState(p.name);
  const [nameR, setNameR] = useState<SettingsResult | null>(null);
  const [email, setEmail] = useState("");
  const [emailR, setEmailR] = useState<SettingsResult | null>(null);
  const [pwR, setPwR] = useState<SettingsResult | null>(null);
  const [prefs, setPrefs] = useState({ notify_product: p.notifyProduct, notify_reports: p.notifyReports });
  const [prefsR, setPrefsR] = useState<SettingsResult | null>(null);
  const [del, setDel] = useState("");
  const [delR, setDelR] = useState<SettingsResult | null>(null);
  const theme = useSyncExternalStore((cb) => { themeListeners.add(cb); return () => themeListeners.delete(cb); }, readTheme, () => "system" as Theme);

  const hasPassword = p.providers.includes("email");
  const google = p.providers.includes("google");
  const initial = (p.name || p.email).trim().charAt(0).toUpperCase();

  const togglePref = (k: keyof typeof prefs, v: boolean) => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    run("prefs", () => savePrefs(next), setPrefsR);
  };

  return (
    <div className="animate-rise">
      <p className="text-sm text-dim">Konto</p>
      <h1 className="mt-1 font-display text-5xl leading-none">Einstellungen</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="flex gap-1 overflow-x-auto [scrollbar-width:none] lg:sticky lg:top-6 lg:flex-col lg:self-start">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className={cn("inline-flex h-10 shrink-0 items-center gap-2.5 rounded-xl px-3 text-sm font-semibold text-dim transition hover:bg-hi/[0.06] hover:text-fg", s.id === "konto" && "hover:text-rose")}>
              <s.icon className="size-4" /> {s.label}
            </a>
          ))}
        </nav>

        <div className="min-w-0 space-y-6">
          <Section id="profil" title="Profil" desc="So erscheinst du in Qlick und in E-Mails an dich.">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <AvatarEditor userId={p.userId} url={p.avatar} initial={initial} />
              <p className="text-sm text-dim">Dabei seit {dateFmt.format(new Date(p.createdAt))}</p>
            </div>
            <Row label="Name">
              <div className="flex gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Vor- und Nachname" className={input} />
                <button type="button" disabled={pending || name.trim() === p.name.trim()} onClick={() => run("name", () => updateName(name), setNameR)} className={cn(btn, "bg-fg text-bg")}>
                  {busy === "name" ? <Loader2 className="size-4 animate-spin" /> : "Speichern"}
                </button>
              </div>
              <Note r={nameR} />
            </Row>
            <Row label="E-Mail-Adresse" hint="Für Anmeldung, Rechnungen und wichtige Hinweise.">
              <p className="flex items-center gap-2 text-sm font-semibold"><Mail className="size-4 text-dim" /> {p.email}</p>
              {p.pendingEmail && <p className="mt-1.5 text-[12.5px] text-gold">Änderung auf {p.pendingEmail} wartet auf Bestätigung.</p>}
              <div className="mt-3 flex gap-2">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Neue E-Mail-Adresse" className={input} />
                <button type="button" disabled={pending || !email.trim()} onClick={() => run("email", () => changeEmail(email), (r) => { setEmailR(r); if (r.ok) setEmail(""); })} className={cn(btn, "border border-edge-strong hover:bg-hi/[0.06]")}>
                  {busy === "email" ? <Loader2 className="size-4 animate-spin" /> : "Ändern"}
                </button>
              </div>
              <Note r={emailR} />
            </Row>
          </Section>

          <Section id="sicherheit" title="Anmeldung & Sicherheit">
            <Row label="Anmeldemethoden">
              <div className="flex flex-wrap gap-2">
                <span className={cn("inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold", google ? "border-edge-strong" : "border-dashed border-edge text-faint")}>
                  <svg viewBox="0 0 24 24" className="size-4" aria-hidden><path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z" /><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.7H2.1v2.8A11 11 0 0 0 12 23z" /><path fill="#FBBC05" d="M5.7 14a6.6 6.6 0 0 1 0-4.2V7H2.1a11 11 0 0 0 0 9.9z" /><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.1 7l3.6 2.8C6.6 7.3 9.1 5.4 12 5.4z" /></svg>
                  Google {google ? <Check className="size-3.5" /> : <span className="font-normal">nicht verbunden</span>}
                </span>
                <span className={cn("inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold", hasPassword ? "border-edge-strong" : "border-dashed border-edge text-faint")}>
                  <KeyRound className="size-4" /> E-Mail & Passwort {hasPassword ? <Check className="size-3.5" /> : <span className="font-normal">nicht eingerichtet</span>}
                </span>
              </div>
              <p className="mt-2.5 text-[12.5px] text-faint">Mit einem Anmelde-Link per E-Mail kommst du immer rein, auch ohne Passwort.</p>
            </Row>
            <Row label={hasPassword ? "Passwort ändern" : "Passwort festlegen"} hint="Zu deiner Sicherheit per Link an deine E-Mail.">
              <p className="text-sm text-dim">Wir schicken dir einen Link an <b className="text-fg">{p.email}</b>. Darüber legst du das neue Passwort fest. So kann niemand dein Passwort ändern, der nur kurz an deinem Gerät sitzt.</p>
              <button type="button" disabled={pending} onClick={() => run("pw", () => sendPasswordLink(), setPwR)} className={cn(btn, "mt-3 bg-fg text-bg")}>
                {busy === "pw" ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />} Link per E-Mail senden
              </button>
              <Note r={pwR} />
            </Row>
            <Row label="Sitzungen" hint={p.lastSignIn ? `Zuletzt angemeldet: ${timeFmt.format(new Date(p.lastSignIn))}` : undefined}>
              <form action={signOutEverywhere}>
                <button type="submit" className={cn(btn, "border border-edge-strong hover:bg-hi/[0.06]")}><LogOut className="size-4" /> Überall abmelden</button>
              </form>
              <p className="mt-2 text-[12.5px] text-faint">Meldet dich auf allen Geräten ab, auch auf diesem.</p>
            </Row>
          </Section>

          <Section id="benachrichtigungen" title="Benachrichtigungen" desc="Wichtige E-Mails zu Konto, Sicherheit und Zahlungen bekommst du immer.">
            <Toggle on={prefs.notify_reports} onChange={(v) => togglePref("notify_reports", v)} label="Scan-Berichte" hint="Kurze Übersicht, wie oft deine Codes gescannt wurden." />
            <Toggle on={prefs.notify_product} onChange={(v) => togglePref("notify_product", v)} label="Neuigkeiten und Tipps" hint="Neue Funktionen und Ideen für mehr Scans. Höchstens einmal im Monat." />
            <Note r={prefsR} />
          </Section>

          <Section id="darstellung" title="Darstellung">
            <Row label="Design">
              <div className="grid grid-cols-3 gap-2 sm:max-w-md">
                {([["light", "Hell", Sun], ["dark", "Dunkel", Moon], ["system", "System", Monitor]] as const).map(([id, label, Icon]) => (
                  <button key={id} type="button" onClick={() => applyTheme(id)} className={cn("flex flex-col items-center gap-2 rounded-2xl border py-4 text-sm font-semibold transition", theme === id ? "border-lime bg-lime/10 ring-1 ring-lime/40" : "border-edge text-dim hover:text-fg")}>
                    <Icon className="size-5" /> {label}
                  </button>
                ))}
              </div>
            </Row>
            <Row label="Sprache der Website" hint="Studio und Dashboard sind vorerst auf Deutsch.">
              <div className="inline-flex rounded-xl border border-edge p-1">
                {([["de", "Deutsch"], ["en", "English"]] as const).map(([id, label]) => (
                  <button key={id} type="button" onClick={() => { saveLangCookie(id); router.refresh(); }} className={cn("inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition", p.lang === id ? "bg-fg text-bg" : "text-dim hover:text-fg")}>
                    <Languages className="size-4" /> {label}
                  </button>
                ))}
              </div>
            </Row>
          </Section>

          <Section id="daten" title="Daten & Datenschutz">
            <Row label="Deine Daten herunterladen" hint="Alle Codes, Inhalte, Formulare und Antworten als JSON-Datei.">
              <a href="/api/account/export" className={cn(btn, "border border-edge-strong hover:bg-hi/[0.06]")}><Download className="size-4" /> Export herunterladen</a>
            </Row>
            <Row label="Rechtliches">
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <a href="/datenschutz" className="font-semibold underline-offset-4 hover:underline">Datenschutzerklärung</a>
                <a href="/agb" className="font-semibold underline-offset-4 hover:underline">AGB</a>
                <a href="/widerruf" className="font-semibold underline-offset-4 hover:underline">Widerrufsbelehrung</a>
                <a href="/impressum" className="font-semibold underline-offset-4 hover:underline">Impressum</a>
              </div>
            </Row>
          </Section>

          <Section id="konto" title="Konto löschen" danger desc="Löscht dein Konto mit allen Codes, Seiten, Formularen und Statistiken. Das kann nicht rückgängig gemacht werden.">
            {p.admin ? (
              <p className="text-sm text-dim">Admin-Konten lassen sich hier nicht löschen.</p>
            ) : (
              <>
                <ul className="space-y-1.5 text-sm text-dim">
                  <li>• Dynamische Codes funktionieren danach nicht mehr, auch gedruckte.</li>
                  <li>• Ein laufendes Abo wird sofort beendet.</li>
                  <li>• Tipp: Lade vorher deine Daten herunter.</li>
                </ul>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <input value={del} onChange={(e) => setDel(e.target.value)} placeholder="Tippe LÖSCHEN" className={cn(input, "sm:max-w-60")} />
                  <button type="button" disabled={pending || del.trim().toUpperCase() !== "LÖSCHEN"} onClick={() => run("del", () => deleteAccount(del), setDelR)} className={cn(btn, "bg-rose text-white")}>
                    {busy === "del" ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Konto endgültig löschen
                  </button>
                </div>
                <Note r={delR} />
              </>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
