"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, MailX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnsubscribeForm({
  email,
  signature,
}: {
  email: string;
  signature: string;
}) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, signature }),
    });
    setLoading(false);
    if (res.ok) setDone(true);
    else setError("We couldn't process that — please email info@kidslab.lk and we'll remove you.");
  }

  if (done) {
    return (
      <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <strong>{email}</strong> has been removed from our mailing list. You may still receive
          service messages about your account, such as password resets.
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        <MailX className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <span>
          <strong className="text-slate-900">{email}</strong> will stop receiving news and course
          updates from KidsLab.
        </span>
      </div>

      <Button
        onClick={confirm}
        disabled={loading}
        className="btn-brand-navy mt-4 h-11 w-full rounded-full text-sm font-semibold text-white"
      >
        {loading ? "Unsubscribing…" : "Confirm unsubscribe"}
      </Button>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <Link
        href="/"
        className="mt-6 inline-block text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
      >
        Never mind, take me back to kidslab.lk
      </Link>
    </>
  );
}
