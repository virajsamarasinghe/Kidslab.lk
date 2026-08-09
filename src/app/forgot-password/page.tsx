"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    // Deliberately identical whether or not the account exists.
    setMessage(data.message ?? "If that email belongs to an admin account, a reset link is on its way.");
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "var(--brand-paper)" }}>
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Forgot your password?</h1>
        <p className="text-slate-500 text-sm mt-1.5">
          Enter your admin email and we&rsquo;ll send you a link to set a new one.
        </p>

        {sent ? (
          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@kidslab.lk"
                  className="h-11 rounded-xl border-slate-200 pl-9 text-sm"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="btn-brand-navy h-11 w-full rounded-full text-sm font-semibold text-white"
            >
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}

        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
