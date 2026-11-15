import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { LocalCodes } from "@/components/studio/local-codes";

export const metadata: Metadata = { title: "Meine Codes" };

export default function CodesPage() {
  return (
    <>
      <SiteHeader />
      <main className="ambient mx-auto w-full max-w-[1600px] flex-1 px-5 pb-24 pt-10 sm:px-8">
        <LocalCodes />
      </main>
      <SiteFooter />
    </>
  );
}
