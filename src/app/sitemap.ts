import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { hasTranslation, localizedPath } from "@/config/locales";
import { getSeoConfig, languageAlternates } from "@/lib/seo";

/* Same cadence as the landing page and /llms.txt. Without this the file is
   prerendered once at build time and a page added in the dashboard would
   never reach the sitemap until the next deploy. */
export const revalidate = 300;

/**
 * Built from the page list in Settings -> SEO & AEO, so adding a route to the
 * sitemap (or pulling one out of it) is a dashboard edit rather than a deploy.
 * `noindex` pages are excluded regardless of their sitemap flag — listing a
 * page we're asking crawlers to ignore is a contradiction Search Console flags.
 *
 * Translated routes are listed once per language, each entry carrying the
 * same `hreflang` set the page's `<head>` emits. Google treats sitemap
 * annotations and on-page tags as one signal, so the two agreeing is what
 * makes the pair get read as one page in two languages rather than as
 * duplicates competing with each other.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await getSeoConfig();
  const now = new Date();

  return seo.pages
    .filter((page) => page.includeInSitemap && !page.noindex)
    .flatMap((page) => {
      const languages = languageAlternates(page.canonical, page.path);
      const entry = (url: string) => ({
        url,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: { languages },
      });

      const english = page.canonical || `${SITE_URL}${page.path === "/" ? "" : page.path}`;
      if (!hasTranslation(page.path)) return [entry(english)];

      return [entry(english), entry(`${SITE_URL}${localizedPath(page.path, "si")}`)];
    });
}
