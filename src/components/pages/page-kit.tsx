import { SmartImg } from "./smart-img";
import type { Design } from "@/lib/page-design";

/**
 * Building blocks shared by every hosted page. Colours, fonts, corners,
 * button and card styles all come from CSS variables / data attributes set
 * by the page shell (see page-design.ts and the .pg rules in globals.css).
 */

export type C = Record<string, unknown>;
export const s = (v: unknown) => String(v ?? "").trim();
export const ugc = { target: "_blank", rel: "noopener nofollow ugc" } as const;

export function Display({ as: Tag = "h1", size, className = "", children, style }: { as?: "h1" | "h2" | "h3" | "p" | "span"; size: string; className?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <Tag className={`pg-display ${className}`} style={{ fontSize: `calc(${size} * var(--pg-display-scale))`, ...style }}>
      {children}
    </Tag>
  );
}

export function initials(text: string) {
  return text.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "•";
}

/** Round (or rounded-square) avatar: photo/logo, else initials on the accent. */
export function Avatar({ src, label, size = 104, square = false, className = "" }: { src?: string; label: string; size?: number; square?: boolean; className?: string }) {
  const shape = square ? "rounded-[calc(var(--pg-radius)*0.9+10px)]" : "rounded-full";
  const fb = (
    <span className={`pg-display grid place-items-center bg-[var(--accent)] text-[var(--on-accent)] ${shape}`} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials(label)}
    </span>
  );
  return (
    <span className={`pg-pop relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }}>
      <span className={`pointer-events-none absolute -inset-3 -z-10 bg-[var(--accent-2)] opacity-40 blur-2xl ${shape}`} />
      {src ? <SmartImg src={src} width={size * 3} eager alt="" className={`size-full object-cover ring-4 ring-[var(--pg-bg)] ${shape}`} fallback={fb} /> : fb}
    </span>
  );
}

/**
 * Page header in three layouts: `cover` (wide image or a designed gradient band
 * with the avatar overlapping it), `centered` (no band, large avatar with halo),
 * `minimal` (left-aligned, editorial).
 */
export function Hero({ d, cover, avatar, square, title, eyebrow, subtitle, children }: {
  d: Design;
  cover?: string;
  avatar?: string;
  square?: boolean;
  title: string;
  eyebrow?: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  if (d.hero === "minimal") {
    return (
      <header className="pt-4">
        <div className="flex items-center gap-3">
          <Avatar src={avatar} label={title} size={56} square={square} />
          {eyebrow && <p className="pg-in text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pg-muted)]">{eyebrow}</p>}
        </div>
        <Display size="2.75rem" className="pg-in mt-6" style={{ "--i": 1 } as React.CSSProperties}>{title}</Display>
        {subtitle && <p className="pg-in mt-3 max-w-sm whitespace-pre-line text-[17px] leading-relaxed text-[var(--pg-muted)]" style={{ "--i": 2 } as React.CSSProperties}>{subtitle}</p>}
        {children && <div className="pg-in mt-6" style={{ "--i": 3 } as React.CSSProperties}>{children}</div>}
        {cover && <SmartImg src={cover} width={1280} eager className="pg-in pg-radius mt-7 aspect-[16/9] w-full object-cover" />}
      </header>
    );
  }
  if (d.hero === "centered") {
    return (
      <header className="flex flex-col items-center pt-8 text-center">
        <Avatar src={avatar} label={title} size={120} square={square} className="pg-float" />
        {eyebrow && <p className="pg-in mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--pg-muted)]">{eyebrow}</p>}
        <Display size="2.6rem" className={`pg-in ${eyebrow ? "mt-2" : "mt-6"}`} style={{ "--i": 1 } as React.CSSProperties}>{title}</Display>
        {subtitle && <p className="pg-in mt-3 max-w-xs whitespace-pre-line leading-relaxed text-[var(--pg-muted)]" style={{ "--i": 2 } as React.CSSProperties}>{subtitle}</p>}
        {children && <div className="pg-in mt-6 w-full" style={{ "--i": 3 } as React.CSSProperties}>{children}</div>}
      </header>
    );
  }
  return (
    <header>
      <div className="relative -mx-5 -mt-8 h-52 overflow-hidden">
        {cover ? (
          <SmartImg src={cover} width={1280} eager className="size-full object-cover" fallback={<CoverArt />} />
        ) : (
          <CoverArt />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--pg-bg)]" />
      </div>
      <div className="relative -mt-16 flex flex-col items-center text-center">
        <Avatar src={avatar} label={title} size={112} square={square} />
        {eyebrow && <p className="pg-in mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--pg-muted)]">{eyebrow}</p>}
        <Display size="2.5rem" className={`pg-in ${eyebrow ? "mt-2" : "mt-5"}`} style={{ "--i": 1 } as React.CSSProperties}>{title}</Display>
        {subtitle && <p className="pg-in mt-3 max-w-xs whitespace-pre-line leading-relaxed text-[var(--pg-muted)]" style={{ "--i": 2 } as React.CSSProperties}>{subtitle}</p>}
        {children && <div className="pg-in mt-6 w-full" style={{ "--i": 3 } as React.CSSProperties}>{children}</div>}
      </div>
    </header>
  );
}

/** Decorative cover when there is no photo: brand gradient with soft light and grain. */
export function CoverArt() {
  return (
    <div className="relative size-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))]">
      <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_20%_10%,rgb(255_255_255/0.35),transparent_60%),radial-gradient(50%_70%_at_90%_90%,rgb(0_0_0/0.25),transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(rgb(255_255_255/0.9)_1px,transparent_1.2px)] [background-size:14px_14px]" />
    </div>
  );
}

export function Btn({ href, children, download, secondary, className = "", external = true, i }: { href: string; children: React.ReactNode; download?: boolean | string; secondary?: boolean; className?: string; external?: boolean; i?: number }) {
  const extra = download ? { download: typeof download === "string" ? download : true } : external ? ugc : {};
  return (
    <a href={href} {...extra} className={`${secondary ? "pg-btn-2" : "pg-btn"} pg-in pg-lift ${className}`} style={i !== undefined ? ({ "--i": i } as React.CSSProperties) : undefined}>
      {children}
    </a>
  );
}

export function Card({ children, className = "", i }: { children: React.ReactNode; className?: string; i?: number }) {
  return (
    <div className={`pg-card pg-in ${className}`} style={i !== undefined ? ({ "--i": i } as React.CSSProperties) : undefined}>
      {children}
    </div>
  );
}

export function IconTile({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`grid size-10 shrink-0 place-items-center rounded-[calc(var(--pg-radius)*0.5+6px)] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent)] ${className}`}>{children}</span>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Display as="h2" size="1.6rem" className="pg-in mb-3">{children}</Display>;
}
