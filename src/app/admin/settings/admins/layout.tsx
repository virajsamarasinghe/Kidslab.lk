import { requirePageCapability } from "@/lib/auth";

/** Narrows the parent settings gate from `settings:manage` to super admins only. */
export default async function AdminsLayout({ children }: { children: React.ReactNode }) {
  await requirePageCapability("admins:manage");
  return <>{children}</>;
}
