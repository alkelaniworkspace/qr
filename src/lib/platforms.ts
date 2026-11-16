import { BRAND_PATHS } from "./brand-paths";

/**
 * Platforms for link buttons: name, brand colour, how to recognise the URL and
 * a starting URL for "quick add". Icons come from BRAND_PATHS (simple-icons,
 * CC0) or, for the generic entries, from simple drawn glyphs.
 */
export interface Platform {
  key: string;
  label: string;
  color: string;
  re: RegExp;
  prefix: string;
  social: boolean;
}

export const PLATFORMS: Platform[] = [
  { key: "instagram", label: "Instagram", color: "#E4405F", re: /instagram\.com/i, prefix: "https://instagram.com/", social: true },
  { key: "tiktok", label: "TikTok", color: "#000000", re: /tiktok\.com/i, prefix: "https://tiktok.com/@", social: true },
  { key: "youtube", label: "YouTube", color: "#FF0000", re: /youtube\.com|youtu\.be/i, prefix: "https://youtube.com/@", social: true },
  { key: "facebook", label: "Facebook", color: "#0866FF", re: /facebook\.com|fb\.me/i, prefix: "https://facebook.com/", social: true },
  { key: "x", label: "X (Twitter)", color: "#000000", re: /(^|\/\/|\.)(x|twitter)\.com/i, prefix: "https://x.com/", social: true },
  { key: "whatsapp", label: "WhatsApp", color: "#25D366", re: /wa\.me|whatsapp\.com/i, prefix: "https://wa.me/49", social: true },
  { key: "telegram", label: "Telegram", color: "#26A5E4", re: /t\.me|telegram\./i, prefix: "https://t.me/", social: true },
  { key: "snapchat", label: "Snapchat", color: "#FFFC00", re: /snapchat\.com/i, prefix: "https://snapchat.com/add/", social: true },
  { key: "threads", label: "Threads", color: "#000000", re: /threads\.(net|com)/i, prefix: "https://threads.net/@", social: true },
  { key: "bluesky", label: "Bluesky", color: "#1185FE", re: /bsky\.app/i, prefix: "https://bsky.app/profile/", social: true },
  { key: "pinterest", label: "Pinterest", color: "#BD081C", re: /pinterest\./i, prefix: "https://pinterest.com/", social: true },
  { key: "spotify", label: "Spotify", color: "#1DB954", re: /spotify\.com/i, prefix: "https://open.spotify.com/", social: true },
  { key: "applemusic", label: "Apple Music", color: "#FA243C", re: /music\.apple\.com/i, prefix: "https://music.apple.com/", social: true },
  { key: "soundcloud", label: "SoundCloud", color: "#FF5500", re: /soundcloud\.com/i, prefix: "https://soundcloud.com/", social: true },
  { key: "applepodcasts", label: "Apple Podcasts", color: "#9933CC", re: /podcasts\.apple\.com/i, prefix: "https://podcasts.apple.com/", social: true },
  { key: "twitch", label: "Twitch", color: "#9146FF", re: /twitch\.tv/i, prefix: "https://twitch.tv/", social: true },
  { key: "kick", label: "Kick", color: "#53FC18", re: /kick\.com/i, prefix: "https://kick.com/", social: true },
  { key: "discord", label: "Discord", color: "#5865F2", re: /discord\.(gg|com)/i, prefix: "https://discord.gg/", social: true },
  { key: "reddit", label: "Reddit", color: "#FF4500", re: /reddit\.com/i, prefix: "https://reddit.com/u/", social: true },
  { key: "vimeo", label: "Vimeo", color: "#1AB7EA", re: /vimeo\.com/i, prefix: "https://vimeo.com/", social: true },
  { key: "github", label: "GitHub", color: "#181717", re: /github\.com/i, prefix: "https://github.com/", social: true },
  { key: "behance", label: "Behance", color: "#1769FF", re: /behance\.net/i, prefix: "https://behance.net/", social: true },
  { key: "dribbble", label: "Dribbble", color: "#EA4C89", re: /dribbble\.com/i, prefix: "https://dribbble.com/", social: true },
  { key: "xing", label: "XING", color: "#006567", re: /xing\.com/i, prefix: "https://xing.com/profile/", social: true },
  { key: "medium", label: "Medium", color: "#000000", re: /medium\.com/i, prefix: "https://medium.com/@", social: true },
  { key: "substack", label: "Substack", color: "#FF6719", re: /substack\.com/i, prefix: "https://substack.com/@", social: true },
  { key: "patreon", label: "Patreon", color: "#000000", re: /patreon\.com/i, prefix: "https://patreon.com/", social: true },
  { key: "kofi", label: "Ko-fi", color: "#FF5E5B", re: /ko-fi\.com/i, prefix: "https://ko-fi.com/", social: true },
  { key: "paypal", label: "PayPal", color: "#003087", re: /paypal\.(me|com)/i, prefix: "https://paypal.me/", social: true },
  { key: "etsy", label: "Etsy", color: "#F16521", re: /etsy\.com/i, prefix: "https://etsy.com/shop/", social: true },
  { key: "ebay", label: "eBay", color: "#E53238", re: /ebay\./i, prefix: "https://ebay.de/str/", social: true },
  { key: "shopify", label: "Shop", color: "#7AB55C", re: /myshopify\.com/i, prefix: "https://", social: true },
  { key: "calendly", label: "Calendly", color: "#006BFF", re: /calendly\.com/i, prefix: "https://calendly.com/", social: true },
  { key: "googlemaps", label: "Google Maps", color: "#4285F4", re: /google\.[a-z.]+\/maps|maps\.app\.goo|goo\.gl\/maps/i, prefix: "https://maps.google.com/", social: true },
  { key: "google", label: "Google-Bewertungen", color: "#4285F4", re: /g\.page|search\.google\.com\/local/i, prefix: "https://g.page/r/", social: true },
  { key: "tripadvisor", label: "Tripadvisor", color: "#34E0A1", re: /tripadvisor\./i, prefix: "https://tripadvisor.de/", social: true },
  { key: "trustpilot", label: "Trustpilot", color: "#00B67A", re: /trustpilot\.com/i, prefix: "https://trustpilot.com/review/", social: true },
  { key: "yelp", label: "Yelp", color: "#FF1A1A", re: /yelp\./i, prefix: "https://yelp.de/biz/", social: true },
  { key: "airbnb", label: "Airbnb", color: "#FF5A5F", re: /airbnb\./i, prefix: "https://airbnb.de/rooms/", social: true },
  { key: "booking", label: "Booking.com", color: "#003580", re: /booking\.com/i, prefix: "https://booking.com/hotel/", social: true },
  { key: "ubereats", label: "Uber Eats", color: "#06C167", re: /ubereats\.com/i, prefix: "https://ubereats.com/", social: true },
  { key: "signal", label: "Signal", color: "#3A76F0", re: /signal\.(me|group)/i, prefix: "https://signal.me/", social: true },
  { key: "messenger", label: "Messenger", color: "#0099FF", re: /m\.me|messenger\.com/i, prefix: "https://m.me/", social: true },
  { key: "strava", label: "Strava", color: "#FC4C02", re: /strava\.com/i, prefix: "https://strava.com/athletes/", social: true },
  { key: "deezer", label: "Deezer", color: "#A238FF", re: /deezer\.com/i, prefix: "https://deezer.com/", social: true },
  { key: "linkedin", label: "LinkedIn", color: "#0A66C2", re: /linkedin\.com/i, prefix: "https://linkedin.com/in/", social: true },
  { key: "lieferando", label: "Lieferando", color: "#FF8000", re: /lieferando\.|just-eat|takeaway\.com/i, prefix: "https://www.lieferando.de/speisekarte/", social: false },
  { key: "wolt", label: "Wolt", color: "#009DE0", re: /wolt\.com/i, prefix: "https://wolt.com/de/deu/", social: false },
  { key: "amazon", label: "Amazon", color: "#FF9900", re: /amazon\.|amzn\./i, prefix: "https://amazon.de/", social: false },
  { key: "email", label: "E-Mail", color: "#EA4335", re: /^mailto:/i, prefix: "mailto:", social: false },
  { key: "phone", label: "Telefon", color: "#34C759", re: /^tel:/i, prefix: "tel:", social: false },
  { key: "website", label: "Website", color: "#111111", re: /$^/, prefix: "https://", social: false },
];

const SOCIAL_FIRST = new Set(["instagram", "tiktok", "youtube", "facebook", "x", "linkedin", "whatsapp", "telegram", "snapchat", "threads", "pinterest", "spotify", "twitch", "discord", "bluesky", "xing"]);

export function platformByKey(key: string | undefined): Platform | undefined {
  return key ? PLATFORMS.find((p) => p.key === key) : undefined;
}

/** The platform for a link: the owner's choice first, else detected from the URL, else "website". */
export function platformOf(url: string, key?: string): Platform {
  return platformByKey(key) ?? PLATFORMS.find((p) => p.key !== "website" && p.re.test(url)) ?? PLATFORMS.find((p) => p.key === "website")!;
}

export const isSocial = (p: Platform) => SOCIAL_FIRST.has(p.key);
export const brandPath = (key: string) => BRAND_PATHS[key];
