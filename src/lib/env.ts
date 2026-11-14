/** Central place for configuration. Public values are inlined at build time. */
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  appUrl: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  /** Short domain printed inside dynamic codes, e.g. https://scn.wk. Falls back to appUrl + /r */
  shortUrl: (process.env.NEXT_PUBLIC_SHORT_URL ?? "").replace(/\/$/, ""),
};

/** False until the Supabase env vars are set: public pages keep working without them. */
export const supabaseConfigured = Boolean(env.supabaseUrl && env.supabaseKey);

export function serverEnv() {
  return {
    secretKey: process.env.SUPABASE_SECRET_KEY ?? "",
    visitorSalt: process.env.VISITOR_SALT ?? "change-me",
    safeBrowsingKey: process.env.GOOGLE_SAFE_BROWSING_KEY ?? "",
  };
}

/** The URL encoded into a dynamic code. Must never change once printed. */
export function shortLink(slug: string): string {
  return env.shortUrl ? `${env.shortUrl}/${slug}` : `${env.appUrl}/r/${slug}`;
}
