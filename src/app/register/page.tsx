"use client";

// Page-level metadata is exported from the companion server module
// (Next.js ignores `export const metadata` in "use client" files —
//  set title/description via the parent layout or a separate layout.tsx)

import { useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle, ArrowLeft, Star, Users, Clock, BadgeCheck } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const { isSignedIn, user } = useUser();
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    age: "", parentName: "", city: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pre-fill from the signed-in Clerk account so returning users don't retype it.
  useEffect(() => {
    if (isSignedIn && user) {
      const email = user.primaryEmailAddress?.emailAddress ?? "";
      const name = user.fullName ?? "";
      setForm(f => ({
        ...f,
        email: email || f.email,
        name: f.name || name,
      }));
    }
  }, [isSignedIn, user]);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        age: Number(form.age),
        interestedCourse: "Robotics & AI",
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setSuccess(true);
    else setError(data.error ?? "Registration failed. Please try again.");
  }

  /* ── Success screen ── */
  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: "linear-gradient(135deg, #f0f2f8 0%, #fff 60%)" }}
      >
        <div className="text-center" style={{ maxWidth: "clamp(24rem, 40vw, 48rem)" }}>
          <div
            className="rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 shadow-sm"
            style={{ width: "clamp(4rem, 6vw, 8rem)", height: "clamp(4rem, 6vw, 8rem)" }}
          >
            <CheckCircle
              className="text-green-500"
              style={{ width: "clamp(2rem, 3vw, 4rem)", height: "clamp(2rem, 3vw, 4rem)" }}
            />
          </div>
          <h2 className="reg-form-heading mb-3" style={{ color: "var(--brand-navy)" }}>
            You&apos;re Registered!
          </h2>
          <p className="reg-body text-slate-500 mb-8">
            Welcome to{" "}
            <span style={{ color: "var(--brand-navy)" }}>
              kid<span style={{ color: "var(--brand-red)" }}>s</span>lab.lk
            </span>
            ! Our team will contact you shortly to confirm your seminar details.
          </p>
          <a href="/">
            <Button
              className="text-white rounded-full font-semibold"
              style={{
                backgroundColor: "var(--brand-navy)",
                height: "clamp(2.75rem, 3.5vw, 4.5rem)",
                fontSize: "clamp(0.9rem, 1.1vw, 1.375rem)",
                padding: "0 clamp(1.5rem, 2.5vw, 3.5rem)",
              }}
            >
              <ArrowLeft style={{ width: "clamp(1rem, 1.2vw, 1.5rem)", height: "clamp(1rem, 1.2vw, 1.5rem)", marginRight: "0.5rem" }} />
              Back to Home
            </Button>
          </a>
        </div>
      </div>
    );
  }

  /* ── Main page ── */
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://kidslab.lk" },
              { "@type": "ListItem", position: 2, name: "Register", item: "https://kidslab.lk/register" },
            ],
          }),
        }}
      />

      {/* ══ Left panel ══ */}
      <div
        className="lg:w-[42%] xl:w-[40%] 2xl:w-[38%] flex flex-col justify-between relative overflow-hidden"
        style={{
          padding: "clamp(2rem, 4vw, 5rem)",
          background: "linear-gradient(145deg, var(--brand-navy) 0%, #123a2a 50%, #0d2560 100%)",
        }}
      >
        {/* Decorative rings */}
        <div className="absolute -right-24 -top-24 rounded-full border border-white/10 pointer-events-none"
          style={{ width: "clamp(16rem, 30vw, 44rem)", height: "clamp(16rem, 30vw, 44rem)" }} />
        <div className="absolute -right-10 -bottom-32 rounded-full border border-white/10 pointer-events-none"
          style={{ width: "clamp(20rem, 36vw, 52rem)", height: "clamp(20rem, 36vw, 52rem)" }} />

        <div className="relative z-10">
          {/* Back link */}
          <a
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            style={{ fontSize: "clamp(0.8rem, 0.9vw, 1.125rem)", marginBottom: "clamp(2rem, 3.5vw, 4rem)" }}
          >
            <ArrowLeft style={{ width: "clamp(1rem, 1.1vw, 1.375rem)", height: "clamp(1rem, 1.1vw, 1.375rem)" }} />
            Back to Home
          </a>

          {/* Logo + brand name */}
          <div
            className="flex items-center"
            style={{ gap: "clamp(0.75rem, 1vw, 1.5rem)", marginBottom: "clamp(2rem, 3vw, 4rem)" }}
          >
            <div className="bg-white rounded-xl shadow-md" style={{ padding: "clamp(0.3rem, 0.5vw, 0.75rem)" }}>
              <Image
                src="/logo.png"
                alt="kidslab.lk"
                width={80}
                height={80}
                className="rounded-lg object-contain"
                style={{ width: "clamp(2.5rem, 3.5vw, 5rem)", height: "clamp(2.5rem, 3.5vw, 5rem)" }}
              />
            </div>
            <span
              className="font-bold text-white tracking-tight"
              style={{ fontSize: "clamp(1rem, 1.4vw, 2rem)" }}
            >
              kid<span style={{ color: "var(--brand-red)" }}>s</span>lab.lk
            </span>
          </div>

          {/* Heading */}
          <h1 className="reg-panel-heading text-white">
            Register for
            <br />
            <span style={{ color: "#a8bcde" }}>Free Seminar</span>
          </h1>

          <p
            className="reg-body text-white/65"
            style={{ marginTop: "clamp(0.75rem, 1.2vw, 1.75rem)" }}
          >
            Your child&apos;s journey into Robotics &amp; AI starts with a free,
            no-commitment introductory seminar.
          </p>

          {/* Highlights */}
          <div style={{ marginTop: "clamp(1.5rem, 2.5vw, 3.5rem)" }}>
            {[
              { icon: Star,       text: "Day 1 is completely FREE — no obligation" },
              { icon: Users,      text: "Ages 9–14 · small group classes" },
              { icon: Clock,      text: "3-month program · flexible schedule" },
              { icon: BadgeCheck, text: "LKR 5,000 · pay in installments" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-start"
                style={{ gap: "clamp(0.75rem, 1vw, 1.5rem)", marginBottom: "clamp(0.875rem, 1.2vw, 1.75rem)" }}
              >
                <div
                  className="rounded-xl bg-white/10 flex items-center justify-center shrink-0"
                  style={{
                    width:  "clamp(2rem, 2.8vw, 3.5rem)",
                    height: "clamp(2rem, 2.8vw, 3.5rem)",
                    marginTop: "0.125rem",
                  }}
                >
                  <Icon style={{ width: "clamp(1rem, 1.2vw, 1.5rem)", height: "clamp(1rem, 1.2vw, 1.5rem)" }} className="text-white/80" />
                </div>
                <p className="reg-body text-white/75" style={{ paddingTop: "clamp(0.2rem, 0.4vw, 0.5rem)" }}>
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* University credit */}
        <div
          className="relative z-10 border-t border-white/10"
          style={{ marginTop: "clamp(2rem, 3.5vw, 5rem)", paddingTop: "clamp(1.25rem, 2vw, 3rem)" }}
        >
          <p className="text-white/45 leading-relaxed" style={{ fontSize: "clamp(0.65rem, 0.75vw, 1rem)" }}>
            Conducted by Computer Engineers
            <br />
            <span className="text-white/65 font-semibold">
              University of Ruhuna · Faculty of Engineering
            </span>
          </p>
        </div>
      </div>

      {/* ══ Right panel: form ══ */}
      <div
        className="flex-1 flex items-center justify-center bg-white"
        style={{ padding: "clamp(3rem, 5vw, 6rem) clamp(1.5rem, 5vw, 6rem)" }}
      >
        <div className="w-full" style={{ maxWidth: "clamp(22rem, 38vw, 52rem)" }}>

          {/* Form header */}
          <div style={{ marginBottom: "clamp(1.5rem, 2.5vw, 3.5rem)" }}>
            <h2 className="reg-form-heading" style={{ color: "var(--brand-navy)" }}>
              Student Details
            </h2>
            <p className="reg-body text-slate-400" style={{ marginTop: "clamp(0.25rem, 0.5vw, 0.75rem)" }}>
              Fill in the details below — takes less than a minute.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "clamp(1rem, 1.5vw, 2rem)" }}
          >
            {/* Student name */}
            <div>
              <Label className="reg-label text-slate-500 block" style={{ marginBottom: "clamp(0.3rem, 0.5vw, 0.75rem)" }}>
                Student Full Name{" "}
                <span style={{ color: "var(--brand-red)" }}>*</span>
              </Label>
              <Input
                placeholder="Kavindu Perera"
                className="reg-input border-slate-200 w-full"
                value={form.name} onChange={set("name")} required
              />
            </div>

            {/* Phone + Age */}
            <div className="grid grid-cols-2" style={{ gap: "clamp(0.75rem, 1.2vw, 1.75rem)" }}>
              <div>
                <Label className="reg-label text-slate-500 block" style={{ marginBottom: "clamp(0.3rem, 0.5vw, 0.75rem)" }}>
                  Phone <span style={{ color: "var(--brand-red)" }}>*</span>
                </Label>
                <Input
                  placeholder="07X XXX XXXX"
                  className="reg-input border-slate-200 w-full"
                  value={form.phone} onChange={set("phone")} required
                />
              </div>
              <div>
                <Label className="reg-label text-slate-500 block" style={{ marginBottom: "clamp(0.3rem, 0.5vw, 0.75rem)" }}>
                  Student Age <span style={{ color: "var(--brand-red)" }}>*</span>
                </Label>
                <Input
                  type="number" placeholder="12" min={5} max={20}
                  className="reg-input border-slate-200 w-full"
                  value={form.age} onChange={set("age")} required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <Label className="reg-label text-slate-500 block" style={{ marginBottom: "clamp(0.3rem, 0.5vw, 0.75rem)" }}>
                Email Address
              </Label>
              <Input
                type="email" placeholder="you@email.com"
                className="reg-input border-slate-200 w-full"
                value={form.email} onChange={set("email")}
              />
            </div>

            {/* Parent + City */}
            <div className="grid grid-cols-2" style={{ gap: "clamp(0.75rem, 1.2vw, 1.75rem)" }}>
              <div>
                <Label className="reg-label text-slate-500 block" style={{ marginBottom: "clamp(0.3rem, 0.5vw, 0.75rem)" }}>
                  Parent / Guardian
                </Label>
                <Input
                  placeholder="Sunil Perera"
                  className="reg-input border-slate-200 w-full"
                  value={form.parentName} onChange={set("parentName")}
                />
              </div>
              <div>
                <Label className="reg-label text-slate-500 block" style={{ marginBottom: "clamp(0.3rem, 0.5vw, 0.75rem)" }}>
                  City / District
                </Label>
                <Input
                  placeholder="Galle"
                  className="reg-input border-slate-200 w-full"
                  value={form.city} onChange={set("city")}
                />
              </div>
            </div>

            {/* Fixed program chip */}
            <div
              className="rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between"
              style={{ padding: "clamp(0.75rem, 1.2vw, 1.75rem) clamp(1rem, 1.5vw, 2.25rem)" }}
            >
              <div>
                <p className="reg-label text-slate-400">Program</p>
                <p
                  className="font-semibold"
                  style={{ color: "var(--brand-navy)", fontSize: "clamp(0.9rem, 1.1vw, 1.375rem)", marginTop: "0.125rem" }}
                >
                  Robotics &amp; AI
                </p>
              </div>
              <span
                className="font-semibold rounded-full text-white"
                style={{
                  backgroundColor: "var(--brand-red)",
                  fontSize: "clamp(0.65rem, 0.75vw, 1rem)",
                  padding: "clamp(0.2rem, 0.4vw, 0.6rem) clamp(0.65rem, 1vw, 1.5rem)",
                }}
              >
                Enrolling Now
              </span>
            </div>

            {/* Error */}
            {error && (
              <div
                className="bg-red-50 border border-red-200 text-red-600 rounded-xl"
                style={{ fontSize: "clamp(0.8rem, 0.9vw, 1.125rem)", padding: "clamp(0.75rem, 1vw, 1.5rem)" }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="reg-btn btn-brand-copper w-full text-white shadow-md transition-all"
            >
              {loading ? "Submitting…" : "Register for Free Seminar →"}
            </Button>

            <p
              className="text-center text-slate-400"
              style={{ fontSize: "clamp(0.65rem, 0.75vw, 1rem)", paddingTop: "0.25rem" }}
            >
              By registering you agree to be contacted by our team. No spam.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
