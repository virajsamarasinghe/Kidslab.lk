import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { isAdminRole } from "@/lib/roles";
import type { AdminProfile } from "@/components/admin/AdminProfileContext";
import { requirePageCapability } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Re-checks the signed-in admin against the database on every dashboard load.
 *
 * The proxy runs on the edge and can only read the JWT, which is fixed for 7
 * days — so a revoked or deactivated admin would keep their access until it
 * expired. This is the layer that notices, and it also means a role change
 * takes effect on the next page load rather than the next login.
 */
async function loadProfile(): Promise<AdminProfile> {
  // Covers the revoked/deactivated/stale-session cases in one place, so this
  // layout can't drift from the checks the API guards apply.
  const session = await requirePageCapability("dashboard:read");

  await connectDB();
  const user = await User.findById(session.id).select("name email avatar role");
  if (!user || !isAdminRole(user.role)) redirect("/login");

  return {
    name: user.name || "Administrator",
    email: user.email,
    avatar: user.avatar ?? "",
    role: user.role,
  };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await loadProfile();

  return <AdminShell profile={profile}>{children}</AdminShell>;
}
