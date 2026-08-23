import type { Metadata } from "next";
import { buildMetadata, getSeoConfig } from "@/lib/seo";

/* Same 5-minute window as the landing page. `revalidatePath("/register")` on
   save is what makes an edit show up immediately; this is the fallback for a
   write that didn't come through PUT /api/settings. */
export const revalidate = 300;

/* Managed from /admin/settings/seo -> Pages, keyed on this route's path. */
export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(await getSeoConfig(), "/register");
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
