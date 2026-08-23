import { describe, expect, it } from "vitest";
import { SITE_URL } from "@/config/site";
import { localizedPath, stripLocale } from "@/config/locales";
import { languageAlternates } from "@/lib/seo";

/**
 * Pins the language-URL contract.
 *
 * Getting hreflang wrong is silent: the tags render, Search Console reports
 * "no return tags", and the two languages quietly compete as duplicates
 * instead of being read as one page in two languages. These assertions are
 * what a route added to (or removed from) `TRANSLATED_PATHS` has to keep true.
 */
describe("localizedPath", () => {
  it("leaves English unprefixed", () => {
    expect(localizedPath("/", "en")).toBe("/");
    expect(localizedPath("/register", "en")).toBe("/register");
  });

  it("prefixes translated routes with the locale", () => {
    expect(localizedPath("/", "si")).toBe("/si");
  });

  it("keeps untranslated routes on their English path in every locale", () => {
    // A /si/register that served English copy would be duplicate content
    // advertised under a language annotation it doesn't honour.
    expect(localizedPath("/register", "si")).toBe("/register");
  });
});

describe("stripLocale", () => {
  it("round-trips a localized path back to its English path", () => {
    expect(stripLocale("/si")).toEqual({ locale: "si", path: "/" });
    expect(stripLocale("/")).toEqual({ locale: "en", path: "/" });
  });
});

describe("languageAlternates", () => {
  it("pairs a translated route with its Sinhala twin", () => {
    expect(languageAlternates(SITE_URL, "/")).toEqual({
      "en-LK": SITE_URL,
      "si-LK": `${SITE_URL}/si`,
      "x-default": SITE_URL,
    });
  });

  it("advertises only English for an untranslated route", () => {
    expect(languageAlternates(`${SITE_URL}/register`, "/register")).toEqual({
      "en-LK": `${SITE_URL}/register`,
      "x-default": `${SITE_URL}/register`,
    });
  });

  it("names every URL in the cluster, so each member can point at the others", () => {
    // Google discards a whole hreflang cluster whose members disagree. Both
    // routes derive their map from the same English canonical, so the set is
    // identical by construction; what this pins is that the set is complete.
    const map = languageAlternates(SITE_URL, "/");
    expect(new Set(Object.values(map))).toEqual(
      new Set([SITE_URL, `${SITE_URL}${localizedPath("/", "si")}`])
    );
  });
});
