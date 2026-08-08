"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, Users, BookOpen, LogOut, Mail, ShieldCheck, UserRound,
  Settings, ChevronDown, Send, BrainCircuit, Layers3,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",       href: "/admin",              icon: LayoutDashboard },
  { label: "Users",           href: "/admin/users",        icon: Users },
  { label: "Courses",         href: "/admin/courses",      icon: BookOpen },
  { label: "Instructors",     href: "/admin/instructors",  icon: UserRound },
  { label: "Subscribers",     href: "/admin/subscribers",  icon: Mail },
];

const settingsItems = [
  { label: "Brevo Email",       href: "/admin/settings/brevo",     icon: Send },
  { label: "LLM Config",        href: "/admin/settings/llm",       icon: BrainCircuit },
  { label: "Embedding Model",   href: "/admin/settings/embedding", icon: Layers3 },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const inSettings = pathname.startsWith("/admin/settings");
  const [settingsOpen, setSettingsOpen] = useState(inSettings);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside
      className="fixed inset-y-0 left-0 w-64 flex flex-col z-40 border-r border-white/5"
      style={{
        background:
          "linear-gradient(180deg, var(--brand-navy) 0%, #123a2a 55%, #0d2560 100%)",
      }}
    >
      {/* Brand — the logo is a wide wordmark on its own white plate, so it
          gets a white panel sized to its real aspect ratio rather than
          being squashed into a square dark badge. */}
      <div className="h-16 flex items-center px-5 relative shrink-0">
        <div className="bg-white rounded-lg shadow-sm px-2.5 py-1.5 flex items-center">
          <Image src="/logo.png" alt="kidslab.lk" width={301} height={121} className="h-7 w-auto object-contain" priority />
        </div>
        <p className="text-slate-500 text-[10px] ml-2.5 font-semibold tracking-[0.15em] uppercase">Admin</p>
        {/* Bottom edge trace */}
        <div
          className="absolute bottom-0 left-5 right-5 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, color-mix(in srgb, var(--brand-yellow) 45%, transparent) 50%, transparent)",
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-6 pb-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-bold tracking-[0.18em] uppercase text-slate-500">
          Menu
        </p>
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <a
              key={href}
              href={href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                active
                  ? "text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="admin-nav-active"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-xl shadow-[0_4px_16px_-2px_rgba(224,138,60,0.5)]"
                  style={{ backgroundColor: "var(--brand-red)" }}
                />
              )}
              <span
                className={`relative z-10 flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors ${
                  active ? "bg-white/15" : "bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </span>
              <span className="relative z-10">{label}</span>
              {active && (
                <span className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </a>
          );
        })}

        {/* Settings — collapsible group */}
        <button
          onClick={() => setSettingsOpen(o => !o)}
          className={`w-full relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
            inSettings && !settingsOpen
              ? "text-white"
              : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
          }`}
        >
          {inSettings && !settingsOpen && (
            <motion.span
              layoutId="admin-nav-active"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="absolute inset-0 rounded-xl shadow-[0_4px_16px_-2px_rgba(224,138,60,0.5)]"
              style={{ backgroundColor: "var(--brand-red)" }}
            />
          )}
          <span
            className={`relative z-10 flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors ${
              inSettings ? "bg-white/15" : "bg-white/5"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
          </span>
          <span className="relative z-10">Settings</span>
          <ChevronDown
            className={`relative z-10 ml-auto w-3.5 h-3.5 transition-transform duration-200 ${settingsOpen ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {settingsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden pl-3"
            >
              <div className="border-l border-white/10 ml-4 pl-3 py-1 space-y-0.5">
                {settingsItems.map(({ label, href, icon: Icon }) => {
                  const active = pathname === href;
                  return (
                    <a
                      key={href}
                      href={href}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                        active
                          ? "text-white bg-white/10"
                          : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      {label}
                    </a>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Admin identity + Logout */}
      <div className="px-3 pb-4 pt-3 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/[0.04]">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, var(--brand-red), var(--brand-yellow))" }}
          >
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold leading-none truncate">Administrator</p>
            <p className="text-slate-500 text-[10px] mt-1 truncate">Full access</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
