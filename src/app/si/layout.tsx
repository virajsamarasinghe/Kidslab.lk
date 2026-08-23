import type { Metadata } from "next";
import { buildMetadata, getSeoConfig } from "@/lib/seo";

/* Same 5-minute window as the English landing page it mirrors. */
export const revalidate = 300;

/**
 * Metadata for the Sinhala landing page.
 *
 * It reuses the `"/"` entry from Settings -> SEO & AEO — same admin-managed
 * title, description and keywords — and passes `"si"`, which is what swaps
 * the canonical to `/si`, sets `og:locale` to `si_LK` and pairs the hreflang
 * tags with their English counterparts.
 */
export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(await getSeoConfig(), "/", "si");
}

export default function SinhalaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
