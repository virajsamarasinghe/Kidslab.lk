"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "motion/react";
import {
  Eye, EyeOff, Lock, Mail, ArrowRight, Users, BookOpen, BarChart3, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const highlights = [
  { icon: Users,     label: "Track every student registration in real time" },
  { icon: BookOpen,  label: "Manage programs, instructors & schedules" },
  { icon: BarChart3, label: "See growth trends at a glance" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      router.push("/admin");
    } else {
      setError(data.error ?? "Login failed");
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--brand-paper)" }}>
      {/* ── Left — brand panel ── */}
      <div
        className="hidden lg:flex lg:w-[46%] relative flex-col justify-between overflow-hidden px-12 py-12"
        style={{
          background: "linear-gradient(160deg, var(--brand-navy) 0%, #123a2a 55%, #0d2560 100%)",
        }}
      >
        {/* PCB grid backdrop */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, var(--brand-red), transparent 70%)", opacity: 0.18 }}
        />
        <div
          className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, var(--brand-blue), transparent 70%)", opacity: 0.2 }}
        />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <div className="inline-flex bg-white rounded-xl shadow-lg px-4 py-2.5">
            <Image src="/logo.png" alt="kidslab.lk" width={301} height={121} className="h-8 w-auto object-contain" priority />
          </div>
        </motion.div>

        {/* Headline + highlights */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative z-10"
        >
          <h1
            className="text-white font-bold leading-tight mb-4"
            style={{
              fontSize: "clamp(1.75rem, 2.6vw, 2.5rem)",
              fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif",
            }}
          >
            Everything your academy needs, in one dashboard.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
            Sign in to manage students, courses, instructors and enrollment — all in real time.
          </p>
          <div className="space-y-3.5">
            {highlights.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </span>
                <span className="text-slate-300 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer credit */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative z-10 flex items-center gap-2 text-slate-500 text-xs"
        >
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: "var(--brand-yellow)" }} />
          University of Ruhuna · Faculty of Engineering
        </motion.div>
      </div>

      {/* ── Right — form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        {/* Mobile-only brand mark */}
        <div className="lg:hidden absolute top-8 left-1/2 -translate-x-1/2">
          <div className="bg-white rounded-lg shadow-sm px-3 py-2 inline-flex">
            <Image src="/logo.png" alt="kidslab.lk" width={301} height={121} className="h-6 w-auto object-contain" />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[380px]"
        >
          <div className="mb-8">
            <h2
              className="text-2xl font-bold text-slate-900 tracking-tight"
              style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
            >
              Welcome back
            </h2>
            <p className="text-slate-500 text-sm mt-1.5">Sign in to access the admin dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder="admin@kidslab.lk"
                  className="pl-9 border-slate-200 text-sm h-11 rounded-xl"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-10 border-slate-200 text-sm h-11 rounded-xl"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="btn-brand-navy w-full text-white font-semibold h-11 rounded-full text-sm tracking-[-0.01em] shadow-sm gap-1.5"
            >
              {loading ? "Signing in…" : "Sign In to Dashboard"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8 lg:hidden">
            University of Ruhuna · Faculty of Engineering
          </p>
        </motion.div>
      </div>
    </div>
  );
}
