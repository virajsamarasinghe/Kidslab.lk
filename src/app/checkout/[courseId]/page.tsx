import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAccountUser } from "@/lib/account";
import PayHereCheckout from "@/components/PayHereCheckout";
import CheckoutSignInPrompt from "@/components/CheckoutSignInPrompt";

export const metadata: Metadata = {
  title: "Checkout",
  // A checkout URL has nothing to offer a search engine and shouldn't be indexed.
  robots: { index: false, follow: false },
};

/** Rendered per request — a course's price or availability must never be served stale here. */
export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  // Payment requires an account, so the enrolment and receipt attach to a
  // verified identity rather than a typed-in email. Gated here on the server;
  // the API enforces it independently.
  //
  // This renders a prompt rather than redirecting, because the site has no
  // standalone /sign-in route — Clerk is used in modal mode throughout — and
  // sending someone mid-checkout to a page that 404s would lose the sale.
  const account = await getAccountUser();
  if (!account) return <CheckoutSignInPrompt />;

  const { connectDB } = await import("@/lib/mongodb");
  const { default: Course } = await import("@/models/Course");
  await connectDB();

  const course = await Course.findById(courseId)
    .select("title price isActive")
    .lean()
    .catch(() => null);

  if (!course || !course.isActive || !course.price) notFound();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <h1 className="mb-8 text-center text-2xl font-bold" style={{ color: "var(--brand-navy)" }}>
        Complete your enrolment
      </h1>
      <PayHereCheckout
        courseId={String(course._id)}
        courseTitle={course.title}
        price={course.price}
        account={{
          email: account.email,
          // The stored `name` is the student's; split it only as a starting
          // point for the payer fields, which the parent can correct.
          firstName: account.name?.split(" ")[0] ?? "",
          lastName: account.name?.split(" ").slice(1).join(" ") ?? "",
          phone: account.phone ?? "",
          city: account.city ?? "",
        }}
      />
    </main>
  );
}
