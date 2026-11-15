import { ButtonLink } from "@/components/ui/button";
import { Mark } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <main className="ambient grid min-h-screen place-items-center px-6 text-center">
      <div className="animate-rise">
        <Mark className="mx-auto size-14" />
        <p className="mt-8 font-display text-8xl text-brand glow-text">404</p>
        <h1 className="mt-2 font-display text-3xl uppercase">Seite nicht gefunden</h1>
        <p className="mt-3 text-dim">Diese Seite gibt es nicht (mehr).</p>
        <ButtonLink href="/" className="mt-8">Zur Startseite</ButtonLink>
      </div>
    </main>
  );
}
