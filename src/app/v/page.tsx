import type { Metadata } from "next";
import { PageFromHash } from "./page-from-hash";

export const metadata: Metadata = { title: "Seite", robots: { index: false, follow: false } };

export default function InCodePage() {
  return <PageFromHash />;
}
