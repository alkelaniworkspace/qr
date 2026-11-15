import Link from "next/link";
import { site } from "@/lib/site";

/**
 * Qlick mark: a QR finder eye that turns into a Q. Its tail is a cursor,
 * because scanning should feel as easy as a click.
 */
export function Mark({ className = "size-8", tone = "auto" }: { className?: string; tone?: "auto" | "dark" | "light" }) {
  const ink = tone === "dark" ? "#191919" : tone === "light" ? "#ffffff" : "currentColor";
  return (
    <svg viewBox="0 0 56 56" className={className} aria-hidden>
      <rect x="5" y="5" width="38" height="38" rx="12" fill="none" stroke={ink} strokeWidth="6" />
      <rect x="17" y="17" width="14" height="14" rx="4" fill={ink} />
      <path d="M33 33 L51 39 L43 43 L39 51 Z" fill="#bdfb04" stroke="var(--color-bg, #191919)" strokeWidth="2.5" strokeLinejoin="round" className="origin-[40px_40px] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2 text-fg" aria-label={site.name}>
      <Mark className="size-8" />
      <span className="font-display text-[24px] leading-none tracking-[-0.05em]">{site.name.toLowerCase()}</span>
    </Link>
  );
}
