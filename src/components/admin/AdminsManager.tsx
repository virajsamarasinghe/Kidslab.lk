"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, Loader2, UserPlus, CheckCircle2, XCircle, Trash2, ShieldOff, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAdminProfile } from "./AdminProfileContext";
import { ADMIN_ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, type AdminRole } from "@/lib/roles";
import { useConfirm } from "./ConfirmContext";

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-sm outline-none transition-colors focus-visible:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed";

interface AdminRow {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: "active" | "inactive";
  avatar: string;
  isSelf: boolean;
}

type Result = { success: boolean; message: string } | null;

export default function AdminsManager() {
  const confirm = useConfirm();
  const router = useRouter();
  const profile = useAdminProfile();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<Result>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "viewer" as AdminRole });
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/admins");
    if (res.ok) setAdmins(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    setAdding(true);
    setResult(null);
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setResult({
        success: true,
        message: data.promoted
          ? `${data.email} already had an account — promoted to ${ROLE_LABELS[data.role as AdminRole]}.`
          : `Created ${data.email} as ${ROLE_LABELS[data.role as AdminRole]}.`,
      });
      setForm({ name: "", email: "", password: "", role: "viewer" });
      await load();
    } else {
      setResult({ success: false, message: data.error ?? "Could not add that admin" });
    }
    setAdding(false);
  }

  async function patchAdmin(row: AdminRow, body: Record<string, string>) {
    setBusyId(row.id);
    setResult(null);
    const res = await fetch(`/api/admin/admins/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      setAdmins(prev => prev.map(a => (a.id === row.id ? { ...a, ...data } : a)));
      setResult({ success: true, message: `Updated ${data.email}.` });
      // Changing your own role or status can revoke the access that renders
      // this page, so let the server layout re-evaluate and redirect.
      if (row.isSelf) router.refresh();
    } else {
      setResult({ success: false, message: data.error ?? "Update failed" });
      await load(); // Re-sync the row that optimistically showed a new value.
    }
    setBusyId(null);
  }

  /** Appended to the prompt when the change targets the signed-in admin. */
  function selfWarning(row: AdminRow) {
    return row.isSelf ? " This is your own account — you may lose access to this page." : "";
  }

  async function changeRole(row: AdminRow, role: AdminRole) {
    if (role === row.role) return;
    const ok = await confirm({
      title: `Change ${row.email} to ${ROLE_LABELS[role]}?`,
      description: `${ROLE_DESCRIPTIONS[role]}${selfWarning(row)}`,
      confirmLabel: "Change role",
      destructive: row.isSelf,
    });
    if (!ok) {
      void load(); // Snap the select back to the stored value.
      return;
    }
    void patchAdmin(row, { role });
  }

  async function toggleStatus(row: AdminRow) {
    const next = row.status === "active" ? "inactive" : "active";
    const ok = await confirm({
      title: next === "inactive" ? `Deactivate ${row.email}?` : `Reactivate ${row.email}?`,
      description: next === "inactive"
        ? `They will be signed out and blocked from logging in.${selfWarning(row)}`
        : "They will be able to sign in to the dashboard again.",
      confirmLabel: next === "inactive" ? "Deactivate" : "Reactivate",
      destructive: next === "inactive",
    });
    if (!ok) return;
    void patchAdmin(row, { status: next });
  }

  async function revokeAdmin(row: AdminRow) {
    const ok = await confirm({
      title: row.isSelf ? "Revoke your own access?" : `Revoke access for ${row.email}?`,
      description: row.isSelf
        ? "You will be signed out of the admin area. Your account is kept as a regular user."
        : "Their account is kept as a regular user, with registration history intact.",
      confirmLabel: "Revoke access",
      destructive: true,
    });
    if (!ok) return;

    setBusyId(row.id);
    setResult(null);
    const res = await fetch(`/api/admin/admins/${row.id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      setAdmins(prev => prev.filter(a => a.id !== row.id));
      setResult({ success: true, message: `Revoked access for ${row.email}.` });
      if (row.isSelf) router.refresh();
    } else {
      setResult({ success: false, message: data.error ?? "Could not revoke access" });
    }
    setBusyId(null);
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(15,36,24,0.06)" }}
        >
          <ShieldCheck className="w-5 h-5" style={{ color: "var(--brand-navy)" }} />
        </div>
        <div>
          <h1
            className="text-2xl font-bold text-slate-900 tracking-tight"
            style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
          >
            Administrators
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Who can sign in to the dashboard, and what each of them may do.
          </p>
        </div>
      </div>

      {result && (
        <div
          className={`mb-6 flex items-start gap-2.5 text-sm px-4 py-3 rounded-xl border ${
            result.success
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-600"
          }`}
        >
          {result.success
            ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            : <XCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          <span>{result.message}</span>
        </div>
      )}

      <Card className="pcb-card border-slate-100 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">Add an administrator</h2>
        <p className="text-[11px] text-slate-400 mb-4">
          If the email already belongs to a site user, that account is promoted instead — leave the
          password blank in that case.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Name</Label>
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Jane Perera"
              className="border-slate-200 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="jane@kidslab.lk"
              className="border-slate-200 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Password</Label>
            <Input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="At least 8 characters"
              className="border-slate-200 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Role</Label>
            <select
              className={selectClass}
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as AdminRole }))}
            >
              {ADMIN_ROLES.map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">{ROLE_DESCRIPTIONS[form.role]}</p>
          </div>
        </div>
        <div className="pt-4">
          <Button
            onClick={handleAdd}
            disabled={adding || !emailValid}
            className="btn-brand-navy text-white font-semibold rounded-full text-sm gap-1.5"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {adding ? "Adding…" : "Add Administrator"}
          </Button>
        </div>
      </Card>

      <Card className="pcb-card border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">
          Current administrators {!loading && <span className="text-slate-400 font-normal">({admins.length})</span>}
        </h2>

        {loading ? (
          <p className="text-slate-400 text-sm text-center py-8">Loading…</p>
        ) : admins.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No administrators yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400 border-b border-slate-100">
                  <th className="pb-2 pr-4 font-bold">Administrator</th>
                  <th className="pb-2 pr-4 font-bold">Role</th>
                  <th className="pb-2 pr-4 font-bold">Status</th>
                  <th className="pb-2 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(row => {
                  const busy = busyId === row.id;
                  return (
                    <tr key={row.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-slate-900">
                          {row.name}
                          {row.isSelf && <span className="text-slate-400 font-normal"> (you)</span>}
                        </p>
                        <p className="text-slate-400 text-xs">{row.email}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <select
                          className={`${selectClass} max-w-[10rem]`}
                          value={row.role}
                          disabled={busy}
                          onChange={e => changeRole(row, e.target.value as AdminRole)}
                        >
                          {ADMIN_ROLES.map(r => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium ${
                            row.status === "active" ? "text-green-600" : "text-slate-400"
                          }`}
                        >
                          {row.status === "active" ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-2">
                          {busy && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => toggleStatus(row)}
                            className="rounded-full text-xs font-semibold border-slate-200 gap-1.5"
                            title={row.status === "active" ? "Block sign-in" : "Allow sign-in"}
                          >
                            {row.status === "active"
                              ? <><ShieldOff className="w-3.5 h-3.5" /> Deactivate</>
                              : <><ShieldAlert className="w-3.5 h-3.5" /> Reactivate</>}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => revokeAdmin(row)}
                            className="rounded-full text-xs font-semibold border-red-200 text-red-600 gap-1.5"
                            title="Remove admin access entirely"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Revoke
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[11px] text-slate-400 mt-4">
          Signed in as <strong>{profile.email}</strong> ({ROLE_LABELS[profile.role]}). You can edit your
          own row, but the last active super admin can&apos;t be demoted, deactivated or revoked —
          promote someone else first.
        </p>
      </Card>
    </div>
  );
}
