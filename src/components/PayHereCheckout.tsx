"use client";

import { useRef, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  courseId: string;
  courseTitle: string;
  price: number;
  currency?: string;
  /**
   * The signed-in account's details, resolved on the server. `email` is shown
   * read-only: the API takes it from the session regardless of what's posted,
   * so an editable field would be a lie about what the receipt is sent to.
   */
  account: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    city: string;
  };
}

interface InitiateResponse {
  checkoutUrl: string;
  orderId: string;
  fields: Record<string, string>;
}

/**
 * Collects payer details, asks the server to sign a PayHere checkout, then
 * posts the signed fields to PayHere's hosted page.
 *
 * The form POST has to be a real one — PayHere's checkout only accepts a
 * top-level form submission, not a `fetch`. So the response fields are
 * rendered into a hidden form which is submitted programmatically, and the
 * signing itself stays on the server where the merchant secret lives.
 */
export default function PayHereCheckout({
  courseId,
  courseTitle,
  price,
  currency = "LKR",
  account,
}: Props) {
  const [form, setForm] = useState({
    firstName: account.firstName,
    lastName: account.lastName,
    phone: account.phone,
    address: "",
    city: account.city,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkout, setCheckout] = useState<InitiateResponse | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, ...form }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not start the payment. Please try again.");
        setLoading(false);
        return;
      }

      // Render the hidden form, then submit it once React has committed it.
      setCheckout(data as InitiateResponse);
      requestAnimationFrame(() => formRef.current?.submit());
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  const formattedPrice = `${currency} ${price.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-6 rounded-xl border border-black/10 bg-white p-5">
        <p className="text-sm text-black/60">You&apos;re paying for</p>
        <p className="mt-1 text-lg font-semibold">{courseTitle}</p>
        <p className="mt-2 text-2xl font-bold">{formattedPrice}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName">First name *</Label>
            <Input id="firstName" value={form.firstName} onChange={set("firstName")} required />
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" value={form.lastName} onChange={set("lastName")} />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={account.email} readOnly disabled />
          <p className="mt-1 text-xs text-slate-400">
            Your receipt goes here. Change it from your profile.
          </p>
        </div>

        <div>
          <Label htmlFor="phone">Phone *</Label>
          <Input id="phone" type="tel" value={form.phone} onChange={set("phone")} required />
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Input id="address" value={form.address} onChange={set("address")} />
        </div>

        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" value={form.city} onChange={set("city")} />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redirecting to PayHere…
            </>
          ) : (
            `Pay ${formattedPrice}`
          )}
        </Button>

        <p className="flex items-center justify-center gap-1.5 text-xs text-black/50">
          <ShieldCheck className="h-3.5 w-3.5" />
          Payments are processed securely by PayHere. We never see your card details.
        </p>
      </form>

      {checkout && (
        <form ref={formRef} method="POST" action={checkout.checkoutUrl} className="hidden">
          {Object.entries(checkout.fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} readOnly />
          ))}
        </form>
      )}
    </div>
  );
}
