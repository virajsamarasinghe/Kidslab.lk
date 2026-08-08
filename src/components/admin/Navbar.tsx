"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu, PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronRight, UserCog, LogOut,
  ShieldCheck, Search, Bell, ExternalLink, Maximize2, Minimize2, House,
  Users, Mail, KanbanSquare, type LucideIcon,
} from "lucide-react";
import { useAdminProfile } from "./AdminProfileContext";
import { useAdminSummary } from "./AdminSummaryContext";
import { breadcrumbFor, type SummaryKey } from "./nav-config";
import CommandPalette from "./CommandPalette";

const NOTIFICATION_SOURCES: {
  key: SummaryKey;
  href: string;
  icon: LucideIcon;
  title: string;
  describe: (n: number) => string;
}[] = [
  { key: "users",       href: "/admin/users",        icon: Users,        title: "New users",       describe: n => `${n} account${n === 1 ? "" : "s"} registered` },
  { key: "leads",       href: "/admin/crm/pipeline", icon: KanbanSquare, title: "New leads",       describe: n => `${n} lead${n === 1 ? "" : "s"} awaiting follow-up` },
  { key: "subscribers", href: "/admin/subscribers",  icon: Mail,         title: "New subscribers", describe: n => `${n} newsletter signup${n === 1 ? "" : "s"}` },
];

/** Closes the popover whenever a click lands outside the wrapping element. */
function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onOutside]);
  return ref;
}

/* Browser-only reads, subscribed rather than mirrored into effect state so the
   server render stays deterministic (false) and hydration matches. */
const noopSubscribe = () => () => {};
const serverFalse = () => false;

function subscribeScroll(cb: () => void) {
  window.addEventListener("scroll", cb, { passive: true });
  return () => window.removeEventListener("scroll", cb);
}

function subscribeFullscreen(cb: () => void) {
  document.addEventListener("fullscreenchange", cb);
  return () => document.removeEventListener("fullscreenchange", cb);
}

const popover = {
  initial: { opacity: 0, y: -6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.98 },
  transition: { duration: 0.14, ease: "easeOut" as const },
};

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
  const summary = useAdminSummary();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Flat while at the top, subtly elevated once the page scrolls under it.
  const scrolled = useSyncExternalStore(subscribeScroll, () => window.scrollY > 4, serverFalse);
  const fullscreen = useSyncExternalStore(subscribeFullscreen, () => !!document.fullscreenElement, serverFalse);
  const isMac = useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent),
    serverFalse
  );

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeBell = useCallback(() => setBellOpen(false), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const menuRef = useClickOutside<HTMLDivElement>(closeMenu);
  const bellRef = useClickOutside<HTMLDivElement>(closeBell);

  const trail = breadcrumbFor(pathname);
  const notifications = NOTIFICATION_SOURCES.map(s => ({ ...s, count: summary[s.key] ?? 0 })).filter(n => n.count > 0);
  const totalNew = notifications.reduce((sum, n) => sum + n.count, 0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }, [router]);

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  }

  const iconButton =
    "flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-black/[0.05] transition-colors";

  return (
    <>
      <header
        className={`h-16 shrink-0 sticky top-0 z-30 flex items-center gap-1.5 px-3 sm:px-5 border-b backdrop-blur-xl transition-shadow duration-200 ${
          scrolled ? "shadow-[0_1px_16px_-6px_rgba(15,36,24,0.28)]" : ""
        }`}
        style={{
          backgroundColor: "color-mix(in srgb, var(--brand-paper) 82%, transparent)",
          borderColor: "rgba(15,36,24,0.08)",
        }}
      >
        <button onClick={onOpenMobile} className={`${iconButton} lg:hidden`} aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onToggleCollapsed}
          className={`${iconButton} hidden lg:flex`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="w-[18px] h-[18px]" /> : <PanelLeftClose className="w-[18px] h-[18px]" />}
        </button>

        <span className="hidden sm:block w-px h-6 bg-slate-900/10 mx-1.5" />

        <nav aria-label="Breadcrumb" className="hidden sm:flex flex-1 items-center gap-1 text-sm min-w-0">
          <a
            href="/admin"
            className="flex items-center gap-1.5 shrink-0 px-1.5 py-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-black/[0.04] transition-colors font-medium"
          >
            <House className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Admin</span>
          </a>
          {trail.map((crumb, i) => {
            const isLast = i === trail.length - 1;
            return (
              <span key={crumb.href} className="flex items-center gap-1 min-w-0">
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                {isLast ? (
                  <span className="px-1.5 py-1 text-slate-900 font-semibold truncate tracking-tight">{crumb.label}</span>
                ) : (
                  <a
                    href={crumb.href}
                    className="px-1.5 py-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-black/[0.04] transition-colors truncate font-medium"
                  >
                    {crumb.label}
                  </a>
                )}
              </span>
            );
          })}
        </nav>
        <div className="flex-1 sm:hidden" />

        {/* Command palette trigger — full search field on desktop, icon on mobile */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="hidden md:flex items-center gap-2 w-56 lg:w-64 h-9 pl-3 pr-2 rounded-xl border border-slate-900/10 bg-white/60 text-slate-400 hover:border-slate-900/20 hover:bg-white transition-colors"
          aria-label="Search"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className="text-[13px] font-medium">Search…</span>
          <kbd className="ml-auto text-[10px] font-semibold text-slate-400 border border-slate-200 bg-white rounded px-1.5 py-0.5">
            {isMac ? "⌘" : "Ctrl "}K
          </kbd>
        </button>
        <button onClick={() => setPaletteOpen(true)} className={`${iconButton} md:hidden`} aria-label="Search">
          <Search className="w-[18px] h-[18px]" />
        </button>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={`${iconButton} hidden sm:flex`}
          title="View public site"
          aria-label="View public site"
        >
          <ExternalLink className="w-[18px] h-[18px]" />
        </a>

        <button
          onClick={toggleFullscreen}
          className={`${iconButton} hidden lg:flex`}
          title={fullscreen ? "Exit full screen" : "Full screen"}
          aria-label={fullscreen ? "Exit full screen" : "Full screen"}
        >
          {fullscreen ? <Minimize2 className="w-[18px] h-[18px]" /> : <Maximize2 className="w-[18px] h-[18px]" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen(o => !o)}
            className={`${iconButton} relative`}
            aria-label={totalNew > 0 ? `Notifications, ${totalNew} new` : "Notifications"}
            aria-expanded={bellOpen}
          >
            <Bell className="w-[18px] h-[18px]" />
            {totalNew > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[9px] font-bold ring-2"
                style={{
                  backgroundColor: "var(--brand-red)",
                  color: "#fff",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ["--tw-ring-color" as any]: "var(--brand-paper)",
                }}
              >
                {totalNew > 9 ? "9+" : totalNew}
              </span>
            )}
          </button>

          <AnimatePresence>
            {bellOpen && (
              <motion.div
                {...popover}
                className="absolute right-0 mt-2 w-[19rem] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden origin-top-right"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">Notifications</p>
                  {totalNew > 0 && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "var(--brand-yellow)", color: "var(--brand-navy)" }}
                    >
                      {totalNew} new
                    </span>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-500">You&rsquo;re all caught up</p>
                    <p className="text-xs text-slate-400 mt-0.5">New activity shows up here.</p>
                  </div>
                ) : (
                  <div className="p-1.5 max-h-80 overflow-y-auto">
                    {notifications.map(n => (
                      <a
                        key={n.key}
                        href={n.href}
                        className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <span
                          className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                          style={{ backgroundColor: "color-mix(in srgb, var(--brand-red) 12%, transparent)", color: "var(--brand-red)" }}
                        >
                          <n.icon className="w-4 h-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-semibold text-slate-800">{n.title}</span>
                          <span className="block text-xs text-slate-500 truncate">{n.describe(n.count)}</span>
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 shrink-0 mt-1">{n.count}</span>
                      </a>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <span className="w-px h-6 bg-slate-900/10 mx-1" />

        {/* Account */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2.5 pl-1 pr-1.5 sm:pr-2.5 py-1 rounded-full border border-transparent hover:border-slate-900/10 hover:bg-white/70 transition-colors"
            aria-label="Account menu"
            aria-expanded={menuOpen}
          >
            <div
              className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center ring-2 ring-white"
              style={{ background: "linear-gradient(135deg, var(--brand-red), var(--brand-yellow))" }}
            >
              {profile.avatar ? (
                <Image src={profile.avatar} alt={profile.name} width={32} height={32} className="w-full h-full object-cover" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-white" />
              )}
            </div>
            <span className="hidden sm:flex flex-col items-start leading-tight max-w-[10rem]">
              <span className="text-[13px] font-semibold text-slate-800 truncate max-w-[10rem]">
                {profile.name || "Administrator"}
              </span>
              <span className="text-[10px] font-medium text-slate-400 tracking-wide uppercase">Admin</span>
            </span>
            <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-slate-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                {...popover}
                className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden origin-top-right"
              >
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
                  <span
                    className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, var(--brand-red), var(--brand-yellow))" }}
                  >
                    {profile.avatar ? (
                      <Image src={profile.avatar} alt={profile.name} width={40} height={40} className="w-full h-full object-cover" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 text-white" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900 truncate">
                      {profile.name || "Administrator"}
                    </span>
                    <span className="block text-xs text-slate-500 truncate">{profile.email}</span>
                  </span>
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
                    onClick={() => {
                      setMenuOpen(false);
                      setPaletteOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Command Palette
                    <kbd className="ml-auto text-[10px] font-semibold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
                      {isMac ? "⌘" : "Ctrl "}K
                    </kbd>
                  </button>
                </div>
                <div className="p-1.5 border-t border-slate-100">
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

      <CommandPalette open={paletteOpen} onClose={closePalette} onLogout={logout} />
    </>
  );
}
