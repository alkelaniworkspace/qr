import Link from "next/link";
import { site } from "@/lib/site";

export function Mark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#7b5cff" />
      <path d="M8 8h6.5v6.5H8zM17.5 8H24v6.5h-6.5zM8 17.5h6.5V24H8z" fill="#ffffff" />
      <path d="M10.2 10.2h2.1v2.1h-2.1zM19.7 10.2h2.1v2.1h-2.1zM10.2 19.7h2.1v2.1h-2.1z" fill="#7b5cff" />
      <rect x="17.5" y="17.5" width="6.5" height="6.5" rx="3.25" fill="#22d3ee" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5" aria-label={site.name}>
      <Mark className="size-8 transition-transform duration-300 group-hover:rotate-[-8deg]" />
      <span className="font-display text-[22px] leading-none">{site.name}</span>
    </Link>
  );
}
