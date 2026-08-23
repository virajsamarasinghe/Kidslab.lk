"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Pencil, X, ToggleLeft, ToggleRight, Check, AlertTriangle, RefreshCw, Users, Clock, GraduationCap, Wallet, Calendar, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Course } from "@/types/course";
import type { Instructor } from "@/types/instructor";
import { useConfirm } from "@/components/admin/ConfirmContext";

const EMPTY: Omit<Course, "_id"> = {
  title: "", description: "", ageRange: "8–16",
  level: "Beginner", duration: "", schedule: "",
  price: 0, instructors: [], maxStudents: 50, enrolledCount: 0, isActive: true,
  badgeText: "", ctaLabel: "", seminarNote: "",
};

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
const LEVEL_COLORS: Record<string, string> = {
  Beginner: "bg-green-50 text-green-700 border-green-200",
  Intermediate: "bg-amber-50 text-amber-700 border-amber-200",
  Advanced: "bg-red-50 text-red-600 border-red-200",
};

export default function AdminCourses() {
  const confirm = useConfirm();
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Course> | null>(null);
  const [selectedInstructorIds, setSelectedInstructorIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesRes, instructorsRes] = await Promise.all([
        fetch("/api/courses"),
        fetch("/api/instructors"),
      ]);
      if (!coursesRes.ok || !instructorsRes.ok) throw new Error("Failed to load courses");
      const coursesData = await coursesRes.json();
      const instructorsData = await instructorsRes.json();
      setCourses(coursesData.courses ?? []);
      setInstructors(instructorsData.instructors ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openForm(c?: Course) {
    setForm(c ? { ...c } : { ...EMPTY });
    setSelectedInstructorIds(c ? c.instructors.map(i => i._id) : []);
  }

  function toggleInstructor(id: string) {
    setSelectedInstructorIds(ids =>
      ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
    );
  }

  async function handleSave() {
    if (!form) return;
    const ok = await confirm({
      title: form._id ? "Save changes to this course?" : "Create this course?",
      description: form._id
        ? "The course will be updated for everyone viewing the site."
        : "The course will be added and visible on the site if marked active.",
      confirmLabel: form._id ? "Save changes" : "Create course",
    });
    if (!ok) return;
    setSaving(true);
    setActionError("");
    try {
      const payload = { ...form, instructors: selectedInstructorIds };
      const res = form._id
        ? await fetch(`/api/courses/${form._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/courses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) throw new Error("Failed to save course");
      setForm(null);
      load();
    } catch {
      setActionError("Couldn't save the course — try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(c: Course) {
    const ok = await confirm({
      title: c.isActive ? "Deactivate this course?" : "Activate this course?",
      description: c.isActive
        ? `"${c.title}" will stop appearing on the public site.`
        : `"${c.title}" will start appearing on the public site.`,
      confirmLabel: c.isActive ? "Deactivate" : "Activate",
    });
    if (!ok) return;
    setActionError("");
    try {
      const res = await fetch(`/api/courses/${c._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      if (!res.ok) throw new Error("Failed to update course");
      load();
    } catch {
      setActionError("Couldn't update the course — try again.");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setActionError("");
    try {
      const res = await fetch(`/api/courses/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete course");
      setDeleteId(null);
      load();
    } catch {
      setActionError("Couldn't delete the course — try again.");
    }
  }

  const field = (key: keyof Course, label: string, type = "text", multiline = false, placeholder?: string) => (
    <div key={key}>
      <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">{label}</Label>
      {multiline ? (
        <Textarea
          value={String(form?.[key] ?? "")}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="border-slate-200 text-sm resize-none"
          placeholder={placeholder}
          rows={3}
        />
      ) : (
        <Input
          type={type}
          value={String(form?.[key] ?? "")}
          onChange={e => setForm(f => ({ ...f, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
          className="border-slate-200 text-sm"
          placeholder={placeholder}
        />
      )}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold text-slate-900 tracking-tight"
            style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
          >
            Courses
          </h1>
          <p className="text-slate-500 text-sm mt-1">{courses.length} course{courses.length !== 1 ? "s" : ""} total</p>
        </div>
        <Button
          onClick={() => openForm()}
          className="btn-brand-navy text-white rounded-full text-sm font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Course
        </Button>
      </div>

      {actionError && (
        <div className="flex items-center gap-2.5 text-sm px-4 py-3 rounded-xl border bg-red-50 border-red-200 text-red-600 mb-6">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <p className="text-sm text-slate-500">{error}</p>
          <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </Button>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <p className="text-slate-400 text-sm col-span-3 text-center py-12">Loading…</p>
        ) : courses.length === 0 ? (
          <div className="col-span-3 text-center py-16">
            <p className="text-slate-400 mb-4">No courses yet</p>
            <Button onClick={() => openForm()} className="btn-brand-navy text-white rounded-full">
              <Plus className="w-4 h-4 mr-1.5" /> Create First Course
            </Button>
          </div>
        ) : courses.map(c => (
          <Card key={c._id} className="pcb-card border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div
              className="h-1"
              style={{
                background: c.isActive
                  ? "linear-gradient(to right, var(--brand-navy), var(--brand-red))"
                  : "#e2e8f0",
              }}
            />
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-bold text-slate-900 text-base leading-tight">{c.title}</h3>
                <Badge className={`text-xs shrink-0 ${LEVEL_COLORS[c.level]}`}>{c.level}</Badge>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-2">{c.description || "No description"}</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-4">
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 shrink-0" /> Ages: {c.ageRange}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 shrink-0" /> {c.duration || "—"}</span>
                <span className="col-span-2 flex items-center gap-1.5 truncate"><UserCog className="w-3.5 h-3.5 shrink-0" /> {c.instructors.length ? c.instructors.map(i => i.name).join(", ") : "—"}</span>
                <span className="flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 shrink-0" /> LKR {c.price.toLocaleString()}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 shrink-0" /> {c.schedule || "—"}</span>
                <span className="col-span-2 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 shrink-0" /> {c.enrolledCount}/{c.maxStudents} students</span>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleToggle(c)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                    c.isActive ? "text-green-600 bg-green-50 hover:bg-green-100" : "text-slate-400 bg-slate-100 hover:bg-slate-200"
                  }`}
                >
                  {c.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                  {c.isActive ? "Active" : "Inactive"}
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => openForm(c)}
                  className="p-2.5 -m-1 rounded-lg text-slate-400 hover:text-[color:var(--brand-navy)] hover:bg-slate-100 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(c._id)}
                  className="p-2.5 -m-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      )}

      {/* Add / Edit Panel */}
      {form && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setForm(null)} />
          <div className="w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">{form._id ? "Edit Course" : "New Course"}</h3>
              <button onClick={() => setForm(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {field("title",       "Course Title")}
              {field("description", "Description", "text", true)}
              {field("ageRange",    "Age Range",   "text")}
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Level</Label>
                <div className="flex gap-2">
                  {LEVELS.map(l => (
                    <button
                      key={l}
                      onClick={() => setForm(f => ({ ...f, level: l }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        form.level === l ? LEVEL_COLORS[l] : "border-slate-200 text-slate-400"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {field("duration",    "Duration",    "text")}
              {field("schedule",    "Schedule",    "text")}
              {field("price",       "Price (LKR)", "number")}

              {/* Instructors — multi-select from the Instructors backend */}
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Instructors
                </Label>
                {instructors.length === 0 ? (
                  <p className="text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg px-3 py-3">
                    No instructors yet — add some in the Instructors section first.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-40 overflow-y-auto">
                    {instructors.map(ins => {
                      const checked = selectedInstructorIds.includes(ins._id);
                      return (
                        <button
                          key={ins._id}
                          type="button"
                          onClick={() => toggleInstructor(ins._id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                        >
                          <span
                            className={`w-4 h-4 rounded shrink-0 flex items-center justify-center border ${
                              checked ? "text-white" : "border-slate-300 bg-white"
                            }`}
                            style={checked ? { backgroundColor: "var(--brand-navy)", borderColor: "var(--brand-navy)" } : undefined}
                          >
                            {checked && <Check className="w-3 h-3" />}
                          </span>
                          <span className="text-sm text-slate-700 truncate">{ins.name}</span>
                          {ins.title && <span className="text-xs text-slate-400 truncate">· {ins.title}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {field("maxStudents", "Max Students","number")}

              {/* Landing-page card overrides */}
              <div className="pt-2 mt-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Landing Page Card (optional)
                </p>
                <div className="space-y-4">
                  {field("badgeText",   "Badge Text",   "text", false, "Default: Enrolling Now")}
                  {field("ctaLabel",    "CTA Button Text", "text", false, "Default: Register for Free Seminar")}
                  {field("seminarNote", "Highlight Note", "text", true, "Default: Day 1 is a FREE seminar…")}
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setForm(null)}>Cancel</Button>
              <Button className="btn-brand-navy flex-1 text-white" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : form._id ? "Update Course" : "Create Course"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete course?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the course. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
