import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { getSeoConfig } from "@/lib/seo";

/* Same cadence as the landing page and /llms.txt. Without this the file is
   prerendered once at build time and a page added in the dashboard would
   never reach the sitemap until the next deploy. */
export const revalidate = 300;

/**
 * Built from the page list in Settings -> SEO & AEO, so adding a route to the
 * sitemap (or pulling one out of it) is a dashboard edit rather than a deploy.
 * `noindex` pages are excluded regardless of their sitemap flag — listing a
 * page we're asking crawlers to ignore is a contradiction Search Console flags.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await getSeoConfig();
  const now = new Date();

  return seo.pages
    .filter((page) => page.includeInSitemap && !page.noindex)
    .map((page) => ({
      url: page.canonical || `${SITE_URL}${page.path === "/" ? "" : page.path}`,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    }));
}
