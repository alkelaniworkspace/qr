/**
 * Social sign-in providers shown on /login and /signup.
 *
 * To switch one on:
 *   1. Enable it in Supabase → Authentication → Sign In / Providers (client id + secret).
 *   2. Add `${NEXT_PUBLIC_APP_URL}/auth/confirm` to the provider's redirect URLs.
 *   3. Set `enabled: true` below. The button and the server action pick it up automatically.
 *
 * `supabase` is the provider id Supabase expects in signInWithOAuth().
 */
export type ProviderId = "google" | "apple" | "microsoft" | "linkedin" | "facebook" | "github";

export interface AuthProvider {
  id: ProviderId;
  label: string;
  supabase: "google" | "apple" | "azure" | "linkedin_oidc" | "facebook" | "github";
  enabled: boolean;
  /** Shown as a full-width button; the others sit in a compact row below. */
  primary?: boolean;
}

export const AUTH_PROVIDERS: AuthProvider[] = [
  { id: "google", label: "Google", supabase: "google", enabled: true, primary: true },
  { id: "apple", label: "Apple", supabase: "apple", enabled: false, primary: true },
  { id: "microsoft", label: "Microsoft", supabase: "azure", enabled: false },
  { id: "linkedin", label: "LinkedIn", supabase: "linkedin_oidc", enabled: false },
  { id: "facebook", label: "Facebook", supabase: "facebook", enabled: false },
  { id: "github", label: "GitHub", supabase: "github", enabled: false },
];

export function findProvider(id: unknown): AuthProvider | undefined {
  return AUTH_PROVIDERS.find((p) => p.id === id);
}
