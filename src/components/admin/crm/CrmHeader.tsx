"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Contact2, KanbanSquare, Megaphone, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const TABS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Contacts", href: "/admin/crm/contacts", icon: Contact2 },
  { label: "Pipeline", href: "/admin/crm/pipeline", icon: KanbanSquare },
  { label: "Email Marketing", href: "/admin/crm/campaigns", icon: Megaphone },
];

export function CrmTabs() {
  const pathname = usePathname();
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
      {TABS.map(tab => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
              active ? "text-white" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {active && (
              <motion.span
                layoutId="crm-tab-active"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-xl shadow-[0_2px_10px_-2px_rgba(15,23,42,0.35)]"
                style={{ backgroundColor: "var(--brand-navy)" }}
              />
            )}
            <tab.icon className="relative z-10 w-3.5 h-3.5" />
            <span className="relative z-10 hidden sm:inline">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

/** Shared page header for the three CRM tabs: title, subtitle, tab switcher, and an optional action slot. */
export function CrmHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1
          className="text-2xl font-bold text-slate-900 tracking-tight"
          style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
        >
          {title}
        </h1>
        <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
        <div className="mt-4">
          <CrmTabs />
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
