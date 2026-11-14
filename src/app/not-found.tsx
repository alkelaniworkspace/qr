import { ButtonLink } from "@/components/ui/button";
import { Mark } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <Mark className="mx-auto size-12" />
        <h1 className="mt-6 font-display text-5xl">Seite nicht gefunden</h1>
        <p className="mt-3 text-muted">Diese Seite gibt es nicht (mehr).</p>
        <ButtonLink href="/" className="mt-8">Zur Startseite</ButtonLink>
      </div>
    </main>
  );
}
