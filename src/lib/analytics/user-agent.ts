/** Small, dependency-free user agent classification. Good enough for scan stats. */

export function isBot(ua: string): boolean {
  return /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|skype|curl|wget|python-requests|headless/i.test(ua);
}

export function parseUserAgent(ua: string) {
  const device = /iPad|Tablet|Nexus (7|9|10)|SM-T|Kindle|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))
    ? "Tablet"
    : /Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)
      ? "Mobil"
      : "Desktop";

  const os = /iPhone|iPad|iPod/i.test(ua) ? "iOS"
    : /Android/i.test(ua) ? "Android"
    : /Windows/i.test(ua) ? "Windows"
    : /Mac OS X|Macintosh/i.test(ua) ? "macOS"
    : /CrOS/i.test(ua) ? "ChromeOS"
    : /Linux/i.test(ua) ? "Linux"
    : "Andere";

  const browser = /SamsungBrowser/i.test(ua) ? "Samsung Internet"
    : /Edg\//i.test(ua) ? "Edge"
    : /OPR\/|Opera/i.test(ua) ? "Opera"
    : /Firefox|FxiOS/i.test(ua) ? "Firefox"
    : /CriOS|Chrome/i.test(ua) ? "Chrome"
    : /Safari/i.test(ua) ? "Safari"
    : "Andere";

  return { device, os, browser };
}
