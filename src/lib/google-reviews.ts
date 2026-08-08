export type GoogleReview = {
  name: string;
  role: string;
  quote: string;
  stars: number;
  photoUrl: string | null;
};

type PlacesApiReview = {
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  authorAttribution?: {
    displayName?: string;
    photoUri?: string;
  };
  relativePublishTimeDescription?: string;
};

/**
 * Live reviews from the kidslab.lk Google Business Profile, via the Places
 * API (New). Requires GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID — until both
 * are set (or if Google returns no reviews yet, e.g. a brand-new listing),
 * this returns an empty array and the landing page falls back to its
 * hardcoded testimonials instead of breaking.
 */
export async function getGoogleReviews(): Promise<GoogleReview[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!apiKey || !placeId) return [];

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?languageCode=en`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "reviews",
        },
        next: { revalidate: 300 },
      },
    );
    if (!res.ok) return [];

    const data: { reviews?: PlacesApiReview[] } = await res.json();
    const reviews = data.reviews ?? [];

    return reviews
      .filter((r) => r.authorAttribution?.displayName && r.rating)
      .map((r) => ({
        name: r.authorAttribution!.displayName!,
        role: "Google Review" + (r.relativePublishTimeDescription ? ` · ${r.relativePublishTimeDescription}` : ""),
        quote: r.text?.text ?? r.originalText?.text ?? "",
        stars: Math.round(r.rating ?? 5),
        photoUrl: r.authorAttribution?.photoUri ?? null,
      }))
      .filter((r) => r.quote.length > 0);
  } catch {
    return [];
  }
}
