import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-[14px] font-display font-bold uppercase tracking-[0.03em] transition-all duration-150 select-none whitespace-nowrap disabled:opacity-40 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  // Chunky 3D brand button: sits on its own shadow, presses down on click
  primary:
    "bg-brand text-on-brand shadow-[0_4px_0_#7a1027,0_0_32px_-4px_rgba(212,42,78,0.55)] hover:-translate-y-0.5 hover:shadow-[0_6px_0_#7a1027,0_0_44px_-2px_rgba(212,42,78,0.7)] active:translate-y-1 active:shadow-[0_0_0_#7a1027,0_0_20px_-4px_rgba(212,42,78,0.5)]",
  secondary:
    "bg-elevated text-fg border border-edge-strong shadow-[0_4px_0_rgba(0,0,0,0.45)] hover:-translate-y-0.5 hover:border-white/30 active:translate-y-1 active:shadow-none",
  ghost: "text-dim hover:text-fg hover:bg-white/5",
  danger: "bg-rose text-white shadow-[0_4px_0_#a1303b] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[12px]",
  md: "h-11 px-5 text-[13px]",
  lg: "h-14 px-7 text-[15px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: { href: string; variant?: Variant; size?: Size; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}
