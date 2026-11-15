import type { Metadata } from "next";
import { Mark } from "@/components/ui/logo";

export const metadata: Metadata = { title: "Code nicht verfügbar", robots: { index: false } };

export default async function UnavailablePage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  const paused = reason === "paused";
  return (
    <main className="ambient grid min-h-screen place-items-center px-6 text-center">
      <div className="max-w-sm animate-rise">
        <Mark className="mx-auto size-14" />
        <span className={`badge mt-8 ${paused ? "bg-gold" : "bg-rose"} text-bg`}>{paused ? "Pausiert" : "Nicht gefunden"}</span>
        <h1 className="mt-4 font-display text-4xl uppercase leading-[0.95]">{paused ? "Gerade pausiert" : "Code nicht gefunden"}</h1>
        <p className="mt-4 text-dim">
          {paused
            ? "Der Inhaber hat diesen Code vorübergehend pausiert. Bitte versuche es später noch einmal."
            : "Dieser Code ist nicht (mehr) vergeben. Bitte wende dich an die Stelle, an der du ihn gefunden hast."}
        </p>
      </div>
    </main>
  );
}
