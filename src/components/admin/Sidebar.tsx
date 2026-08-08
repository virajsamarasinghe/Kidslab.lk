"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown, X, Search, UserCog, LogOut, ShieldCheck, type LucideIcon,
} from "lucide-react";
import { navItems, navGroups, flattenNav, type NavItemDef, type NavGroupDef } from "./nav-config";
import { useAdminProfile } from "./AdminProfileContext";
import { useAdminSummary, type Summary } from "./AdminSummaryContext";

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span
      className="relative z-10 ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold text-white"
      style={{ backgroundColor: "var(--brand-yellow)", color: "var(--brand-navy)" }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavLink({ item, active, collapsed, summary }: { item: NavItemDef; active: boolean; collapsed: boolean; summary: Summary }) {
  const Icon = item.icon;
  const count = item.countKey ? summary[item.countKey] ?? 0 : 0;
  return (
    <a
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
        collapsed ? "lg:justify-center" : ""
      } ${active ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/[0.06]"}`}
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
      <span className={`relative z-10 truncate ${collapsed ? "lg:hidden" : ""}`}>{item.label}</span>
      {!collapsed && <Badge count={count} />}
      {collapsed && count > 0 && (
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full lg:block hidden"
          style={{ backgroundColor: "var(--brand-yellow)" }}
        />
      )}
    </a>
  );
}

function NavGroup({ group, pathname, collapsed, summary }: { group: NavGroupDef; pathname: string; collapsed: boolean; summary: Summary }) {
  const inGroup = pathname.startsWith(group.basePath);
  const [open, setOpen] = useState(inGroup);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const Icon = group.icon;
  const groupCount = group.items.reduce((sum, i) => sum + (i.countKey ? summary[i.countKey] ?? 0 : 0), 0);

  if (collapsed) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setFlyoutOpen(true)}
        onMouseLeave={() => setFlyoutOpen(false)}
      >
        <button
          className={`w-full relative flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
            inGroup ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
          }`}
        >
          {inGroup && (
            <span
              className="absolute inset-0 rounded-xl shadow-[0_4px_16px_-2px_rgba(224,138,60,0.5)]"
              style={{ backgroundColor: "var(--brand-red)" }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center w-7 h-7 rounded-lg shrink-0">
            <Icon className="w-3.5 h-3.5" />
          </span>
          {groupCount > 0 && (
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--brand-yellow)" }}
            />
          )}
        </button>

        <AnimatePresence>
          {flyoutOpen && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.12 }}
              className="absolute left-full top-0 ml-2 w-52 rounded-xl border border-white/10 shadow-xl py-2 z-50"
              style={{ backgroundColor: "var(--brand-navy)" }}
            >
              <p className="px-3 pb-1.5 text-[10px] font-bold tracking-[0.18em] uppercase text-slate-500">
                {group.label}
              </p>
              {group.items.map(item => {
                const active = pathname === item.href;
                const count = item.countKey ? summary[item.countKey] ?? 0 : 0;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 mx-2 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                      active ? "text-white bg-white/10" : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    <Badge count={count} />
                  </a>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
          inGroup && !open ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
        }`}
      >
        {inGroup && !open && (
          <motion.span
            layoutId="admin-nav-active"
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="absolute inset-0 rounded-xl shadow-[0_4px_16px_-2px_rgba(224,138,60,0.5)]"
            style={{ backgroundColor: "var(--brand-red)" }}
          />
        )}
        <span
          className={`relative z-10 flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors ${
            inGroup ? "bg-white/15" : "bg-white/5"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
        </span>
        <span className="relative z-10">{group.label}</span>
        {!open && <Badge count={groupCount} />}
        <ChevronDown
          className={`relative z-10 ${open ? "" : "ml-auto"} w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180 ml-auto" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden pl-3"
          >
            <div className="border-l border-white/10 ml-4 pl-3 py-1 space-y-0.5">
              {group.items.map(item => {
                const active = pathname === item.href;
                const count = item.countKey ? summary[item.countKey] ?? 0 : 0;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                      active ? "text-white bg-white/10" : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    <Badge count={count} />
                  </a>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Flat search result row, used only while the search box has a query. */
function SearchResultRow({ item, active, icon: Icon }: { item: { label: string; href: string; group?: string }; active: boolean; icon: LucideIcon }) {
  return (
    <a
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active ? "text-white bg-white/10" : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
      }`}
    >
      <span className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0 bg-white/5">
        <Icon className="w-3.5 h-3.5" />
      </span>
      <span className="flex flex-col min-w-0">
        <span className="truncate">{item.label}</span>
        {item.group && <span className="text-[10px] text-slate-500 truncate">{item.group}</span>}
      </span>
    </a>
  );
}

export default function AdminSidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const profile = useAdminProfile();
  const summary = useAdminSummary();
  const [query, setQuery] = useState("");
  const [footerFlyoutOpen, setFooterFlyoutOpen] = useState(false);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return flattenNav().filter(
      item => item.label.toLowerCase().includes(q) || (item.group ?? "").toLowerCase().includes(q)
    );
  }, [query]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 flex flex-col z-40 border-r border-white/5 transition-all duration-200 ease-out
          ${collapsed ? "lg:w-20" : "lg:w-64"} w-64
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        style={{
          background:
            "linear-gradient(180deg, var(--brand-navy) 0%, #123a2a 55%, #0d2560 100%)",
        }}
      >
        {/* Brand */}
        <div className="h-16 flex items-center px-5 relative shrink-0">
          <div className={`bg-white rounded-lg shadow-sm px-2.5 py-1.5 flex items-center ${collapsed ? "lg:mx-auto lg:px-2" : ""}`}>
            <Image
              src="/logo.png"
              alt="kidslab.lk"
              width={301}
              height={121}
              className={`h-7 w-auto object-contain ${collapsed ? "lg:hidden" : ""}`}
              priority
            />
            <span className={`hidden ${collapsed ? "lg:block" : ""} text-[11px] font-black tracking-tight`} style={{ color: "var(--brand-navy)" }}>
              KL
            </span>
          </div>
          <p className={`text-slate-500 text-[10px] ml-2.5 font-semibold tracking-[0.15em] uppercase ${collapsed ? "lg:hidden" : ""}`}>
            Admin
          </p>
          <button
            onClick={onCloseMobile}
            className="ml-auto text-slate-400 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
          <div
            className="absolute bottom-0 left-5 right-5 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, color-mix(in srgb, var(--brand-yellow) 45%, transparent) 50%, transparent)",
            }}
          />
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="px-3 pt-4 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                type="text"
                placeholder="Search menu…"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-[13px] text-white placeholder:text-slate-500 focus:outline-none focus:border-white/25 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-4 pb-4 space-y-1 overflow-y-auto overflow-x-visible">
          {searchResults ? (
            searchResults.length > 0 ? (
              searchResults.map(item => (
                <SearchResultRow key={item.href} item={item} active={pathname === item.href} icon={item.icon} />
              ))
            ) : (
              <p className="px-3 py-4 text-[13px] text-slate-500 text-center">No matches for &ldquo;{query}&rdquo;</p>
            )
          ) : (
            <>
              <p className={`px-3 mb-2 text-[10px] font-bold tracking-[0.18em] uppercase text-slate-500 ${collapsed ? "lg:hidden" : ""}`}>
                Menu
              </p>
              {navItems.map(item => {
                const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                return <NavLink key={item.href} item={item} active={active} collapsed={collapsed} summary={summary} />;
              })}
              {navGroups.map(group => (
                <NavGroup key={group.id} group={group} pathname={pathname} collapsed={collapsed} summary={summary} />
              ))}
            </>
          )}
        </nav>

        {/* Footer: profile + quick actions */}
        <div
          className="shrink-0 border-t border-white/10 p-3 relative"
          onMouseEnter={() => collapsed && setFooterFlyoutOpen(true)}
          onMouseLeave={() => collapsed && setFooterFlyoutOpen(false)}
        >
          {collapsed ? (
            <button
              className="w-full flex items-center justify-center py-1"
              aria-label="Account"
            >
              <span className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, var(--brand-red), var(--brand-yellow))" }}>
                {profile.avatar ? (
                  <Image src={profile.avatar} alt={profile.name} width={32} height={32} className="w-full h-full object-cover" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-white" />
                )}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5 px-1 py-1">
              <span className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, var(--brand-red), var(--brand-yellow))" }}>
                {profile.avatar ? (
                  <Image src={profile.avatar} alt={profile.name} width={36} height={36} className="w-full h-full object-cover" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-white" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{profile.name || "Administrator"}</p>
                <p className="text-[11px] text-slate-500 truncate">{profile.email}</p>
              </div>
              <a
                href="/admin/profile"
                title="Edit profile"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
              >
                <UserCog className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={logout}
                title="Sign out"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/[0.06] transition-colors shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <AnimatePresence>
            {collapsed && footerFlyoutOpen && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.12 }}
                className="absolute left-full bottom-0 ml-2 w-52 rounded-xl border border-white/10 shadow-xl py-2 z-50"
                style={{ backgroundColor: "var(--brand-navy)" }}
              >
                <div className="px-3 pb-2 mb-1 border-b border-white/10">
                  <p className="text-sm font-semibold text-white truncate">{profile.name || "Administrator"}</p>
                  <p className="text-[11px] text-slate-500 truncate">{profile.email}</p>
                </div>
                <a
                  href="/admin/profile"
                  className="flex items-center gap-2.5 mx-2 px-2.5 py-2 rounded-lg text-[13px] font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <UserCog className="w-3.5 h-3.5 shrink-0" />
                  Edit Profile
                </a>
                <button
                  onClick={logout}
                  className="w-[calc(100%-1rem)] flex items-center gap-2.5 mx-2 px-2.5 py-2 rounded-lg text-[13px] font-medium text-red-400 hover:bg-white/[0.06] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>
    </>
  );
}
