"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminProfile } from "./AdminProfileContext";

/**
 * Blocks the entire dashboard behind a modal until an invited admin sets
 * their own password. The temporary password emailed at account creation
 * only needs to get them this far — `PATCH /api/admin/profile` clears
 * `mustChangePassword` on success, same as a regular self-service change.
 *
 * Changing the password bumps `passwordChangedAt`, which invalidates the
 * session that's active right now (see `isStaleSession`), so this signs out
 * and sends them back to `/login` rather than trying to keep the session alive.
 */
export default function ForcePasswordChangeGate({ children }: { children: ReactNode }) {
  const profile = useAdminProfile();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!profile.mustChangePassword) return <>{children}</>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not set your new password");

      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set your new password");
      setSaving(false);
    }
  }

  return (
    <>
      {children}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="force-password-change-heading"
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      >
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(15,36,24,0.06)" }}
            >
              <KeyRound className="w-5 h-5" style={{ color: "var(--brand-navy)" }} />
            </div>
            <h2 id="force-password-change-heading" className="text-lg font-bold text-slate-900">
              Set your password
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-2 mb-5">
            Your account was created with a temporary password. Enter it below along with a new
            password of your own — you won&apos;t be able to use the dashboard until you do.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="force-current-password" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Temporary password
              </Label>
              <Input
                id="force-current-password"
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="border-slate-200 text-sm"
                placeholder="From your invite email"
              />
            </div>
            <div>
              <Label htmlFor="force-new-password" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                New password
              </Label>
              <Input
                id="force-new-password"
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="border-slate-200 text-sm"
                placeholder="At least 12 characters"
              />
            </div>
            <div>
              <Label htmlFor="force-confirm-password" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Confirm new password
              </Label>
              <Input
                id="force-confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="border-slate-200 text-sm"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 text-sm px-4 py-3 rounded-xl border bg-red-50 border-red-200 text-red-600">
                <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="break-words">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={saving}
              className="w-full btn-brand-navy text-white font-semibold rounded-full text-sm gap-1.5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              {saving ? "Setting password…" : "Set password & continue"}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
