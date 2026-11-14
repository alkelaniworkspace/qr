import Link from "next/link";
import { site } from "@/lib/site";

export function Mark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#14130f" />
      <path d="M8 8h7v7H8zM17 8h7v7h-7zM8 17h7v7H8z" fill="none" stroke="#d9c49a" strokeWidth="1.6" />
      <circle cx="20.5" cy="20.5" r="2.6" fill="#d9c49a" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label={site.name}>
      <Mark />
      <span className="font-display text-[26px] leading-none tracking-tight">{site.name}</span>
    </Link>
  );
}
