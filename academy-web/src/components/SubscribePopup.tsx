"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Mail, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";

/* ── Popup timing, tuned to the common industry pattern ──
   - Subscribing suppresses it permanently (SUBSCRIBED_KEY).
   - Dismissing ("Maybe later" / ✕) suppresses it for a cooldown period,
     not forever — the visitor is re-eligible after DISMISS_COOLDOWN_MS,
     same as most exit-intent / newsletter tools (Mailchimp, OptinMonster
     etc. default to a multi-day cooldown rather than "never again").
   - Trigger: exit-intent (cursor leaves toward the top of the viewport)
     is the primary trigger on desktop, since that's the standard for
     this kind of popup — it catches someone about to leave instead of
     interrupting them mid-read. A time-delay fallback covers touch
     devices, where exit-intent can't fire. */
const SUBSCRIBED_KEY = "kidslab_subscribed";
const DISMISSED_UNTIL_KEY = "kidslab_subscribe_dismissed_until";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const ARM_EXIT_INTENT_AFTER_MS = 4000; // let the visitor settle in first
const FALLBACK_SHOW_AFTER_MS = 20000; // covers touch devices with no exit-intent

export default function SubscribePopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (localStorage.getItem(SUBSCRIBED_KEY)) return;
    const dismissedUntil = Number(localStorage.getItem(DISMISSED_UNTIL_KEY) ?? 0);
    if (dismissedUntil > Date.now()) return;

    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      setOpen(true);
    };

    const fallbackId = setTimeout(show, FALLBACK_SHOW_AFTER_MS);

    function onMouseOut(e: MouseEvent) {
      if (e.relatedTarget !== null) return; // only true "leaving the window" events
      if (e.clientY > 0) return; // only exits toward the top edge
      show();
    }

    const armId = setTimeout(() => {
      document.addEventListener("mouseout", onMouseOut);
    }, ARM_EXIT_INTENT_AFTER_MS);

    return () => {
      clearTimeout(fallbackId);
      clearTimeout(armId);
      document.removeEventListener("mouseout", onMouseOut);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_COOLDOWN_MS));
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      localStorage.setItem(SUBSCRIBED_KEY, "1");
      setSuccess(true);
    } else {
      setError(data.error ?? "Something went wrong. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) dismiss(); }}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-2rem)] sm:max-w-md w-full rounded-3xl p-0 gap-0 ring-0 overflow-hidden bg-transparent"
      >
        <DialogClose
          data-slot="dialog-close"
          className="absolute top-3 right-3 z-20 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-slate-600 shadow-md size-8 transition-colors"
        >
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        {success ? (
          <div className="bg-white px-8 py-12 text-center">
            <div className="rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5 w-14 h-14">
              <CheckCircle className="text-green-500 w-7 h-7" />
            </div>
            <h2 className="text-display-md" style={{ color: "var(--brand-navy)" }}>
              You&apos;re on the list!
            </h2>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">
              We&apos;ll email you with programme updates and seminar dates.
            </p>
          </div>
        ) : (
          <div className="pcb-card bg-white">
            {/* Header strip */}
            <div
              className="px-8 pt-8 pb-6 relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, var(--brand-navy) 0%, #123a2a 50%, #0d2560 100%)",
              }}
            >
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full border border-white/10 pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3 mb-3">
                <div className="bg-white rounded-xl p-1.5 shrink-0">
                  <Image src="/logo.png" alt="kidslab.lk" width={36} height={36} className="rounded-lg object-contain" />
                </div>
                <span className="font-bold text-white tracking-tight text-lg">
                  kid<span style={{ color: "var(--brand-red)" }}>s</span>lab.lk
                </span>
              </div>
              <h2 className="relative z-10 text-display-md text-white">
                Stay in the loop
              </h2>
              <p className="relative z-10 text-white/70 text-sm mt-1.5 leading-relaxed">
                Subscribe for seminar dates, new programmes, and updates — no spam.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 pt-6 flex flex-col gap-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder="you@email.com"
                  className="pl-9 border-slate-200 text-sm h-11"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="btn-brand-copper w-full text-white font-semibold h-11 rounded-full text-sm"
              >
                {loading ? "Subscribing…" : "Subscribe for Updates"}
              </Button>

              <button
                type="button"
                onClick={dismiss}
                className="text-center text-slate-400 text-xs hover:text-slate-600 transition-colors pt-1"
              >
                Maybe later
              </button>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
