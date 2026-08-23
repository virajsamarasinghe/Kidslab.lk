import LandingPage from "@/components/LandingPage";
import { getActiveCourses } from "@/lib/courses";
import { getGoogleReviews } from "@/lib/google-reviews";
import { getSeoConfig } from "@/lib/seo";
import { buildLandingJsonLd } from "@/lib/structured-data";

/* Mirrors the English landing page in every way except language. */
export const revalidate = 300;

/**
 * The Sinhala landing page, at its own crawlable URL.
 *
 * Same data, same components, same 5-minute ISR window as `/` — the only
 * difference is the `locale` passed down, which selects the Sinhala message
 * bundle and the Sinhala FAQ text. Giving it an address is the point: while
 * the language lived only in a client-side toggle, no crawler could reach
 * this rendering and no visitor could share it.
 */
export default async function SinhalaHome() {
  const [courses, googleReviews, seo] = await Promise.all([
    getActiveCourses(),
    getGoogleReviews(),
    getSeoConfig(),
  ]);
  const jsonLd = buildLandingJsonLd(courses, seo, "si");

  return (
    /* `display: contents` scopes the language to the content without adding a
       box to the layout. The root <html lang> is set by the shared root
       layout, which can't see which route is rendering; a subtree `lang`
       is the spec's own answer to that and is what screen readers use for
       the text they're reading. */
    <div lang="si" style={{ display: "contents" }}>
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <LandingPage
        courses={courses}
        googleReviews={googleReviews}
        faqs={seo.faqs.filter((f) => f.showOnPage)}
        locale="si"
      />
    </div>
  );
}
