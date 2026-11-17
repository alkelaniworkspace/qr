import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 sm:px-8">
        <h1 className="font-display text-5xl leading-tight">{title}</h1>
        <p className="mt-3 text-sm text-faint">Stand: {updated}</p>
        <div className="legal mt-10 space-y-10">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}

export function Sec({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="scroll-mt-24" id={`s${n}`}>
      <h2 className="flex items-baseline gap-3 text-xl font-bold">
        <span className="grid size-7 shrink-0 translate-y-[-2px] place-items-center rounded-lg bg-lime text-[13px] font-bold text-night">{n}</span>
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-dim [&_b]:font-semibold [&_b]:text-fg [&_a]:text-fg [&_a]:underline [&_a]:underline-offset-2 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">{children}</div>
    </section>
  );
}
