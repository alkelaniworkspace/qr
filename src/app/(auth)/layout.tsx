import { Check } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { renderQrSvg } from "@/lib/qr/render";
import { DEFAULT_STYLE, STYLE_PRESETS, type QrStyle } from "@/lib/qr/style";
import { site } from "@/lib/site";

const showcase = renderQrSvg("https://scanwerk.de", { ...DEFAULT_STYLE, ...STYLE_PRESETS[1].style, margin: 2 } as QrStyle, { size: 320, id: "auth" });

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ambient grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12 animate-rise">{children}</div>
        <p className="text-xs text-faint">© {new Date().getFullYear()} {site.name}</p>
      </div>
      <div className="relative hidden overflow-hidden border-l border-edge bg-surface lg:block">
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime/15 blur-[110px] animate-breathe" />
        <div className="relative flex h-full flex-col items-center justify-center px-12">
          <div className="card card-glow relative overflow-hidden p-6 animate-float">
            <div className="relative overflow-hidden rounded-2xl [&>svg]:size-64" dangerouslySetInnerHTML={{ __html: showcase }} />
            <div className="absolute inset-x-6 h-0.5 rounded-full bg-lime shadow-[0_0_16px_4px_rgba(210,255,31,0.7)] animate-scan" />
          </div>
          <h2 className="mt-12 max-w-md text-center font-display text-4xl uppercase leading-[0.95]">
            Codes, die gesehen werden. <span className="text-lime glow-text">Und bleiben.</span>
          </h2>
          <ul className="mt-6 space-y-2 text-sm text-dim">
            {["Kein Code wird je abgeschaltet", "Live-Statistik ohne Cookies", "Echter Scan-Test bei jedem Design"].map((t) => (
              <li key={t} className="flex items-center gap-2"><Check className="size-4 text-lime" /> {t}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
