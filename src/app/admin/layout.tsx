import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

async function loadProfile() {
  const session = await getAdminSession();
  if (!session) return { name: "Administrator", email: "", avatar: "" };

  await connectDB();
  const user = await User.findById(session.id).select("name email avatar");
  return {
    name: user?.name ?? "Administrator",
    email: user?.email ?? session.email,
    avatar: user?.avatar ?? "",
  };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await loadProfile();

  return <AdminShell profile={profile}>{children}</AdminShell>;
}
