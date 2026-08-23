/**
 * The site's two languages, and the URL shape that makes both of them
 * indexable.
 *
 * English is served unprefixed (`/`) and Sinhala under `/si`. That split is
 * the whole point: search engines index URLs, not UI state, so a language
 * that only exists behind a client-side toggle can never be crawled, ranked
 * or shared. Anything that emits a URL — canonicals, hreflang, the sitemap,
 * the language switcher — derives it from this file rather than hardcoding
 * the prefix.
 */

export const LOCALES = ["en", "si"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** BCP-47 tags, used for `hreflang` and `<html lang>`. */
export const LOCALE_TAGS: Record<Locale, string> = {
  en: "en-LK",
  si: "si-LK",
};

/** Open Graph's underscore spelling of the same thing. */
export const OG_LOCALES: Record<Locale, string> = {
  en: "en_LK",
  si: "si_LK",
};

/**
 * Routes that genuinely exist in both languages.
 *
 * Only the landing page is translated — `/register` is an English-only form,
 * so it gets no Sinhala URL and no `si-LK` alternate. Publishing a `/si`
 * twin of an untranslated page would be duplicate content pointed at by a
 * language annotation it doesn't honour, which is worse than not offering it.
 * Add a path here once its copy exists in `src/messages/si.json`.
 */
export const TRANSLATED_PATHS = ["/"];

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function hasTranslation(path: string): boolean {
  return TRANSLATED_PATHS.includes(path);
}

/**
 * The URL path a route lives at in a given locale.
 *
 * Untranslated routes stay on their English path in every locale, so a
 * Sinhala visitor clicking through to `/register` lands on the page that
 * actually exists instead of a 404.
 */
export function localizedPath(path: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE || !hasTranslation(path)) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** Splits `/si/foo` into its locale and its underlying English path. */
export function stripLocale(pathname: string): { locale: Locale; path: string } {
  const [, first, ...rest] = pathname.split("/");
  if (first && isLocale(first) && first !== DEFAULT_LOCALE) {
    return { locale: first, path: `/${rest.join("/")}`.replace(/\/$/, "") || "/" };
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
}
