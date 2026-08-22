import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

/** Never crawlable, by any agent — dashboard, API surface, admin login. */
const PRIVATE_PATHS = ["/admin", "/admin/", "/api/", "/login"];

/**
 * Answer-engine crawlers, listed explicitly.
 *
 * `User-agent: *` already allows them, but several of these bots (notably
 * Google-Extended and Applebot-Extended, which control whether the site may
 * be used in AI answers rather than whether it may be crawled) are only
 * honoured when named in their own group. Naming them is what makes
 * kidslab.lk quotable in ChatGPT / Perplexity / Claude / AI Overviews
 * answers to questions like "best kids AI class in Sri Lanka".
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "meta-externalagent",
  "Bytespider",
  "cohere-ai",
  "DuckAssistBot",
  "Amazonbot",
  "YouBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow:     "/",
        disallow:  PRIVATE_PATHS,
      },
      {
        userAgent: AI_CRAWLERS,
        allow:     "/",
        disallow:  PRIVATE_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host:    SITE_URL,
  };
}
