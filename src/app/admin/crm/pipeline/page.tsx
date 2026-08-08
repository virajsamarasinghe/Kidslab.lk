"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDroppable, closestCorners,
  type DragStartEvent, type DragOverEvent, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
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

type Columns = Record<PipelineStage, Contact[]>;

const EMPTY_COLUMNS: Columns = { lead: [], contacted: [], registered: [], enrolled: [], alumni: [] };

function groupByStage(contacts: Contact[]): Columns {
  const map: Columns = { lead: [], contacted: [], registered: [], enrolled: [], alumni: [] };
  for (const c of contacts) map[c.stage].push(c);
  return map;
}

function ContactCard({ contact, dragging }: { contact: Contact; dragging?: boolean }) {
  return (
    <Card
      className={`pcb-card border-slate-100 shadow-sm p-3.5 ${dragging ? "shadow-lg rotate-2" : ""}`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 text-sm truncate">{contact.name || contact.email}</p>
          <p className="text-slate-400 text-xs truncate mt-0.5">{contact.email}</p>
          <div className="mt-2.5">
            <Badge className="text-[10px] bg-slate-50 text-slate-500 border-slate-200">
              {SOURCE_LABELS[contact.source]}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}

function SortableCard({ contact }: { contact: Contact }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: contact.email,
    data: { stage: contact.stage },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      {...attributes}
      {...listeners}
      className="touch-none"
    >
      <ContactCard contact={contact} />
    </div>
  );
}

function StageColumn({ stage, contacts, colIdx }: { stage: PipelineStage; contacts: Contact[]; colIdx: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="shrink-0 w-[85vw] max-w-xs snap-start sm:w-auto sm:max-w-none sm:shrink sm:min-w-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STAGE_ACCENTS[stage] }} />
        <h2 className="text-sm font-semibold text-slate-700">{STAGE_LABELS[stage]}</h2>
        <span className="text-xs text-slate-400 ml-auto">{contacts.length}</span>
      </div>
      <SortableContext items={contacts.map(c => c.email)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`space-y-2.5 min-h-[120px] rounded-xl transition-colors p-1 -m-1 ${
            isOver ? "bg-blue-50/60 ring-2 ring-blue-200" : ""
          }`}
        >
          {contacts.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-xl py-6 text-center text-slate-300 text-xs">
              Drop here
            </div>
          ) : contacts.map(c => <SortableCard key={c.email} contact={c} />)}
        </div>
      </SortableContext>
      <p className="sr-only">{colIdx}</p>
    </div>
  );
}

export default function CrmPipelinePage() {
  const [columns, setColumns] = useState<Columns>(EMPTY_COLUMNS);
  const [loading, setLoading] = useState(true);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/crm/contacts");
    const data = await res.json();
    setColumns(groupByStage(data.contacts ?? []));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function findContainer(id: string): PipelineStage | undefined {
    if ((PIPELINE_STAGES as readonly string[]).includes(id)) return id as PipelineStage;
    return PIPELINE_STAGES.find(stage => columns[stage].some(c => c.email === id));
  }

  function handleDragStart(event: DragStartEvent) {
    const container = findContainer(String(event.active.id));
    if (!container) return;
    setActiveContact(columns[container].find(c => c.email === event.active.id) ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setColumns(prev => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.findIndex(c => c.email === activeId);
      if (activeIndex === -1) return prev;

      const overIndex = overItems.findIndex(c => c.email === overId);
      const moved = { ...activeItems[activeIndex], stage: overContainer };
      const newOverItems = [...overItems];
      newOverItems.splice(overIndex >= 0 ? overIndex : overItems.length, 0, moved);

      return {
        ...prev,
        [activeContainer]: activeItems.filter(c => c.email !== activeId),
        [overContainer]: newOverItems,
      };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveContact(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const container = findContainer(activeId);
    if (!container) return;

    // Reorder within the same column for a tidy drop.
    const overContainer = findContainer(overId);
    if (overContainer === container) {
      setColumns(prev => {
        const items = prev[container];
        const oldIndex = items.findIndex(c => c.email === activeId);
        const newIndex = items.findIndex(c => c.email === overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
        return { ...prev, [container]: arrayMove(items, oldIndex, newIndex) };
      });
    }

    // Compare against the stage captured at drag-start (before any live
    // dragOver mutations already rewrote it to the destination column).
    if (activeContact && activeContact.stage !== container) {
      fetch(`/api/crm/contacts/${encodeURIComponent(activeId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: container }),
      });
    }
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
        <p className="text-slate-500 text-sm mt-1">Drag contacts through the enrollment journey.</p>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm text-center py-12">Loading…</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-8 px-8 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 xl:grid-cols-5 sm:overflow-visible sm:snap-none items-start">
            {PIPELINE_STAGES.map((stage, colIdx) => (
              <StageColumn key={stage} stage={stage} contacts={columns[stage]} colIdx={colIdx} />
            ))}
          </div>
          <DragOverlay>
            {activeContact ? <ContactCard contact={activeContact} dragging /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
