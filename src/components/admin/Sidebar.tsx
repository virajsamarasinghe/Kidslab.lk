"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, Users, BookOpen, Mail, UserRound,
  Settings, ChevronDown, Send, BrainCircuit, Layers3,
  Contact2, KanbanSquare, Megaphone, X, type LucideIcon,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",       href: "/admin",              icon: LayoutDashboard },
  { label: "Users",           href: "/admin/users",        icon: Users },
  { label: "Courses",         href: "/admin/courses",      icon: BookOpen },
  { label: "Instructors",     href: "/admin/instructors",  icon: UserRound },
  { label: "Subscribers",     href: "/admin/subscribers",  icon: Mail },
];

interface NavGroupDef {
  id: string;
  label: string;
  icon: LucideIcon;
  basePath: string;
  items: { label: string; href: string; icon: LucideIcon }[];
}

const navGroups: NavGroupDef[] = [
  {
    id: "crm",
    label: "CRM",
    icon: Contact2,
    basePath: "/admin/crm",
    items: [
      { label: "Contacts",       href: "/admin/crm/contacts",  icon: Contact2 },
      { label: "Pipeline",       href: "/admin/crm/pipeline",  icon: KanbanSquare },
      { label: "Email Marketing", href: "/admin/crm/campaigns", icon: Megaphone },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    basePath: "/admin/settings",
    items: [
      { label: "Brevo Email",     href: "/admin/settings/brevo",     icon: Send },
      { label: "LLM Config",      href: "/admin/settings/llm",       icon: BrainCircuit },
      { label: "Embedding Model", href: "/admin/settings/embedding", icon: Layers3 },
    ],
  },
];

function NavGroup({ group, pathname, collapsed }: { group: NavGroupDef; pathname: string; collapsed: boolean }) {
  const inGroup = pathname.startsWith(group.basePath);
  const [open, setOpen] = useState(inGroup);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const Icon = group.icon;

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
              {group.items.map(({ label, href, icon: ItemIcon }) => {
                const active = pathname === href;
                return (
                  <a
                    key={href}
                    href={href}
                    className={`flex items-center gap-2.5 mx-2 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                      active ? "text-white bg-white/10" : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <ItemIcon className="w-3.5 h-3.5 shrink-0" />
                    {label}
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
          inGroup && !open
            ? "text-white"
            : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
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
        <ChevronDown
          className={`relative z-10 ml-auto w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
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
              {group.items.map(({ label, href, icon: ItemIcon }) => {
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
                    <ItemIcon className="w-3.5 h-3.5 shrink-0" />
                    {label}
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

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-6 pb-4 space-y-1 overflow-y-auto overflow-x-visible">
          <p className={`px-3 mb-2 text-[10px] font-bold tracking-[0.18em] uppercase text-slate-500 ${collapsed ? "lg:hidden" : ""}`}>
            Menu
          </p>
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <a
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                  collapsed ? "lg:justify-center" : ""
                } ${
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
                <span className={`relative z-10 ${collapsed ? "lg:hidden" : ""}`}>{label}</span>
                {active && (
                  <span className={`relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-white ${collapsed ? "lg:hidden" : ""}`} />
                )}
              </a>
            );
          })}

          {navGroups.map(group => (
            <NavGroup key={group.id} group={group} pathname={pathname} collapsed={collapsed} />
          ))}
        </nav>
      </aside>
    </>
  );
}
