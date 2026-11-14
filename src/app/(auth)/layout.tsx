import { Logo } from "@/components/ui/logo";
import { renderQrSvg } from "@/lib/qr/render";
import { DEFAULT_STYLE, type QrStyle } from "@/lib/qr/style";
import { site } from "@/lib/site";

const showcase = renderQrSvg(
  "https://scanwerk.de",
  { ...DEFAULT_STYLE, dots: "classy", eyeFrame: "leaf", eyeBall: "leaf", fill: { type: "linear", colors: ["#d9c49a", "#a8823f"], rotation: 45 }, background: "#14130f", margin: 2 } as QrStyle,
  { size: 320, id: "auth" },
);

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">{children}</div>
        <p className="text-xs text-muted">© {new Date().getFullYear()} {site.name}</p>
      </div>
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <div className="absolute inset-0 opacity-[0.07] grain [filter:invert(1)]" />
        <div className="relative flex h-full flex-col items-center justify-center px-12 text-paper">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8 shadow-2xl [&>svg]:size-64" dangerouslySetInnerHTML={{ __html: showcase }} />
          <p className="mt-10 max-w-sm text-center font-display text-3xl leading-tight">
            Codes, die gesehen werden. <em className="text-gold-soft">Und die bleiben.</em>
          </p>
          <p className="mt-3 max-w-xs text-center text-sm text-paper/60">Kein Code von uns wird je abgeschaltet. Auch nicht, wenn du kündigst.</p>
        </div>
      </div>
    </div>
  );
}
