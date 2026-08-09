import { requirePageCapability } from "@/lib/auth";

/**
 * Server-side gate for every /admin/settings page. The pages themselves are
 * client components, so this layout is where the database-backed role check
 * happens — the edge proxy only sees the (potentially stale) JWT.
 */
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requirePageCapability("settings:manage");
  return <>{children}</>;
}
