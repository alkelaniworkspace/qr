"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, LayoutGrid, Plus, Zap } from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/dashboard", label: "Heute", icon: Zap, match: (p: string) => p === "/dashboard" },
  { href: "/dashboard/codes", label: "Meine Codes", icon: LayoutGrid, match: (p: string) => p.startsWith("/dashboard/codes") },
  { href: "/dashboard/new", label: "Neuer Code", icon: Plus, match: (p: string) => p.startsWith("/dashboard/new") },
  { href: "/dashboard/billing", label: "Tarif", icon: CreditCard, match: (p: string) => p.startsWith("/dashboard/billing") },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto">
      {ITEMS.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition",
              active ? "bg-white/[0.07] text-fg" : "text-dim hover:bg-white/5 hover:text-fg",
            )}
          >
            <Icon className={cn("size-4", active && "text-brand")} strokeWidth={2.2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
