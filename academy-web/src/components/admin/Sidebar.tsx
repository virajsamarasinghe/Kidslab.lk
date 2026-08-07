"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard, Users, BookOpen, LogOut, Mail,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",       href: "/admin",             icon: LayoutDashboard },
  { label: "Users",           href: "/admin/users",       icon: Users },
  { label: "Courses",         href: "/admin/courses",     icon: BookOpen },
  { label: "Subscribers",     href: "/admin/subscribers", icon: Mail },
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
      className="fixed inset-y-0 left-0 w-60 flex flex-col z-40"
      style={{
        background:
          "linear-gradient(180deg, var(--brand-navy) 0%, #123a2a 55%, #0d2560 100%)",
      }}
    >
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
        <div
          className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 p-1"
          style={{ border: "2px solid var(--brand-yellow)" }}
        >
          <Image src="/logo.png" alt="logo" width={32} height={32} className="w-full h-full object-contain rounded-sm" />
        </div>
        <div>
          <p
            className="text-white font-bold text-sm leading-none tracking-tight"
            style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
          >
            kid<span style={{ color: "var(--brand-red)" }}>s</span>lab.lk
          </p>
          <p className="text-slate-500 text-[10px] mt-1 font-medium tracking-widest uppercase">Admin</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <a
              key={href}
              href={href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
              style={active ? { backgroundColor: "var(--brand-red)" } : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </a>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
