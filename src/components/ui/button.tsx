import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-[14px] font-display font-bold transition-all duration-150 select-none whitespace-nowrap disabled:opacity-40 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  // Chunky 3D brand button: sits on its own shadow, presses down on click
  // Solid lime (dark) / black with lime text (light), soft halo
  primary: "btn-cta",
  // Frosted glass
  secondary:
    "bg-elevated text-fg border border-edge backdrop-blur-xl hover:border-edge-strong hover:bg-hi/10",
  ghost: "text-dim hover:text-fg hover:bg-hi/5",
  danger: "bg-rose text-white hover:brightness-110",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-5 text-[14px]",
  lg: "h-13 px-7 text-[16px]",
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
