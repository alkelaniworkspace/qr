import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/studio", "/preise", "/hilfe", "/signup", "/login", "/agb", "/datenschutz", "/impressum", "/widerruf"].map((p) => ({ url: `${env.appUrl}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.7 }));
}
