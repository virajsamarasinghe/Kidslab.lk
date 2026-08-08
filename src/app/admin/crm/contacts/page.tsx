"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Search, X, MessageSquarePlus, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Contact, PipelineStage } from "@/types/crm";

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
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Contact | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [savingStage, setSavingStage] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/crm/contacts");
    const data = await res.json();
    setContacts(data.contacts ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(c =>
      c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [contacts, search]);

  async function updateStage(email: string, stage: PipelineStage) {
    setSavingStage(true);
    await fetch(`/api/crm/contacts/${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    setSavingStage(false);
    if (active?.email === email) setActive(a => a ? { ...a, stage } : a);
    setContacts(cs => cs.map(c => c.email === email ? { ...c, stage } : c));
  }

  async function addNote() {
    if (!active || !noteText.trim()) return;
    setSavingNote(true);
    const res = await fetch(`/api/crm/contacts/${encodeURIComponent(active.email)}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: noteText.trim() }),
    });
    const updated = await res.json();
    setNoteText("");
    setSavingNote(false);
    setActive(a => a ? { ...a, notes: updated.notes } : a);
    setContacts(cs => cs.map(c => c.email === active.email ? { ...c, notes: updated.notes } : c));
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-slate-900 tracking-tight"
            style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
          >
            Contacts
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {contacts.length} contact{contacts.length !== 1 ? "s" : ""} · students & subscribers unified
          </p>
        </div>
      </div>

      <Card className="pcb-card border-slate-100 shadow-sm mb-6 p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name or email…"
            className="pl-9 bg-slate-50 border-slate-200 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <Card className="pcb-card border-slate-100 shadow-sm overflow-hidden">
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
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">No contacts found</td></tr>
              ) : filtered.map(c => (
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
      </Card>

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
