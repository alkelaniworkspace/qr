import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import "./globals.css";
import { env } from "@/lib/env";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: { default: `${site.name} – ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: { title: site.name, description: site.description, type: "website", locale: "de_DE" },
};

export const viewport: Viewport = { themeColor: "#0f1113" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full bg-bg">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
