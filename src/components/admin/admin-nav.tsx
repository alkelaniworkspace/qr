"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, Gift, History, QrCode, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/admin", label: "Übersicht", icon: Gauge, exact: true },
  { href: "/admin/users", label: "Nutzer", icon: Users },
  { href: "/admin/gifts", label: "Geschenke", icon: Gift },
  { href: "/admin/codes", label: "Codes", icon: QrCode },
  { href: "/admin/codes?f=trash", label: "Papierkorb", icon: Trash2 },
  { href: "/admin/log", label: "Protokoll", icon: History },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="mt-8 flex gap-1 overflow-x-auto rounded-2xl border border-edge bg-surface p-1 [scrollbar-width:none] sm:inline-flex">
      {TABS.map((t) => {
        const on = t.exact ? path === t.href : t.href.includes("?") ? false : path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={cn("inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition", on ? "bg-fg text-bg" : "text-dim hover:text-fg")}>
            <t.icon className="size-4" /> {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
