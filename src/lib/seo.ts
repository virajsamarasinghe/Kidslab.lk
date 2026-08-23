import type { Metadata } from "next";
import { SITE_URL } from "@/config/site";
import {
  DEFAULT_AI_CRAWLERS,
  SEO_DEFAULTS,
  type SeoConfig,
  type SeoPageConfig,
} from "@/config/seo";

/** Non-empty string, or the default. Clearing a field in the dashboard restores the shipped value. */
function str(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

/** Non-empty array, or the default. An emptied list is treated as "unset", not "none". */
function list<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) && value.length > 0 ? (value as T[]) : fallback;
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value !== 0 ? value : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/**
 * Overlays the stored `seo` section onto {@link SEO_DEFAULTS}, field by field.
 *
 * Booleans take the stored value whenever one exists — they're switches, and
 * `false` has to survive. Everything else falls back when blank, so the public
 * site can never end up with an empty title, description or NAP block because
 * an admin cleared an input.
 */
export function mergeSeo(stored: Partial<SeoConfig> | null | undefined): SeoConfig {
  const d = SEO_DEFAULTS;
  const s = stored ?? {};
  const org: Partial<SeoConfig["organization"]> = s.organization ?? {};
  const event: Partial<SeoConfig["event"]> = s.event ?? {};

  return {
    siteName: str(s.siteName, d.siteName),
    defaultTitle: str(s.defaultTitle, d.defaultTitle),
    titleTemplate: str(s.titleTemplate, d.titleTemplate),
    description: str(s.description, d.description),
    socialTitle: str(s.socialTitle, d.socialTitle),
    socialDescription: str(s.socialDescription, d.socialDescription),
    keywords: list(s.keywords, d.keywords),
    ogImage: str(s.ogImage, d.ogImage),
    twitterCard: s.twitterCard === "summary" ? "summary" : d.twitterCard,
    googleVerification: str(s.googleVerification, d.googleVerification),
    // No default worth falling back to — a blank Bing tag is simply omitted.
    bingVerification: typeof s.bingVerification === "string" ? s.bingVerification : "",

    organization: {
      legalName: str(org.legalName, d.organization.legalName),
      alternateNames: list(org.alternateNames, d.organization.alternateNames),
      slogan: str(org.slogan, d.organization.slogan),
      description: str(org.description, d.organization.description),
      keywords: str(org.keywords, d.organization.keywords),
      telephone: str(org.telephone, d.organization.telephone),
      email: str(org.email, d.organization.email),
      streetAddress: str(org.streetAddress, d.organization.streetAddress),
      addressLocality: str(org.addressLocality, d.organization.addressLocality),
      postalCode: str(org.postalCode, d.organization.postalCode),
      addressCountry: str(org.addressCountry, d.organization.addressCountry),
      latitude: num(org.latitude, d.organization.latitude),
      longitude: num(org.longitude, d.organization.longitude),
      foundingDate: str(org.foundingDate, d.organization.foundingDate),
      sameAs: list(org.sameAs, d.organization.sameAs),
      areaServed: list(org.areaServed, d.organization.areaServed),
      knowsAbout: list(org.knowsAbout, d.organization.knowsAbout),
    },

    event: {
      enabled: bool(event.enabled, d.event.enabled),
      name: str(event.name, d.event.name),
      description: str(event.description, d.event.description),
      startDate: str(event.startDate, d.event.startDate),
      startTime: str(event.startTime, d.event.startTime),
      endTime: str(event.endTime, d.event.endTime),
      offerValidFrom: str(event.offerValidFrom, d.event.offerValidFrom),
      url: str(event.url, d.event.url),
    },

    pages: list(s.pages, d.pages),
    // English question + answer are what make an entry real; the Sinhala pair
    // is optional and falls back to English at render time. Normalised here so
    // a doc written before translations existed can't render `undefined`.
    faqs: list(s.faqs, d.faqs)
      .filter((f) => f.question?.trim() && f.answer?.trim())
      .map((f) => ({
        question: f.question,
        answer: f.answer,
        questionSi: f.questionSi ?? "",
        answerSi: f.answerSi ?? "",
        showOnPage: f.showOnPage ?? true,
      })),
    answerFacts: list(s.answerFacts, d.answerFacts).filter((f) => f.label?.trim() && f.value?.trim()),
    aiCrawlers: { ...DEFAULT_AI_CRAWLERS, ...(s.aiCrawlers ?? {}) },
    llmsTxtNotes: typeof s.llmsTxtNotes === "string" ? s.llmsTxtNotes : d.llmsTxtNotes,
  };
}

/**
 * The per-page overrides for `path`, with the site-wide values filled in where
 * the page leaves a field blank. Unknown paths get a sensible entry rather than
 * `undefined`, so a new route picks up the site defaults automatically.
 */
export function getPageSeo(config: SeoConfig, path: string): SeoPageConfig {
  const page = config.pages.find((p) => p.path === path);
  const canonical = page?.canonical || `${SITE_URL}${path === "/" ? "" : path}`;

  return {
    path,
    title: page?.title ?? "",
    description: str(page?.description, config.description),
    keywords: list(page?.keywords, config.keywords),
    ogImage: str(page?.ogImage, config.ogImage),
    canonical,
    noindex: page?.noindex ?? false,
    includeInSitemap: page?.includeInSitemap ?? true,
    priority: page?.priority ?? 0.5,
    changeFrequency: page?.changeFrequency ?? "monthly",
  };
}

/**
 * Top-level fields where the stored section differs from what the site is
 * actually serving. Empty means the database already states the live config.
 *
 * Shared by the auto-seed below and `scripts/seed-seo.mts`, so the CLI's
 * report and the runtime's write decision can never disagree.
 */
export function changedSeoFields(
  before: Partial<SeoConfig>,
  next: SeoConfig
): (keyof SeoConfig)[] {
  return (Object.keys(next) as (keyof SeoConfig)[]).filter(
    (key) => JSON.stringify(before[key]) !== JSON.stringify(next[key])
  );
}

/**
 * Writes the merged config back so the database states it outright, instead of
 * leaving it implied by the defaults in `@/config/seo`.
 *
 * Runs off the read the request path already does, so it costs no extra query
 * — and because it writes `mergeSeo(stored)`, stored values win field by
 * field and an admin's edits are never overwritten. Once written the fields
 * match, so this is a one-time write per deploy that adds a field, not a write
 * per request. Set `SEO_AUTO_SEED=0` to turn it off and seed by hand instead.
 *
 * Deliberately not awaited by the caller: a marketing page must not wait on a
 * housekeeping write, and if it fails the next request simply tries again.
 */
async function autoSeed(stored: Partial<SeoConfig> | null, merged: SeoConfig) {
  if (process.env.SEO_AUTO_SEED === "0") return;
  if (changedSeoFields(stored ?? {}, merged).length === 0) return;

  try {
    const { default: Settings } = await import("@/models/Settings");
    // Upsert on an empty filter: this is the singleton settings document, and
    // it may not exist yet on a brand-new database.
    await Settings.updateOne({}, { $set: { seo: merged } }, { upsert: true });
  } catch {
    // Never surface a seeding failure to a visitor — the merged config is
    // already correct in memory, so the page renders either way.
  }
}

/**
 * Reuse window for the merged config before the next read goes back to Mongo.
 *
 * Same reasoning as the settings snapshot in `@/lib/settings`, minus the
 * secrets: `generateMetadata`, the sitemap, robots.txt and /llms.txt each want
 * this config, and none of them should cost a round-trip per request. A save
 * calls {@link invalidateSeoCache}, so an admin sees their edit immediately on
 * the instance that handled it and within a minute everywhere else.
 */
const CACHE_TTL_MS = 60_000;

interface SeoCache {
  value: SeoConfig | null;
  expires: number;
  inflight: Promise<SeoConfig> | null;
}

declare global {
  var _seoConfigCache: SeoCache | undefined;
}

const cache: SeoCache = globalThis._seoConfigCache ?? { value: null, expires: 0, inflight: null };
globalThis._seoConfigCache = cache;

/**
 * The live SEO config for the public site.
 *
 * Deliberately never throws, for the same reason `getActiveCourses` doesn't:
 * the marketing pages must still render — with the shipped defaults — when
 * Mongo is down or `MONGODB_URI` is unset. `@/lib/mongodb` throws at *module
 * scope* in that case, hence the dynamic import inside the try.
 */
export async function getSeoConfig(): Promise<SeoConfig> {
  if (cache.value && cache.expires > Date.now()) return cache.value;
  if (cache.inflight) return cache.inflight;

  const load = async (): Promise<SeoConfig> => {
    let stored: Partial<SeoConfig> | null = null;
    let reachedDb = false;
    try {
      const { connectDB } = await import("@/lib/mongodb");
      const { default: Settings } = await import("@/models/Settings");
      await connectDB();
      const doc = await Settings.findOne().select("seo").lean<{ seo?: Partial<SeoConfig> }>();
      stored = doc?.seo ?? null;
      reachedDb = true;
    } catch {
      stored = null;
    }

    const value = mergeSeo(stored);
    // Only when the read actually succeeded: a failed read looks identical to
    // an empty one, and seeding off that would write defaults over a config we
    // simply couldn't see.
    if (reachedDb) void autoSeed(stored, value);
    cache.value = value;
    cache.expires = Date.now() + CACHE_TTL_MS;
    return value;
  };

  cache.inflight = load().finally(() => {
    cache.inflight = null;
  });
  return cache.inflight;
}

/** Call after saving the SEO section so the next read reflects the change immediately. */
export function invalidateSeoCache() {
  cache.value = null;
  cache.expires = 0;
}

/**
 * Next.js `Metadata` for one route, assembled from the live SEO config.
 *
 * The root layout passes `"/"`, which is also what makes the title a
 * `{ default, template }` pair — every other route contributes only its own
 * title and lets the template wrap it.
 */
export function buildMetadata(config: SeoConfig, path: string): Metadata {
  const page = getPageSeo(config, path);
  const isRoot = path === "/";
  const title = isRoot
    ? { default: config.defaultTitle, template: config.titleTemplate }
    : page.title || config.defaultTitle;
  // The landing page gets the hand-written social headline; deeper pages
  // share their own SERP title with the card, since a per-page social title
  // would be one more field to keep in sync for no real gain.
  const socialTitle = isRoot ? config.socialTitle : page.title || config.socialTitle;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description: page.description,
    keywords: page.keywords,

    authors: [
      { name: "Viraj Samarasinghe", url: SITE_URL },
      { name: "Menura Dulkith", url: SITE_URL },
    ],
    creator: config.siteName,
    publisher: config.siteName,

    robots: page.noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },

    icons: {
      icon: [{ url: "/og-image.png", type: "image/png", sizes: "512x512" }],
      shortcut: ["/og-image.png"],
      apple: [{ url: "/og-image.png", sizes: "512x512", type: "image/png" }],
    },

    openGraph: {
      type: "website",
      locale: "en_LK",
      url: page.canonical,
      siteName: config.siteName,
      title: socialTitle,
      description: config.socialDescription,
      images: [
        {
          url: page.ogImage,
          width: 1200,
          height: 630,
          alt: `${config.siteName} — ${config.organization.slogan}`,
        },
      ],
    },

    twitter: {
      card: config.twitterCard,
      title: socialTitle,
      description: config.socialDescription,
      images: [page.ogImage],
    },

    alternates: {
      canonical: page.canonical,
      // Both locales are served from the same URL by the in-page language
      // switcher, so every hreflang points at the canonical.
      languages: {
        "en-LK": page.canonical,
        "si-LK": page.canonical,
        "x-default": page.canonical,
      },
    },

    verification: {
      ...(config.googleVerification ? { google: config.googleVerification } : {}),
      ...(config.bingVerification ? { other: { "msvalidate.01": config.bingVerification } } : {}),
    },

    category: "education",
  };
}
