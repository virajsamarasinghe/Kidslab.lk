"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle, Star, Users, Clock, BadgeCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { useRegisterModalState } from "@/lib/register-modal-context";

export default function RegisterModal() {
  const { open, setOpen } = useRegisterModalState();
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    age: "", parentName: "", city: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      // Reset after the close animation so the form is fresh next time it opens
      setTimeout(() => {
        setForm({ name: "", email: "", phone: "", age: "", parentName: "", city: "" });
        setError("");
        setSuccess(false);
        setLoading(false);
      }, 200);
    }
  }

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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-1.5rem)] sm:max-w-xl lg:max-w-4xl w-full max-h-[95dvh] overflow-hidden rounded-2xl p-0 gap-0 ring-0 bg-transparent"
      >
        <DialogClose
          data-slot="dialog-close"
          className="absolute top-2.5 right-2.5 z-20 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-slate-600 shadow-md size-7 transition-colors"
        >
          <X className="size-3.5" />
          <span className="sr-only">Close</span>
        </DialogClose>

        {success ? (
          /* ── Success screen ── */
          <div
            className="flex items-center justify-center px-6 py-10 rounded-2xl"
            style={{ background: "linear-gradient(135deg, #f0f2f8 0%, #fff 60%)" }}
          >
            <div className="text-center max-w-sm">
              <div className="rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 shadow-sm size-12">
                <CheckCircle className="text-green-500 size-6" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight mb-2" style={{ color: "var(--brand-navy)" }}>
                You&apos;re Registered!
              </h2>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Welcome to{" "}
                <span style={{ color: "var(--brand-navy)" }}>
                  kid<span style={{ color: "var(--brand-red)" }}>s</span>lab.lk
                </span>
                ! Our team will contact you shortly to confirm your seminar details.
              </p>
              <Button
                onClick={() => handleOpenChange(false)}
                className="text-white rounded-full font-semibold h-10 px-8 text-sm"
                style={{ backgroundColor: "var(--brand-navy)" }}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* ── Form ── */
          <div className="flex flex-col lg:flex-row rounded-2xl overflow-hidden max-h-[95dvh]">

            {/* ══ Left panel — hidden on small screens to keep the form on one screen ══ */}
            <div
              className="hidden lg:flex lg:w-[36%] flex-col justify-between relative overflow-hidden shrink-0"
              style={{
                padding: "1.75rem",
                background: "linear-gradient(145deg, var(--brand-navy) 0%, #123a2a 50%, #0d2560 100%)",
              }}
            >
              {/* Decorative rings */}
              <div className="absolute -right-20 -top-20 rounded-full border border-white/10 pointer-events-none size-64" />
              <div className="absolute -right-8 -bottom-24 rounded-full border border-white/10 pointer-events-none size-80" />

              <div className="relative z-10">
                {/* Logo + brand name */}
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="bg-white rounded-lg shadow-md p-1">
                    <Image
                      src="/logo.png"
                      alt="kidslab.lk"
                      width={40}
                      height={40}
                      className="rounded-md object-contain size-8"
                    />
                  </div>
                  <span className="font-bold text-white tracking-tight text-base">
                    kid<span style={{ color: "var(--brand-red)" }}>s</span>lab.lk
                  </span>
                </div>

                {/* Heading */}
                <h1 className="text-[1.75rem] font-extrabold leading-[1.1] tracking-tight text-white">
                  Register for
                  <br />
                  <span style={{ color: "#a8bcde" }}>Free Seminar</span>
                </h1>

                <p className="text-sm text-white/65 leading-relaxed mt-3">
                  Your child&apos;s journey into Robotics &amp; AI starts with a free,
                  no-commitment introductory seminar.
                </p>

                {/* Highlights */}
                <div className="mt-5 space-y-2.5">
                  {[
                    { icon: Star,       text: "Day 1 is completely FREE — no obligation" },
                    { icon: Users,      text: "Ages 9–14 · small group classes" },
                    { icon: Clock,      text: "3-month program · flexible schedule" },
                    { icon: BadgeCheck, text: "LKR 5,000 · pay in installments" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-start gap-2.5">
                      <div className="rounded-lg bg-white/10 flex items-center justify-center shrink-0 size-6 mt-0.5">
                        <Icon className="text-white/80 size-3.5" />
                      </div>
                      <p className="text-[13px] text-white/75 leading-snug pt-0.5">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* University credit */}
              <div className="relative z-10 border-t border-white/10 mt-5 pt-3">
                <p className="text-white/45 leading-relaxed text-[11px]">
                  Conducted by Computer Engineers
                  <br />
                  <span className="text-white/65 font-semibold">
                    University of Ruhuna · Faculty of Engineering
                  </span>
                </p>
              </div>
            </div>

            {/* ══ Right panel: form ══ */}
            <div className="flex-1 bg-white overflow-y-auto p-5 sm:p-6 lg:p-7">
              <div className="w-full">

                {/* Form header */}
                <div className="mb-4">
                  <h2 className="text-lg font-extrabold tracking-tight" style={{ color: "var(--brand-navy)" }}>
                    Register for Free Seminar
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Fill in the details below — takes less than a minute.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  {/* Student name */}
                  <div>
                    <Label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                      Student Full Name <span style={{ color: "var(--brand-red)" }}>*</span>
                    </Label>
                    <Input
                      placeholder="Kavindu Perera"
                      className="border-slate-200 w-full h-10 text-sm"
                      value={form.name} onChange={set("name")} required
                    />
                  </div>

                  {/* Phone + Age */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                        Phone <span style={{ color: "var(--brand-red)" }}>*</span>
                      </Label>
                      <Input
                        placeholder="07X XXX XXXX"
                        className="border-slate-200 w-full h-10 text-sm"
                        value={form.phone} onChange={set("phone")} required
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                        Student Age <span style={{ color: "var(--brand-red)" }}>*</span>
                      </Label>
                      <Input
                        type="number" placeholder="12" min={5} max={20}
                        className="border-slate-200 w-full h-10 text-sm"
                        value={form.age} onChange={set("age")} required
                      />
                    </div>
                  </div>

                  {/* Email + Parent (paired to save a row) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                        Email Address
                      </Label>
                      <Input
                        type="email" placeholder="you@email.com"
                        className="border-slate-200 w-full h-10 text-sm"
                        value={form.email} onChange={set("email")}
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                        Parent / Guardian
                      </Label>
                      <Input
                        placeholder="Sunil Perera"
                        className="border-slate-200 w-full h-10 text-sm"
                        value={form.parentName} onChange={set("parentName")}
                      />
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <Label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                      City / District
                    </Label>
                    <Input
                      placeholder="Galle"
                      className="border-slate-200 w-full h-10 text-sm"
                      value={form.city} onChange={set("city")}
                    />
                  </div>

                  {/* Fixed program chip */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between px-3.5 py-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Program</p>
                      <p className="font-semibold text-sm mt-0.5" style={{ color: "var(--brand-navy)" }}>
                        Robotics &amp; AI
                      </p>
                    </div>
                    <span
                      className="font-semibold rounded-full text-white text-[11px] px-3 py-1"
                      style={{ backgroundColor: "var(--brand-red)" }}
                    >
                      Enrolling Now
                    </span>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm px-3 py-2">
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="btn-brand-copper w-full text-white shadow-md transition-all h-11 text-sm font-bold rounded-full"
                  >
                    {loading ? "Submitting…" : "Register for Free Seminar →"}
                  </Button>

                  <p className="text-center text-slate-400 text-[11px]">
                    By registering you agree to be contacted by our team. No spam.
                  </p>
                </form>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
