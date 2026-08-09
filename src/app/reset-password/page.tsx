"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Those passwords don't match");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } else {
      setError(data.error ?? "Could not reset your password");
    }
  }

  if (!token) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        This reset link is missing its token. Request a new one from the sign-in page.
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Password updated. Taking you to sign in…</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
          New Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="h-11 rounded-xl border-slate-200 pl-9 text-sm"
          />
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          At least 12 characters. Avoid common words, sequences, or your own name.
        </p>
      </div>
      <div>
        <Label htmlFor="confirm" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
          Confirm Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="confirm"
            type="password"
            required
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="h-11 rounded-xl border-slate-200 pl-9 text-sm"
          />
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="btn-brand-navy h-11 w-full rounded-full text-sm font-semibold text-white"
      >
        {loading ? "Updating…" : "Set new password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "var(--brand-paper)" }}>
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Set a new password</h1>
        <p className="text-slate-500 text-sm mt-1.5 mb-6">
          Choose a new password for your admin account.
        </p>
        {/* useSearchParams needs a Suspense boundary to avoid opting the whole route into CSR. */}
        <Suspense fallback={<p className="text-sm text-slate-400">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
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
