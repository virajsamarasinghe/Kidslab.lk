"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "pending" | "success" | "failed" | "canceled" | "chargedback";

interface StatusResponse {
  orderId: string;
  status: Status;
  itemName: string;
  amount: number;
  currency: string;
}

/** Stop polling after this long and tell the customer we'll follow up. */
const TIMEOUT_MS = 90_000;
const INTERVAL_MS = 3_000;

/**
 * Waits for the PayHere webhook to confirm an order.
 *
 * The customer arrives here from PayHere's redirect, which is *not* proof of
 * payment — it fires independently of the server notification, and often a
 * moment before it. So the page shows "confirming" until the webhook has
 * actually landed, and never claims success on the redirect alone.
 */
export default function PaymentStatusPoller({ orderId }: { orderId: string }) {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    async function poll() {
      if (cancelled) return;

      try {
        const res = await fetch(`/api/payments/${encodeURIComponent(orderId)}/status`, {
          cache: "no-store",
        });
        if (res.ok) {
          const next: StatusResponse = await res.json();
          if (cancelled) return;
          setData(next);
          // Any status other than pending is final — stop polling.
          if (next.status !== "pending") return;
        }
      } catch {
        // Transient network failure: fall through and retry below.
      }

      if (Date.now() - startedAt > TIMEOUT_MS) {
        if (!cancelled) setTimedOut(true);
        return;
      }
      setTimeout(poll, INTERVAL_MS);
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const status = data?.status;

  if (status === "success") {
    return (
      <Result
        icon={<CheckCircle className="h-14 w-14 text-green-500" />}
        heading="Payment successful"
        message={`Thank you! Your payment for ${data?.itemName} is confirmed and a receipt is on its way to your email.`}
        orderId={orderId}
      />
    );
  }

  if (status === "failed" || status === "canceled" || status === "chargedback") {
    return (
      <Result
        icon={<XCircle className="h-14 w-14 text-red-500" />}
        heading="Payment not completed"
        message="We couldn't confirm this payment. No enrolment has been made. If you believe you were charged, contact us with the order number below and we'll sort it out."
        orderId={orderId}
      />
    );
  }

  if (timedOut) {
    return (
      <Result
        icon={<Clock className="h-14 w-14 text-amber-500" />}
        heading="Still confirming"
        message="Your payment is taking longer than usual to confirm. This is usually just a delay on the bank's side — we'll email you as soon as it clears. No need to pay again."
        orderId={orderId}
      />
    );
  }

  return (
    <Result
      icon={<Loader2 className="h-14 w-14 animate-spin text-slate-400" />}
      heading="Confirming your payment…"
      message="Please don't close this page or pay again — we're waiting for confirmation from PayHere."
      orderId={orderId}
    />
  );
}

function Result({
  icon,
  heading,
  message,
  orderId,
}: {
  icon: React.ReactNode;
  heading: string;
  message: string;
  orderId: string;
}) {
  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mb-6 flex justify-center">{icon}</div>
      <h1 className="mb-3 text-2xl font-bold" style={{ color: "var(--brand-navy)" }}>
        {heading}
      </h1>
      <p className="mb-6 text-slate-500">{message}</p>
      <p className="mb-8 text-xs text-slate-400">
        Order number: <span className="font-mono">{orderId}</span>
      </p>
      <Link href="/">
        <Button className="rounded-full">Back to Home</Button>
      </Link>
    </div>
  );
}
