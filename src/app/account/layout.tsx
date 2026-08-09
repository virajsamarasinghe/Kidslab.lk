import type { Metadata } from "next";
import { getAccountUser } from "@/lib/account";
import AccountNav from "@/components/account/AccountNav";
import CheckoutSignInPrompt from "@/components/CheckoutSignInPrompt";

export const metadata: Metadata = {
  title: "My Account",
  // Personal pages: keep them out of search results entirely.
  robots: { index: false, follow: false },
};

/** Always rendered per request — this is one person's private data. */
export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // One gate for the whole section, so no child page can forget it. Each API
  // route re-checks independently — this only controls what gets rendered.
  const account = await getAccountUser();
  if (!account) return <CheckoutSignInPrompt />;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold lg:text-3xl" style={{ color: "var(--brand-navy)" }}>
            My Account
          </h1>
          <p className="mt-1 text-sm text-slate-500">{account.email}</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside>
            <AccountNav />
          </aside>
          <div>{children}</div>
        </div>
      </div>
    </main>
  );
}
