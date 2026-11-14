import type { Metadata } from "next";
import { Mark } from "@/components/ui/logo";

export const metadata: Metadata = { title: "Code nicht verfügbar", robots: { index: false } };

export default async function UnavailablePage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div className="max-w-sm">
        <Mark className="mx-auto size-12" />
        <h1 className="mt-6 font-display text-4xl">{reason === "paused" ? "Gerade pausiert" : "Code nicht gefunden"}</h1>
        <p className="mt-3 text-muted">
          {reason === "paused"
            ? "Der Inhaber hat diesen Code vorübergehend pausiert. Bitte versuche es später noch einmal."
            : "Dieser Code ist nicht (mehr) vergeben. Bitte wende dich an die Stelle, an der du ihn gefunden hast."}
        </p>
      </div>
    </main>
  );
}
