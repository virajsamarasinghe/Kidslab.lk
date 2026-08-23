"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Trash2, Pencil, X, Mail, UserRound, Camera, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Instructor } from "@/types/instructor";
import { useConfirm } from "@/components/admin/ConfirmContext";

const EMPTY: Omit<Instructor, "_id" | "createdAt"> = {
  name: "", title: "", bio: "", photo: "", email: "",
};

export default function AdminInstructors() {
  const confirm = useConfirm();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Instructor> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/instructors");
      if (!res.ok) throw new Error("Failed to load instructors");
      const data = await res.json();
      setInstructors(data.instructors ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load instructors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!form?.name) return;
    const ok = await confirm({
      title: form._id ? "Save changes to this instructor?" : "Add this instructor?",
      description: `${form.name}'s profile will be ${form._id ? "updated" : "added"} on the public site.`,
      confirmLabel: form._id ? "Save changes" : "Add instructor",
    });
    if (!ok) return;
    setSaving(true);
    setActionError("");
    try {
      const res = form._id
        ? await fetch(`/api/instructors/${form._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          })
        : await fetch("/api/instructors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
      if (!res.ok) throw new Error("Failed to save instructor");
      setForm(null);
      load();
    } catch {
      setActionError("Couldn't save the instructor — try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/instructors/photo", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setForm(f => ({ ...f, photo: data.photo }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setActionError("");
    try {
      const res = await fetch(`/api/instructors/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete instructor");
      setDeleteId(null);
      load();
    } catch {
      setActionError("Couldn't remove the instructor — try again.");
    }
  }

  const field = (key: keyof Instructor, label: string, multiline = false) => (
    <div key={key}>
      <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">{label}</Label>
      {multiline ? (
        <Textarea
          value={String(form?.[key] ?? "")}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="border-slate-200 text-sm resize-none"
          rows={3}
        />
      ) : (
        <Input
          value={String(form?.[key] ?? "")}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="border-slate-200 text-sm"
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
            Instructors
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {instructors.length} instructor{instructors.length !== 1 ? "s" : ""} · assignable to courses
          </p>
        </div>
        <Button
          onClick={() => { setForm({ ...EMPTY }); setUploadError(""); }}
          className="btn-brand-navy text-white rounded-full text-sm font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Instructor
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <p className="text-slate-400 text-sm col-span-3 text-center py-12">Loading…</p>
        ) : instructors.length === 0 ? (
          <div className="col-span-3 text-center py-16">
            <p className="text-slate-400 mb-4">No instructors yet</p>
            <Button onClick={() => { setForm({ ...EMPTY }); setUploadError(""); }} className="btn-brand-navy text-white rounded-full">
              <Plus className="w-4 h-4 mr-1.5" /> Add First Instructor
            </Button>
          </div>
        ) : instructors.map(ins => (
          <Card key={ins._id} className="pcb-card border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-white font-semibold"
                  style={{ background: "linear-gradient(135deg, var(--brand-navy), var(--brand-blue))" }}
                >
                  {ins.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ins.photo} alt={ins.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <UserRound className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-base leading-tight truncate">{ins.name}</h3>
                  <p className="text-slate-500 text-xs mt-0.5 truncate">{ins.title || "—"}</p>
                </div>
              </div>
              {ins.bio && (
                <p className="text-slate-500 text-sm leading-relaxed mb-3 line-clamp-2">{ins.bio}</p>
              )}
              {ins.email && (
                <p className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
                  <Mail className="w-3.5 h-3.5 shrink-0" /> {ins.email}
                </p>
              )}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <div className="flex-1" />
                <button
                  onClick={() => { setForm({ ...ins }); setUploadError(""); }}
                  className="p-2.5 -m-1 rounded-lg text-slate-400 hover:text-[color:var(--brand-navy)] hover:bg-slate-100 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(ins._id)}
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
              <h3 className="font-semibold text-slate-900">{form._id ? "Edit Instructor" : "New Instructor"}</h3>
              <button onClick={() => setForm(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Photo</Label>
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div
                      className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-white"
                      style={{ background: "linear-gradient(135deg, var(--brand-navy), var(--brand-blue))" }}
                    >
                      {form?.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={form.photo} alt={form.name || "Instructor"} className="w-full h-full object-cover" />
                      ) : (
                        <UserRound className="w-6 h-6" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50"
                      aria-label="Change instructor photo"
                    >
                      {uploading ? (
                        <Loader2 className="w-3 h-3 animate-spin" style={{ color: "var(--brand-navy)" }} />
                      ) : (
                        <Camera className="w-3 h-3" style={{ color: "var(--brand-navy)" }} />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </div>
                  <p className="text-xs text-slate-500">JPG, PNG, WEBP or GIF. Max 5MB.</p>
                </div>
                {uploadError && <p className="text-xs text-red-600 mt-1.5">{uploadError}</p>}
              </div>
              {field("name",  "Full Name")}
              {field("title", "Title / Role")}
              {field("bio",   "Short Bio", true)}
              {field("email", "Email")}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setForm(null)}>Cancel</Button>
              <Button className="btn-brand-navy flex-1 text-white" onClick={handleSave} disabled={saving || !form.name}>
                {saving ? "Saving…" : form._id ? "Update Instructor" : "Create Instructor"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove instructor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this instructor. Courses they&apos;re assigned to will keep their other instructors.
            </AlertDialogDescription>
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
