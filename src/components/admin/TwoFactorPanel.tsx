"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ShieldCheck, ShieldOff, Loader2, Copy, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useConfirm } from "./ConfirmContext";

type Status = { enabled: boolean; recoveryCodesRemaining: number };
type Notice = { success: boolean; message: string } | null;

export default function TwoFactorPanel() {
  const confirm = useConfirm();
  const [status, setStatus] = useState<Status | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);

  // Enrolment state, live only between "start" and "verify".
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");

  // Shown exactly once, right after enrolment succeeds.
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  const [disablePassword, setDisablePassword] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/two-factor");
    if (res.ok) setStatus(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function startEnrolment() {
    setBusy(true);
    setNotice(null);
    const res = await fetch("/api/admin/two-factor", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setQr(data.qr);
      setSecret(data.secret);
    } else {
      setNotice({ success: false, message: data.error ?? "Could not start setup" });
    }
    setBusy(false);
  }

  async function verifyEnrolment() {
    setBusy(true);
    setNotice(null);
    const res = await fetch("/api/admin/two-factor", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: code }),
    });
    const data = await res.json();
    if (res.ok) {
      setRecoveryCodes(data.recoveryCodes);
      setQr(""); setSecret(""); setCode("");
      await load();
    } else {
      setNotice({ success: false, message: data.error ?? "Verification failed" });
    }
    setBusy(false);
  }

  async function disable() {
    const ok = await confirm({
      title: "Turn off two-factor authentication?",
      description: "Your account will be protected by password alone. Your recovery codes are destroyed.",
      confirmLabel: "Turn off 2FA",
      destructive: true,
    });
    if (!ok) return;

    setBusy(true);
    setNotice(null);
    const res = await fetch("/api/admin/two-factor", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: disablePassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setNotice({ success: true, message: "Two-factor authentication is off." });
      setDisablePassword("");
      await load();
    } else {
      setNotice({ success: false, message: data.error ?? "Could not disable 2FA" });
    }
    setBusy(false);
  }

  async function signOutEverywhere() {
    const ok = await confirm({
      title: "Sign out of all devices?",
      description: "Every session, including this one, ends immediately. You'll need to sign in again.",
      confirmLabel: "Sign out everywhere",
      destructive: true,
    });
    if (!ok) return;

    setSigningOut(true);
    const res = await fetch("/api/admin/sessions", { method: "DELETE" });
    if (res.ok) {
      window.location.href = "/login";
      return;
    }
    setSigningOut(false);
    setNotice({ success: false, message: "Could not sign out other sessions" });
  }

  function copyCodes() {
    if (!recoveryCodes) return;
    void navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="pcb-card border-slate-100 shadow-sm p-6">
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(15,36,24,0.06)" }}
        >
          <ShieldCheck className="w-5 h-5" style={{ color: "var(--brand-navy)" }} />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">Two-Factor Authentication</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Requires a code from your authenticator app in addition to your password.
          </p>
        </div>
        {status && (
          <span
            className={`ml-auto shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              status.enabled
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-slate-100 text-slate-500 border-slate-200"
            }`}
          >
            {status.enabled ? "On" : "Off"}
          </span>
        )}
      </div>

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className={`mb-4 text-sm px-4 py-3 rounded-xl border ${
            notice.success
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-600"
          }`}
        >
          {notice.message}
        </div>
      )}

      {/* Recovery codes — displayed once, never retrievable again. */}
      {recoveryCodes && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Save your recovery codes now</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Each works once if you lose your phone. They will not be shown again.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-xs text-amber-900">
            {recoveryCodes.map(rc => <span key={rc}>{rc}</span>)}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={copyCodes}
              className="rounded-full text-xs font-semibold border-amber-300 gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy codes"}
            </Button>
            <Button
              size="sm"
              onClick={() => setRecoveryCodes(null)}
              className="btn-brand-navy text-white rounded-full text-xs font-semibold"
            >
              I&rsquo;ve saved them
            </Button>
          </div>
        </div>
      )}

      {status === null ? (
        <p className="text-slate-400 text-sm py-4">Loading…</p>
      ) : status.enabled ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Two-factor is active.{" "}
            {status.recoveryCodesRemaining > 0
              ? `${status.recoveryCodesRemaining} recovery code${status.recoveryCodesRemaining === 1 ? "" : "s"} remaining.`
              : "You have no recovery codes left — turn 2FA off and on again to get a new set."}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Input
              aria-label="Confirm your password to turn off two-factor"
              type="password"
              value={disablePassword}
              onChange={e => setDisablePassword(e.target.value)}
              placeholder="Confirm your password to turn off"
              className="border-slate-200 text-sm max-w-xs"
            />
            <Button
              variant="outline"
              onClick={disable}
              disabled={busy || !disablePassword}
              className="rounded-full text-sm font-semibold border-red-200 text-red-600 gap-1.5 shrink-0"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
              Turn off
            </Button>
          </div>
        </div>
      ) : qr ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
            <Image
              src={qr}
              alt="Two-factor QR code"
              width={160}
              height={160}
              unoptimized
              className="rounded-xl border border-slate-200 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm text-slate-600">
                Scan this with Google Authenticator, 1Password, Authy or similar.
              </p>
              <p className="text-[11px] text-slate-400 mt-2">Can&rsquo;t scan? Enter this key manually:</p>
              <code className="block mt-1 text-xs font-mono break-all text-slate-700 bg-slate-50 rounded-lg px-2 py-1.5">
                {secret}
              </code>
            </div>
          </div>
          <div>
            <Label
              htmlFor="two-factor-enrol-code"
              className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block"
            >
              Enter the 6-digit code to confirm
            </Label>
            <div className="flex gap-2">
              <Input
                id="two-factor-enrol-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="123456"
                className="border-slate-200 text-sm max-w-[10rem] tracking-[0.3em]"
              />
              <Button
                onClick={verifyEnrolment}
                disabled={busy || code.replace(/\s/g, "").length !== 6}
                className="btn-brand-navy text-white rounded-full text-sm font-semibold gap-1.5"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Confirm & enable
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          onClick={startEnrolment}
          disabled={busy}
          className="btn-brand-navy text-white rounded-full text-sm font-semibold gap-1.5"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          Set up two-factor
        </Button>
      )}

      <div className="mt-6 border-t border-slate-100 pt-4">
        <p className="text-sm font-semibold text-slate-900">Active sessions</p>
        <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
          Signed-in sessions expire after 8 hours of inactivity, and always within 7 days.
          Sign out everywhere if you&rsquo;ve used a shared or lost device.
        </p>
        <Button
          variant="outline"
          onClick={signOutEverywhere}
          disabled={signingOut}
          className="rounded-full text-sm font-semibold border-slate-200 gap-1.5"
        >
          {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
          Sign out everywhere
        </Button>
      </div>
    </Card>
  );
}
