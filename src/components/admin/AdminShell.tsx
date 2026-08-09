"use client";

import { useState, type ReactNode } from "react";
import AdminSidebar from "./Sidebar";
import AdminNavbar from "./Navbar";
import { AdminProfileProvider, type AdminProfile } from "./AdminProfileContext";
import { AdminSummaryProvider } from "./AdminSummaryContext";
import { ConfirmProvider } from "./ConfirmContext";

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
      <ConfirmProvider>
        <AdminSummaryProvider>
          <div className="min-h-screen" style={{ backgroundColor: "var(--brand-paper)" }}>
            <AdminSidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
            <div className={`flex flex-col min-h-screen transition-[margin] duration-200 ease-out ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>
              <AdminNavbar
                collapsed={collapsed}
                onToggleCollapsed={toggleCollapsed}
                onOpenMobile={() => setMobileOpen(true)}
              />
              <main className="flex-1">{children}</main>
            </div>
          </div>
        </AdminSummaryProvider>
      </ConfirmProvider>
    </AdminProfileProvider>
  );
}
