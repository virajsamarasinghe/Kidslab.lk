"use client";

import { useState } from "react";
import { Mail, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTable } from "@/components/admin/DataTable";
import { useListResource } from "@/hooks/useCrudResource";
import type { Subscriber } from "@/types/subscriber";

export default function AdminSubscribers() {
  const {
    items: subscribers, total, page, setPage, totalPages, search, setSearch, loading, error, reload,
  } = useListResource<Subscriber>("/api/subscribers", { itemsKey: "subscribers" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function handleDelete() {
    if (!deleteId) return;
    await fetch(`/api/subscribers/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    reload();
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-slate-900 tracking-tight"
          style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
        >
          Subscribers
        </h1>
        <p className="text-slate-500 text-sm mt-1">{total} email{total !== 1 ? "s" : ""} collected from the site popup</p>
      </div>

      <DataTable
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by email…"
        total={total}
        itemLabel="subscriber"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        loading={loading}
        error={error}
        onRetry={reload}
        actions={
          <a href="/api/export/subscribers" download>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          </a>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Email", "Source", "Subscribed", "Actions"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-400">Loading…</td></tr>
              ) : subscribers.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-400">No subscribers yet</td></tr>
              ) : subscribers.map(s => (
                <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {s.email}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 capitalize">{s.source || "—"}</td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                    {new Date(s.createdAt).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => setDeleteId(s._id)}
                      className="p-2.5 -m-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataTable>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove subscriber?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this email from the subscriber list. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
