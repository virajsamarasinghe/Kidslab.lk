"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Lock, Mail, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div
      className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden"
      style={{ backgroundColor: "var(--brand-paper)" }}
    >
      {/* PCB layout grid — same signature backdrop as the marketing hero */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(var(--brand-blue) 1px, transparent 1px), linear-gradient(90deg, var(--brand-blue) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(var(--brand-red) 1.5px, transparent 1.5px)",
          backgroundSize: "68px 68px",
          backgroundPosition: "17px 17px",
        }}
      />

      <div className="w-full max-w-[400px] relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex w-16 h-16 rounded-2xl items-center justify-center shadow-lg mb-4 p-2.5"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-navy) 0%, #123a2a 50%, #0d2560 100%)",
              border: "2px solid var(--brand-yellow)",
            }}
          >
            <Image
              src="/logo.png"
              alt="kidslab.lk"
              width={64}
              height={64}
              className="w-full h-full object-contain rounded-md"
            />
          </div>
          <h1
            className="text-2xl font-bold text-slate-900 tracking-tight"
            style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
          >
            Admin Portal
          </h1>
          <p className="text-slate-500 text-sm mt-1"><span style={{ color: "var(--brand-navy)" }}>kid<span style={{ color: "var(--brand-red)" }}>s</span>lab.lk</span> · Management Dashboard</p>
        </div>

        {/* Card */}
        <div className="pcb-card bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/60 p-8">
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
                  className="pl-9 border-slate-200 text-sm h-11"
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
                  className="pl-9 pr-10 border-slate-200 text-sm h-11"
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
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="btn-brand-navy w-full text-white font-semibold h-11 rounded-full text-sm tracking-[-0.01em] shadow-sm"
            >
              {loading ? "Signing in…" : "Sign In to Dashboard"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          University of Ruhuna · Faculty of Engineering
        </p>
      </div>
    </div>
  );
}
