"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "motion/react";
import {
  LayoutDashboard, Users, BookOpen, LogOut, Mail, ShieldCheck, UserRound,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",       href: "/admin",              icon: LayoutDashboard },
  { label: "Users",           href: "/admin/users",        icon: Users },
  { label: "Courses",         href: "/admin/courses",      icon: BookOpen },
  { label: "Instructors",     href: "/admin/instructors",  icon: UserRound },
  { label: "Subscribers",     href: "/admin/subscribers",  icon: Mail },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

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
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-5 relative shrink-0">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 p-1.5 shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-navy) 0%, #123a2a 50%, #0d2560 100%)",
            border: "2px solid var(--brand-yellow)",
          }}
        >
          <Image src="/logo.png" alt="logo" width={40} height={40} className="w-full h-full object-contain rounded-md" />
        </div>
        <div className="min-w-0">
          <p
            className="text-white font-bold text-sm leading-none tracking-tight truncate"
            style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
          >
            kid<span style={{ color: "var(--brand-red)" }}>s</span>lab.lk
          </p>
          <p className="text-slate-500 text-[10px] mt-1.5 font-semibold tracking-[0.15em] uppercase">Admin Panel</p>
        </div>
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
