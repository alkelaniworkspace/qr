import { Globe, Mail, Phone, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { brandPath, isSocial, platformOf, type Platform } from "@/lib/platforms";

/** Brand mark for a platform (simple-icons paths), filled with currentColor. */
export function BrandIcon({ k, className = "size-[20px]" }: { k: string; className?: string }) {
  const path = brandPath(k);
  if (path) return <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden><path d={path} /></svg>;
  switch (k) {
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
          <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
        </svg>
      );
    case "lieferando":
    case "wolt":
      return <UtensilsCrossed className={className} strokeWidth={2} />;
    case "amazon":
      return <ShoppingBag className={className} strokeWidth={2} />;
    case "email":
      return <Mail className={className} strokeWidth={2} />;
    case "phone":
      return <Phone className={className} strokeWidth={2} />;
    default:
      return <Globe className={className} strokeWidth={1.9} />;
  }
}

export function brandOf(url: string, key?: string): { name: string; icon: React.ReactNode; social: boolean; color: string; platform: Platform } {
  const p = platformOf(url, key);
  return { name: p.key === "website" ? "" : p.label, icon: <BrandIcon k={p.key} />, social: isSocial(p), color: p.color, platform: p };
}
