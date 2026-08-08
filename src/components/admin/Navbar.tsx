"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Menu, PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronRight, UserCog, LogOut, ShieldCheck } from "lucide-react";
import { useAdminProfile } from "./AdminProfileContext";
import { breadcrumbFor } from "./nav-config";

export default function AdminNavbar({
  collapsed,
  onToggleCollapsed,
  onOpenMobile,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onOpenMobile: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const profile = useAdminProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const trail = breadcrumbFor(pathname);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header
      className="h-16 shrink-0 sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-6 border-b"
      style={{ backgroundColor: "var(--brand-paper)", borderColor: "rgba(15,36,24,0.08)" }}
    >
      <button
        onClick={onOpenMobile}
        className="lg:hidden text-slate-500 hover:text-slate-900 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <button
        onClick={onToggleCollapsed}
        className="hidden lg:flex text-slate-500 hover:text-slate-900 transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
      </button>

      <nav aria-label="Breadcrumb" className="hidden sm:flex flex-1 items-center gap-1.5 text-sm min-w-0">
        <a href="/admin" className="text-slate-400 hover:text-slate-700 transition-colors shrink-0 font-medium">
          Admin
        </a>
        {trail.map((crumb, i) => {
          const isLast = i === trail.length - 1;
          return (
            <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              {isLast ? (
                <span className="text-slate-800 font-semibold truncate">{crumb.label}</span>
              ) : (
                <a href={crumb.href} className="text-slate-400 hover:text-slate-700 transition-colors truncate font-medium">
                  {crumb.label}
                </a>
              )}
            </span>
          );
        })}
      </nav>
      <div className="flex-1 sm:hidden" />

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-full hover:bg-black/[0.04] transition-colors"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--brand-red), var(--brand-yellow))" }}
          >
            {profile.avatar ? (
              <Image src={profile.avatar} alt={profile.name} width={32} height={32} className="w-full h-full object-cover" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-white" />
            )}
          </div>
          <span className="hidden sm:block text-sm font-semibold text-slate-800 max-w-[10rem] truncate">
            {profile.name || "Administrator"}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.14 }}
              className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-100 bg-white shadow-xl overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900 truncate">{profile.name || "Administrator"}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{profile.email}</p>
              </div>
              <div className="p-1.5">
                <a
                  href="/admin/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <UserCog className="w-4 h-4" />
                  Edit Profile
                </a>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
