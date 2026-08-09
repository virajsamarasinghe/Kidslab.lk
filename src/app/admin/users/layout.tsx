import { requirePageCapability } from "@/lib/auth";

/** /admin/users manages site-visitor records — admin tier and above. */
export default async function UsersLayout({ children }: { children: React.ReactNode }) {
  await requirePageCapability("users:manage");
  return <>{children}</>;
}
