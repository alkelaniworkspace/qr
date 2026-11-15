import { AtSign, Globe, Mail, MessageCircle, Phone, ShoppingBag, Star, UtensilsCrossed } from "lucide-react";

/** Simple, recognisable brand marks for link buttons (drawn, no external assets). */
const I = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" className="size-[20px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);

const BRANDS: { re: RegExp; name: string; icon: React.ReactNode }[] = [
  { re: /instagram\.com/i, name: "Instagram", icon: <I><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></I> },
  { re: /tiktok\.com/i, name: "TikTok", icon: <I><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" /><path d="M14 3c.4 2.6 2.2 4.4 5 4.6" /></I> },
  { re: /facebook\.com|fb\.me/i, name: "Facebook", icon: <I><path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V9H7v3.5h2V21h3.5v-8.5H15l.5-3.5h-3V7a1 1 0 0 1 1-1H15z" /></I> },
  { re: /youtube\.com|youtu\.be/i, name: "YouTube", icon: <I><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="m10.5 9.5 4 2.5-4 2.5z" fill="currentColor" /></I> },
  { re: /(^|\/\/|\.)(x|twitter)\.com/i, name: "X", icon: <I><path d="M4 4l16 16M20 4 4 20" /></I> },
  { re: /linkedin\.com/i, name: "LinkedIn", icon: <I><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 10.5V16M8 7.5v.01M12 16v-5.5M12 13a2.5 2.5 0 0 1 5 0v3" /></I> },
  { re: /wa\.me|whatsapp\.com/i, name: "WhatsApp", icon: <MessageCircle className="size-[20px]" strokeWidth={1.8} /> },
  { re: /spotify\.com/i, name: "Spotify", icon: <I><circle cx="12" cy="12" r="9" /><path d="M7.5 9.5c3-1 6.5-.7 9 .8M8 12.6c2.5-.7 5.3-.4 7.4.8M8.6 15.5c2-.5 4-.3 5.6.6" /></I> },
  { re: /pinterest\./i, name: "Pinterest", icon: <I><circle cx="12" cy="12" r="9" /><path d="M11 8.5c3-1 5 .8 4.5 3.2-.4 2-2.3 2.8-3.8 2.1M11.5 11 9.5 20" /></I> },
  { re: /t\.me|telegram\./i, name: "Telegram", icon: <I><path d="M21 4 3 11l6 2 2 6 3-4 5 4z" /><path d="m9 13 8-6" /></I> },
  { re: /threads\.net/i, name: "Threads", icon: <AtSign className="size-[20px]" strokeWidth={1.8} /> },
  { re: /google\.[a-z.]+\/maps|maps\.app\.goo|g\.page/i, name: "Google", icon: <Star className="size-[20px]" strokeWidth={1.8} /> },
  { re: /lieferando|wolt\.com|ubereats|deliveroo/i, name: "Bestellen", icon: <UtensilsCrossed className="size-[20px]" strokeWidth={1.8} /> },
  { re: /shop|etsy\.com|amazon\./i, name: "Shop", icon: <ShoppingBag className="size-[20px]" strokeWidth={1.8} /> },
  { re: /^mailto:/i, name: "E-Mail", icon: <Mail className="size-[20px]" strokeWidth={1.8} /> },
  { re: /^tel:/i, name: "Telefon", icon: <Phone className="size-[20px]" strokeWidth={1.8} /> },
];

export function brandOf(url: string): { name: string; icon: React.ReactNode; social: boolean } {
  const b = BRANDS.find((x) => x.re.test(url));
  if (b) return { name: b.name, icon: b.icon, social: BRANDS.indexOf(b) < 11 };
  return { name: "", icon: <Globe className="size-[20px]" strokeWidth={1.8} />, social: false };
}
