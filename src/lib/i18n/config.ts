/** Languages Jovia is offered in. Safe to import from client and server code. */
export const LOCALES = ["en", "de", "fr", "it"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "jovia-lang";

export const LANGUAGES: { code: Locale; short: string; name: string; english: string }[] = [
  { code: "en", short: "EN", name: "English", english: "English" },
  { code: "de", short: "DE", name: "Deutsch", english: "German" },
  { code: "fr", short: "FR", name: "Français", english: "French" },
  { code: "it", short: "IT", name: "Italiano", english: "Italian" },
];

export const isLocale = (v: unknown): v is Locale => typeof v === "string" && (LOCALES as readonly string[]).includes(v);

/** Locale tag for dates and numbers, Swiss conventions. */
export const intlTag = (l: Locale) => `${l}-CH`;

/** Fills {placeholders} in a text. */
export function f(text: string, vars: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** Picks the best supported language from an Accept-Language header. */
export function fromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = Number(params.find((p) => p.trim().startsWith("q="))?.trim().slice(2) ?? 1);
      return { lang: tag.toLowerCase().split("-")[0], q: Number.isFinite(q) ? q : 0 };
    })
    .sort((a, b) => b.q - a.q);
  return ranked.find((r) => isLocale(r.lang))?.lang as Locale | undefined ?? DEFAULT_LOCALE;
}
