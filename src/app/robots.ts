import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { AI_CRAWLER_AGENTS, PRIVATE_PATHS } from "@/config/seo";
import { getSeoConfig } from "@/lib/seo";

/* As with the sitemap: the AI-crawler toggles are dashboard state, so this
   file has to be regenerated on a timer rather than frozen at build time. */
export const revalidate = 300;

/**
 * Two groups: everyone, then the answer-engine crawlers by name.
 *
 * `User-agent: *` already allows the AI bots, but several of them (notably
 * Google-Extended and Applebot-Extended, which control whether the site may be
 * used in AI answers rather than whether it may be crawled) are only honoured
 * when named in their own group. Which of them get an Allow is toggled per bot
 * from Settings -> SEO & AEO; a bot switched off is listed with a full
 * `Disallow: /` instead of being silently omitted, since omission would leave
 * it covered by the permissive `*` rule.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSeoConfig();
  const allowed = AI_CRAWLER_AGENTS.filter((agent) => seo.aiCrawlers[agent] !== false);
  const blocked = AI_CRAWLER_AGENTS.filter((agent) => seo.aiCrawlers[agent] === false);

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      ...(allowed.length > 0
        ? [{ userAgent: [...allowed], allow: "/", disallow: PRIVATE_PATHS }]
        : []),
      ...(blocked.length > 0 ? [{ userAgent: [...blocked], disallow: "/" }] : []),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
