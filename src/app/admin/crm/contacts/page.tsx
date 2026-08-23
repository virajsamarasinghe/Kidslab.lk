"use client";

import { useState } from "react";
import { X, MessageSquarePlus, Send, Download, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/admin/DataTable";
import { useListResource } from "@/hooks/useCrudResource";
import type { Contact, PipelineStage } from "@/types/crm";
import { useConfirm } from "@/components/admin/ConfirmContext";

const STAGE_LABELS: Record<PipelineStage, string> = {
  lead: "Lead",
  contacted: "Contacted",
  registered: "Registered",
  enrolled: "Enrolled",
  alumni: "Alumni",
};

const STAGE_COLORS: Record<PipelineStage, string> = {
  lead: "bg-slate-100 text-slate-600 border-slate-200",
  contacted: "bg-blue-50 text-blue-700 border-blue-200",
  registered: "bg-amber-50 text-amber-700 border-amber-200",
  enrolled: "bg-green-50 text-green-700 border-green-200",
  alumni: "bg-purple-50 text-purple-700 border-purple-200",
};

const SOURCE_LABELS: Record<Contact["source"], string> = {
  user: "Student",
  subscriber: "Subscriber",
  manual: "Manual",
};

export default function CrmContactsPage() {
  const confirm = useConfirm();
  const {
    items: contacts, setItems: setContacts, total, page, setPage, totalPages,
    search, setSearch, loading, error, reload,
  } = useListResource<Contact>("/api/crm/contacts", { itemsKey: "contacts" });
  const [active, setActive] = useState<Contact | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [savingStage, setSavingStage] = useState(false);
  const [stageError, setStageError] = useState("");

  async function updateStage(email: string, stage: PipelineStage) {
    const ok = await confirm({
      title: `Move this contact to "${stage}"?`,
      description: `${email} will be updated in the pipeline.`,
      confirmLabel: "Move contact",
    });
    if (!ok) return;
    setSavingStage(true);
    setStageError("");
    try {
      const res = await fetch(`/api/crm/contacts/${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error("Failed to update stage");
      if (active?.email === email) setActive(a => a ? { ...a, stage } : a);
      setContacts(cs => cs.map(c => c.email === email ? { ...c, stage } : c));
    } catch {
      setStageError("Couldn't update the stage — try again.");
    } finally {
      setSavingStage(false);
    }
  }

  async function addNote() {
    if (!active || !noteText.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/crm/contacts/${encodeURIComponent(active.email)}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: noteText.trim() }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      const updated = await res.json();
      setNoteText("");
      setActive(a => a ? { ...a, notes: updated.notes } : a);
      setContacts(cs => cs.map(c => c.email === active.email ? { ...c, notes: updated.notes } : c));
    } catch {
      setStageError("Couldn't save the note — try again.");
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold text-slate-900 tracking-tight"
            style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
          >
            Contacts
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {total} contact{total !== 1 ? "s" : ""} · students & subscribers unified
          </p>
        </div>
      </div>

      {stageError && (
        <div className="flex items-center gap-2.5 text-sm px-4 py-3 rounded-xl border bg-red-50 border-red-200 text-red-600 mb-6">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{stageError}</span>
        </div>
      )}

      <DataTable
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or email…"
        total={total}
        itemLabel="contact"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        loading={loading}
        error={error}
        onRetry={reload}
        actions={
          <a href="/api/export/contacts" download>
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
                {["Name", "Email", "Source", "Stage", "Notes", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">Loading…</td></tr>
              ) : contacts.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">No contacts found</td></tr>
              ) : contacts.map(c => (
                <tr key={c.email} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">{c.name || "—"}</td>
                  <td className="px-5 py-3.5 text-slate-500">{c.email}</td>
                  <td className="px-5 py-3.5">
                    <Badge className="text-xs bg-slate-50 text-slate-500 border-slate-200">{SOURCE_LABELS[c.source]}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={c.stage}
                      onChange={e => updateStage(c.email, e.target.value as PipelineStage)}
                      disabled={savingStage}
                      className={`text-xs font-medium rounded-full border px-2.5 py-1.5 outline-none ${STAGE_COLORS[c.stage]}`}
                    >
                      {Object.entries(STAGE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{c.notes.length}</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => setActive(c)}
                      className="p-2.5 -m-1 rounded-lg text-slate-400 hover:text-[color:var(--brand-navy)] hover:bg-slate-100 transition-colors"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataTable>

      {/* Contact drawer */}
      {active && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setActive(null)} />
          <div className="w-full max-w-md bg-white shadow-2xl overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 text-base truncate">{active.name || active.email}</h3>
                <p className="text-slate-400 text-xs truncate">{active.email}</p>
              </div>
              <button onClick={() => setActive(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 flex-1">
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Stage</Label>
                <select
                  value={active.stage}
                  onChange={e => updateStage(active.email, e.target.value as PipelineStage)}
                  className={`w-full text-sm font-medium rounded-lg border px-3 py-2 outline-none ${STAGE_COLORS[active.stage]}`}
                >
                  {Object.entries(STAGE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                <div><span className="text-slate-400">Source:</span> {SOURCE_LABELS[active.source]}</div>
                {active.city && <div><span className="text-slate-400">City:</span> {active.city}</div>}
                {active.interestedCourse && <div className="col-span-2"><span className="text-slate-400">Interested in:</span> {active.interestedCourse}</div>}
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                  Notes ({active.notes.length})
                </Label>
                <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
                  {active.notes.length === 0 ? (
                    <p className="text-slate-400 text-xs">No notes yet.</p>
                  ) : (
                    [...active.notes].reverse().map((n, i) => (
                      <div key={i} className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
                        <p className="text-slate-700 text-sm leading-snug">{n.text}</p>
                        <p className="text-slate-400 text-[11px] mt-1">
                          {new Date(n.createdAt).toLocaleString("en-GB")}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Add a follow-up note…"
                    className="border-slate-200 text-sm"
                    onKeyDown={e => e.key === "Enter" && addNote()}
                  />
                  <button
                    onClick={addNote}
                    disabled={savingNote || !noteText.trim()}
                    className="btn-brand-navy shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-white disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
