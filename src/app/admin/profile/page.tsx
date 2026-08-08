"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, CheckCircle2, Loader2, Save, ShieldCheck, UserCog, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAdminProfile } from "@/components/admin/AdminProfileContext";

type Notice = { success: boolean; message: string } | null;

export default function AdminProfilePage() {
  const profile = useAdminProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    setNotice(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/profile/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      profile.setProfile({ avatar: data.avatar });
      setNotice({ success: true, message: "Profile photo updated" });
    } catch (err) {
      setNotice({ success: false, message: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (newPassword && newPassword !== confirmPassword) {
      setNotice({ success: false, message: "New passwords do not match" });
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          ...(newPassword ? { currentPassword, newPassword } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save changes");

      profile.setProfile({ name: data.name, email: data.email });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice({ success: true, message: "Profile updated" });
    } catch (err) {
      setNotice({ success: false, message: err instanceof Error ? err.message : "Could not save changes" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(15,36,24,0.06)" }}
        >
          <UserCog className="w-5 h-5" style={{ color: "var(--brand-navy)" }} />
        </div>
        <div>
          <h1
            className="text-2xl font-bold text-slate-900 tracking-tight"
            style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
          >
            My Profile
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your admin account details and photo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar card */}
        <Card className="pcb-card border-slate-100 shadow-sm p-6 lg:col-span-1 h-fit">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="relative shrink-0">
              <div
                className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, var(--brand-red), var(--brand-yellow))" }}
              >
                {profile.avatar ? (
                  <Image src={profile.avatar} alt={profile.name} width={112} height={112} className="w-full h-full object-cover" />
                ) : (
                  <ShieldCheck className="w-10 h-10 text-white" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50"
                aria-label="Change profile photo"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--brand-navy)" }} />
                ) : (
                  <Camera className="w-4 h-4" style={{ color: "var(--brand-navy)" }} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{profile.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{profile.email}</p>
            </div>
            <p className="text-xs text-slate-400">JPG, PNG, WEBP or GIF. Max 5MB.</p>
          </div>
        </Card>

        {/* Details + password */}
        <Card className="pcb-card border-slate-100 shadow-sm p-6 lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} className="border-slate-200 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="border-slate-200 text-sm" />
            </div>
          </div>

          {/* Password */}
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-3">Change password</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Current Password</Label>
                <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="border-slate-200 text-sm" placeholder="••••••••" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">New Password</Label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="border-slate-200 text-sm" placeholder="••••••••" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Confirm New Password</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="border-slate-200 text-sm" placeholder="••••••••" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Leave blank to keep your current password.</p>
          </div>

          {notice && (
            <div
              className={`flex items-start gap-2.5 text-sm px-4 py-3 rounded-xl border ${
                notice.success
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}
            >
              {notice.success ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
              )}
              <span className="break-words">{notice.message}</span>
            </div>
          )}

          <div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="btn-brand-navy text-white font-semibold rounded-full text-sm gap-1.5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
