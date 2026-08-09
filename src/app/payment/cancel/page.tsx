import type { Metadata } from "next";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Payment cancelled",
  robots: { index: false, follow: false },
};

/**
 * Where PayHere sends the customer when they back out (`cancel_url`).
 *
 * The order is deliberately left `pending` rather than marked cancelled here:
 * this page is just a browser redirect, and PayHere still sends the
 * authoritative status to the webhook.
 */
export default async function PaymentCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id: orderId } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-lg text-center">
        <div className="mb-6 flex justify-center">
          <XCircle className="h-14 w-14 text-slate-400" />
        </div>
        <h1 className="mb-3 text-2xl font-bold" style={{ color: "var(--brand-navy)" }}>
          Payment cancelled
        </h1>
        <p className="mb-6 text-slate-500">
          No payment was taken and nothing has been charged. You can start again whenever
          you&apos;re ready.
        </p>
        {orderId && (
          <p className="mb-8 text-xs text-slate-400">
            Order number: <span className="font-mono">{orderId}</span>
          </p>
        )}
        <Link href="/">
          <Button className="rounded-full">Back to Home</Button>
        </Link>
      </div>
    </main>
  );
}
