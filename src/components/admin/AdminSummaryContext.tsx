"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { countedRoutes, type SummaryKey } from "./nav-config";

export type Summary = Partial<Record<SummaryKey, number>>;
type SeenMap = Partial<Record<SummaryKey, number>>;

const SEEN_STORAGE_KEY = "kidslab_admin_badge_seen";
export const SUMMARY_KEYS: SummaryKey[] = ["users", "subscribers", "leads"];

function readSeenMap(): SeenMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(SEEN_STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeSeenMap(map: SeenMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(map));
}

const SummaryContext = createContext<Summary>({});

/**
 * Polls `/api/admin/sidebar-summary` once for the whole admin shell — both the
 * sidebar badges and the navbar notification tray read from this single source.
 */
export function AdminSummaryProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [summary, setSummary] = useState<Summary>({});
  // Establish a "seen as of" checkpoint per badge on first load, so a fresh
  // browser doesn't render existing totals as if they were all brand new.
  const [seenMap, setSeenMap] = useState<SeenMap>(() => {
    const stored = readSeenMap();
    let changed = false;
    for (const key of SUMMARY_KEYS) {
      if (stored[key] == null) {
        stored[key] = Date.now();
        changed = true;
      }
    }
    if (changed) writeSeenMap(stored);
    return stored;
  });

  useEffect(() => {
    if (Object.keys(seenMap).length === 0) return;
    let cancelled = false;
    async function loadSummary() {
      try {
        const params = new URLSearchParams();
        for (const key of SUMMARY_KEYS) {
          if (seenMap[key] != null) params.set(key, String(seenMap[key]));
        }
        const res = await fetch(`/api/admin/sidebar-summary?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setSummary(data);
      } catch {
        // badges are a non-critical enhancement — fail silently
      }
    }
    loadSummary();
    const interval = setInterval(loadSummary, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [seenMap]);

  // Visiting a badged section marks it seen: clears its badge and resets
  // the "new since" checkpoint to now.
  useEffect(() => {
    const hit = countedRoutes.find(r => pathname.startsWith(r.href));
    if (!hit) return;
    setSeenMap(prev => {
      if (prev[hit.countKey] != null && Date.now() - prev[hit.countKey]! < 2000) return prev;
      const next = { ...prev, [hit.countKey]: Date.now() };
      writeSeenMap(next);
      return next;
    });
    setSummary(prev => ({ ...prev, [hit.countKey]: 0 }));
  }, [pathname]);

  return <SummaryContext.Provider value={summary}>{children}</SummaryContext.Provider>;
}

export function useAdminSummary() {
  return useContext(SummaryContext);
}
