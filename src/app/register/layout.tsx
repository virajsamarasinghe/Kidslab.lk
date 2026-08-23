import type { Metadata } from "next";
import { buildMetadata, getSeoConfig } from "@/lib/seo";

/* Managed from /admin/settings/seo -> Pages, keyed on this route's path. */
export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(await getSeoConfig(), "/register");
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
