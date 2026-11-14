"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, LayoutGrid, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/dashboard", label: "Meine Codes", icon: LayoutGrid, exact: true },
  { href: "/dashboard/new", label: "Neuer Code", icon: Plus },
  { href: "/dashboard/billing", label: "Tarif", icon: CreditCard },
];

export function DashboardNav({ horizontal = false }: { horizontal?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className={cn(horizontal ? "flex gap-1 overflow-x-auto" : "space-y-1")}>
      {ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href || pathname.startsWith("/dashboard/codes") : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition whitespace-nowrap",
              active ? "bg-white font-medium text-ink shadow-soft" : "text-muted hover:bg-white/60 hover:text-ink",
            )}
          >
            <Icon className="size-[18px]" strokeWidth={1.7} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
