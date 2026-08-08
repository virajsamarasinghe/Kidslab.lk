"use client";

import { History } from "lucide-react";
import { DataTable } from "@/components/admin/DataTable";
import { useListResource } from "@/hooks/useCrudResource";
import type { ActivityEntry } from "@/types/activity";

const ACTION_LABELS: Record<string, string> = {
  created: "created",
  updated: "updated",
  deleted: "deleted",
  sent: "sent",
  "moved-stage": "moved the stage of",
};

const RESOURCE_LABELS: Record<string, string> = {
  course: "course",
  instructor: "instructor",
  user: "student",
  contact: "contact",
  campaign: "campaign",
  settings: "settings",
};

function describe(entry: ActivityEntry): string {
  const action = ACTION_LABELS[entry.action] ?? entry.action;
  const resource = RESOURCE_LABELS[entry.resource] ?? entry.resource;
  const meta = entry.meta ?? {};
  const label =
    (typeof meta.title === "string" && meta.title) ||
    (typeof meta.name === "string" && meta.name) ||
    (typeof meta.subject === "string" && meta.subject) ||
    entry.resourceId ||
    "";
  return `${action} ${resource}${label ? ` "${label}"` : ""}`;
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB");
}

export default function AdminActivityPage() {
  const {
    items: entries, total, page, setPage, totalPages, loading, error, reload,
  } = useListResource<ActivityEntry>("/api/admin/activity", { itemsKey: "entries", limit: 30 });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-slate-900 tracking-tight"
          style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
        >
          Activity
        </h1>
        <p className="text-slate-500 text-sm mt-1">A log of admin actions across the dashboard.</p>
      </div>

      <DataTable
        total={total}
        itemLabel="entry"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        loading={loading}
        error={error}
        onRetry={reload}
      >
        <div className="divide-y divide-slate-50">
          {loading ? (
            <p className="px-5 py-12 text-center text-slate-400 text-sm">Loading…</p>
          ) : entries.length === 0 ? (
            <p className="px-5 py-12 text-center text-slate-400 text-sm">No activity recorded yet</p>
          ) : entries.map(e => (
            <div key={e._id} className="flex items-start gap-3 px-5 py-3.5">
              <History className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">{e.actorEmail}</span> {describe(e)}
                </p>
              </div>
              <span className="text-xs text-slate-400 shrink-0 whitespace-nowrap">{timeAgo(e.createdAt)}</span>
            </div>
          ))}
        </div>
      </DataTable>
    </div>
  );
}
