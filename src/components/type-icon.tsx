import {
  CalendarDays, Contact, FileText, Globe, Layers, Link2, Mail, MapPin, MessageSquare, Phone, Smartphone, Star,
  TicketPercent, Type, UtensilsCrossed, Wifi, Flame, Coffee, Wine, Croissant, Pizza, Calendar, Gift, BarChart3, Ticket, Briefcase,
  AlignLeft, Hash, CircleDot, ListChecks, ChevronDown, Gauge, ShieldCheck, Heading, ClipboardList, Fish, Sandwich, IceCreamCone, Hammer, Sparkles, type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  CalendarDays, Contact, FileText, Globe, Layers, Link2, Mail, MapPin, MessageSquare, Phone, Smartphone, Star,
  TicketPercent, Type, UtensilsCrossed, Wifi, Flame, Coffee, Wine, Croissant, Pizza, Calendar, Gift, BarChart3, Ticket, Briefcase,
  AlignLeft, Hash, CircleDot, ListChecks, ChevronDown, Gauge, ShieldCheck, Heading, ClipboardList, Fish, Sandwich, IceCreamCone, Hammer, Sparkles,
};

export function TypeIcon({ name, className = "size-5" }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Link2;
  return <Icon className={className} strokeWidth={1.6} />;
}
