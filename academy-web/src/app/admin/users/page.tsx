"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Trash2, Pencil, X, Check, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { User } from "@/types/user";

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async (q = "") => {
    setLoading(true);
    const res = await fetch(`/api/users?search=${encodeURIComponent(q)}`);
    const data = await res.json();
    setUsers(data.users ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  useEffect(() => {
    const t = setTimeout(() => loadUsers(search), 350);
    return () => clearTimeout(t);
  }, [search, loadUsers]);

  async function handleDelete() {
    if (!deleteId) return;
    await fetch(`/api/users/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    loadUsers(search);
  }

  async function handleSave() {
    if (!editUser) return;
    setSaving(true);
    await fetch(`/api/users/${editUser._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editUser),
    });
    setSaving(false);
    setEditUser(null);
    loadUsers(search);
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Users</h1>
          <p className="text-slate-500 text-sm mt-1">{total} registered student{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Search */}
      <Card className="border-slate-100 shadow-sm mb-6 p-4">
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

      {/* Table */}
      <Card className="border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Name", "Email", "Phone", "Age", "City", "Interested In", "Status", "Joined", "Actions"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-5 py-12 text-center text-slate-400">Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-12 text-center text-slate-400">No users found</td></tr>
              ) : users.map(u => (
                <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">{u.name}</td>
                  <td className="px-5 py-3.5 text-slate-500">{u.email}</td>
                  <td className="px-5 py-3.5 text-slate-500">{u.phone || "—"}</td>
                  <td className="px-5 py-3.5 text-slate-500">{u.age || "—"}</td>
                  <td className="px-5 py-3.5 text-slate-500">{u.city || "—"}</td>
                  <td className="px-5 py-3.5 text-slate-500 max-w-[140px] truncate">{u.interestedCourse || "—"}</td>
                  <td className="px-5 py-3.5">
                    <Badge className={u.status === "active"
                      ? "bg-green-50 text-green-700 border-green-200 text-xs"
                      : "bg-red-50 text-red-600 border-red-200 text-xs"}>
                      {u.status === "active" ? <UserCheck className="w-3 h-3 mr-1" /> : <UserX className="w-3 h-3 mr-1" />}
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditUser(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(u._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Drawer */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setEditUser(null)} />
          <div className="w-full max-w-md bg-white shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-base">Edit Student</h3>
              <button onClick={() => setEditUser(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {([
                ["Name",             "name",             "text"],
                ["Phone",            "phone",            "text"],
                ["Age",              "age",              "number"],
                ["Parent / Guardian","parentName",       "text"],
                ["City",             "city",             "text"],
                ["Interested Course","interestedCourse", "text"],
              ] as [string, keyof User, string][]).map(([label, field, type]) => (
                <div key={field}>
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    {label}
                  </Label>
                  <Input
                    type={type}
                    value={String(editUser[field] ?? "")}
                    onChange={e => setEditUser({ ...editUser, [field]: type === "number" ? Number(e.target.value) : e.target.value })}
                    className="border-slate-200 text-sm"
                  />
                </div>
              ))}
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Status</Label>
                <div className="flex gap-3">
                  {(["active", "inactive"] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setEditUser({ ...editUser, status: s })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                        editUser.status === s
                          ? s === "active" ? "bg-green-50 border-green-300 text-green-700" : "bg-red-50 border-red-300 text-red-600"
                          : "border-slate-200 text-slate-400"
                      }`}
                    >
                      {s === "active" ? <Check className="w-3.5 h-3.5 inline mr-1" /> : <X className="w-3.5 h-3.5 inline mr-1" />}
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete student?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the student record. This cannot be undone.</AlertDialogDescription>
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
