import type { Metadata } from "next";
import { ImportReceiver } from "./receiver";

export const metadata: Metadata = { title: "Speisekarte übernehmen", robots: { index: false } };

export default function ImportPage() {
  return (
    <main className="ambient grid min-h-screen place-items-center px-5 py-12">
      <ImportReceiver />
    </main>
  );
}
