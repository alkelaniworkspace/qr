import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/create", "/signup", "/login"].map((p) => ({ url: `${env.appUrl}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.7 }));
}
