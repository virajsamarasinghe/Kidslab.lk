"use client";

import { useState, type ReactNode } from "react";
import AdminSidebar from "./Sidebar";
import AdminNavbar from "./Navbar";
import { AdminProfileProvider, type AdminProfile } from "./AdminProfileContext";
import { AdminSummaryProvider } from "./AdminSummaryContext";
import { ConfirmProvider } from "./ConfirmContext";
import ForcePasswordChangeGate from "./ForcePasswordChangeGate";

const COLLAPSE_STORAGE_KEY = "kidslab_admin_sidebar_collapsed";

function readStoredCollapsed() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1";
}

export default function AdminShell({ children, profile }: { children: ReactNode; profile: AdminProfile }) {
  const [collapsed, setCollapsed] = useState(readStoredCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleCollapsed() {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <AdminProfileProvider initial={profile}>
      <ForcePasswordChangeGate>
      <ConfirmProvider>
        <AdminSummaryProvider>
          <div className="min-h-screen" style={{ backgroundColor: "var(--brand-paper)" }}>
          {/* Visible only on keyboard focus — lets keyboard and screen-reader
              users jump past the sidebar and navbar on every page. */}
          <a
            href="#admin-main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg focus:ring-2 focus:ring-slate-900"
          >
            Skip to main content
          </a>
            <AdminSidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
            <div className={`flex flex-col min-h-screen transition-[margin] duration-200 ease-out ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>
              <AdminNavbar
                collapsed={collapsed}
                onToggleCollapsed={toggleCollapsed}
                onOpenMobile={() => setMobileOpen(true)}
              />
              <main id="admin-main" className="flex-1">{children}</main>
            </div>
          </div>
        </AdminSummaryProvider>
      </ConfirmProvider>
      </ForcePasswordChangeGate>
    </AdminProfileProvider>
  );
}
