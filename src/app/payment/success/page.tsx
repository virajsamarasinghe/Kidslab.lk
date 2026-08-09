import type { Metadata } from "next";
import PaymentStatusPoller from "@/components/PaymentStatusPoller";

export const metadata: Metadata = {
  title: "Payment status",
  robots: { index: false, follow: false },
};

/**
 * Where PayHere sends the customer back to (`return_url`).
 *
 * Landing here does not mean the payment succeeded — the redirect is under the
 * customer's control and races the server notification — so the page only
 * reports whatever the webhook has recorded.
 */
export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id: orderId } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
      {orderId ? (
        <PaymentStatusPoller orderId={orderId} />
      ) : (
        <p className="text-slate-500">
          No order reference was provided. If you just paid, check your email for the receipt.
        </p>
      )}
    </main>
  );
}
