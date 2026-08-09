"use client";

import {
  createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { countedRoutes, type SummaryKey } from "./nav-config";

export type Summary = Partial<Record<SummaryKey, number>>;

export const SUMMARY_KEYS: SummaryKey[] = ["users", "subscribers", "leads"];

const POLL_MS = 60_000;

interface SummaryContextValue {
  summary: Summary;
  /** Clears every badge — used by "Mark all as read" in the notification tray. */
  markAllRead: () => Promise<void>;
}

const SummaryContext = createContext<SummaryContextValue>({
  summary: {},
  markAllRead: async () => {},
});

/**
 * Single source for the sidebar badges and the navbar notification tray.
 *
 * Read state lives on the admin's own user record (`/api/admin/notifications`)
 * rather than in localStorage, which had two problems: it didn't follow the
 * account to another browser or device, and two admins sharing one browser
 * shared one checkpoint — so whoever looked first cleared it for the other.
 */
export function AdminSummaryProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [summary, setSummary] = useState<Summary>({});
  // Guards against a section being re-marked on every re-render while the
  // admin stays on that page.
  const markedRef = useRef<Partial<Record<SummaryKey, number>>>({});

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) setSummary(await res.json());
    } catch {
      // badges are a non-critical enhancement — fail silently
    }
  }, []);

  const markRead = useCallback(async (keys?: SummaryKey[]) => {
    // Clear locally first so the badge disappears on click, not on round-trip.
    setSummary(prev => {
      const next = { ...prev };
      for (const key of keys ?? SUMMARY_KEYS) next[key] = 0;
      return next;
    });
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(keys ? { keys } : {}),
      });
      if (res.ok) setSummary(await res.json());
    } catch {
      // leave the optimistic clear in place; the next poll re-syncs
    }
  }, []);

  const markAllRead = useCallback(() => markRead(), [markRead]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  // Visiting a badged section marks that badge read.
  useEffect(() => {
    const hit = countedRoutes.find(r => pathname.startsWith(r.href));
    if (!hit) return;
    const last = markedRef.current[hit.countKey];
    if (last && Date.now() - last < 2000) return;
    markedRef.current[hit.countKey] = Date.now();
    void markRead([hit.countKey]);
  }, [pathname, markRead]);

  return (
    <SummaryContext.Provider value={{ summary, markAllRead }}>
      {children}
    </SummaryContext.Provider>
  );
}

/** Badge counts only — what the sidebar and navbar render. */
export function useAdminSummary() {
  return useContext(SummaryContext).summary;
}

/** Actions on the notification tray. */
export function useNotificationActions() {
  const { markAllRead } = useContext(SummaryContext);
  return { markAllRead };
}
