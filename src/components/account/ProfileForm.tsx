"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ProfileValues {
  phone: string;
  parentName: string;
  city: string;
  age: number;
}

interface Props {
  initial: ProfileValues;
  /** Clerk-owned, shown read-only with a link into Clerk's own profile modal. */
  name: string;
  email: string;
}

/**
 * The academy-specific half of a visitor's profile.
 *
 * Name, email, password and 2FA are Clerk's — editing them here would mean
 * writing to MongoDB while Clerk kept the real values, so those fields are
 * read-only and hand off to Clerk's own dialog instead.
 */
export default function ProfileForm({ initial, name, email }: Props) {
  const { openUserProfile } = useClerk();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const set =
    (k: keyof ProfileValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setSaved(false);
      setForm((f) => ({
        ...f,
        [k]: k === "age" ? Number(e.target.value) : e.target.value,
      }));
    };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, age: Number(form.age) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Could not save your details.");
      else setSaved(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Clerk-owned identity ── */}
      <section className="rounded-2xl border border-slate-100 bg-white p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold" style={{ color: "var(--brand-navy)" }}>
              Sign-in details
            </h2>
            <p className="mt-0.5 text-sm text-slate-400">
              Your name, email, password and two-factor settings.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 rounded-full"
            onClick={() => openUserProfile()}
          >
            Manage
          </Button>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Account name
            </dt>
            <dd className="mt-1 text-sm text-slate-700">{name || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Email
            </dt>
            <dd className="mt-1 text-sm text-slate-700">{email}</dd>
          </div>
        </dl>
      </section>

      {/* ── Academy details ── */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-100 bg-white p-6">
        <h2 className="font-semibold" style={{ color: "var(--brand-navy)" }}>
          Student &amp; contact details
        </h2>
        <p className="mt-0.5 mb-5 text-sm text-slate-400">
          How we reach you about classes, and who&apos;s attending.
        </p>

        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-slate-500">Phone</Label>
              <Input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Ex: 077 123 4567"
                className="border-slate-200"
                value={form.phone}
                onChange={set("phone")}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-slate-500">Student age</Label>
              <Input
                type="number"
                inputMode="numeric"
                min={5}
                max={20}
                placeholder="Ex: 12"
                className="border-slate-200"
                value={form.age || ""}
                onChange={set("age")}
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-slate-500">Parent / Guardian</Label>
              <Input
                autoComplete="name"
                autoCapitalize="words"
                placeholder="Ex: Sunil Perera"
                className="border-slate-200"
                value={form.parentName}
                onChange={set("parentName")}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-slate-500">City / District</Label>
              <Input
                autoComplete="address-level2"
                autoCapitalize="words"
                placeholder="Ex: Matara"
                className="border-slate-200"
                value={form.city}
                onChange={set("city")}
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Button
              type="submit"
              disabled={saving}
              className="btn-brand-copper rounded-full px-8 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <Check className="h-4 w-4" />
                Saved
              </span>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
