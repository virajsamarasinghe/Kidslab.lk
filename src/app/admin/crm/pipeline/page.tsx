"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PIPELINE_STAGES, type Contact, type PipelineStage } from "@/types/crm";

const STAGE_LABELS: Record<PipelineStage, string> = {
  lead: "Lead",
  contacted: "Contacted",
  registered: "Registered",
  enrolled: "Enrolled",
  alumni: "Alumni",
};

const STAGE_ACCENTS: Record<PipelineStage, string> = {
  lead: "#94a3b8",
  contacted: "var(--brand-blue)",
  registered: "var(--brand-yellow)",
  enrolled: "#16a34a",
  alumni: "#9333ea",
};

const SOURCE_LABELS: Record<Contact["source"], string> = {
  user: "Student",
  subscriber: "Subscriber",
  manual: "Manual",
};

export default function CrmPipelinePage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/crm/contacts");
    const data = await res.json();
    setContacts(data.contacts ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const byStage = useMemo(() => {
    const map: Record<PipelineStage, Contact[]> = { lead: [], contacted: [], registered: [], enrolled: [], alumni: [] };
    for (const c of contacts) map[c.stage].push(c);
    return map;
  }, [contacts]);

  async function moveStage(email: string, direction: -1 | 1) {
    const current = contacts.find(c => c.email === email);
    if (!current) return;
    const idx = PIPELINE_STAGES.indexOf(current.stage);
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= PIPELINE_STAGES.length) return;
    const nextStage = PIPELINE_STAGES[nextIdx];

    setContacts(cs => cs.map(c => c.email === email ? { ...c, stage: nextStage } : c));
    await fetch(`/api/crm/contacts/${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: nextStage }),
    });
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-slate-900 tracking-tight"
          style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
        >
          Pipeline
        </h1>
        <p className="text-slate-500 text-sm mt-1">Move contacts through the enrollment journey.</p>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm text-center py-12">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 items-start">
          {PIPELINE_STAGES.map((stage, colIdx) => (
            <div key={stage} className="min-w-0">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STAGE_ACCENTS[stage] }} />
                <h2 className="text-sm font-semibold text-slate-700">{STAGE_LABELS[stage]}</h2>
                <span className="text-xs text-slate-400 ml-auto">{byStage[stage].length}</span>
              </div>
              <div className="space-y-2.5 min-h-[80px]">
                {byStage[stage].length === 0 ? (
                  <div className="border border-dashed border-slate-200 rounded-xl py-6 text-center text-slate-300 text-xs">
                    Empty
                  </div>
                ) : byStage[stage].map(c => (
                  <Card key={c.email} className="pcb-card border-slate-100 shadow-sm p-3.5">
                    <p className="font-semibold text-slate-900 text-sm truncate">{c.name || c.email}</p>
                    <p className="text-slate-400 text-xs truncate mt-0.5">{c.email}</p>
                    <div className="flex items-center justify-between mt-2.5">
                      <Badge className="text-[10px] bg-slate-50 text-slate-500 border-slate-200">
                        {SOURCE_LABELS[c.source]}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveStage(c.email, -1)}
                          disabled={colIdx === 0}
                          className="p-1 rounded-md text-slate-400 hover:text-[color:var(--brand-navy)] hover:bg-slate-100 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                          aria-label="Move back"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveStage(c.email, 1)}
                          disabled={colIdx === PIPELINE_STAGES.length - 1}
                          className="p-1 rounded-md text-slate-400 hover:text-[color:var(--brand-navy)] hover:bg-slate-100 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                          aria-label="Move forward"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
