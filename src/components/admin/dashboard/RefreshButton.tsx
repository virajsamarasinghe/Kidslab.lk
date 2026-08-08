"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Drops the cached stats server-side, then re-renders the page so the streamed
 * sections come back with fresh numbers — no full page reload.
 */
export default function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setBusy(true);
    try {
      await fetch("/api/stats/revalidate", { method: "POST" });
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  const spinning = busy || pending;

  return (
    <Button variant="outline" size="sm" onClick={refresh} disabled={spinning} className="gap-1.5">
      <RefreshCw className={`w-3.5 h-3.5 ${spinning ? "animate-spin" : ""}`} />
      {spinning ? "Refreshing…" : "Refresh"}
    </Button>
  );
}
