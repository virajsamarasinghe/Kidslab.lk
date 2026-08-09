"use client";

import { useEffect, useState, useCallback } from "react";
import { Send, Loader2, CheckCircle2, XCircle, Megaphone, AlertTriangle } from "lucide-react";
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
import type { Campaign, CampaignSegment } from "@/types/crm";
import { CrmHeader } from "@/components/admin/crm/CrmHeader";

const SEGMENTS: { value: CampaignSegment; label: string }[] = [
  { value: "all_contacts", label: "All Contacts" },
  { value: "all_subscribers", label: "Newsletter Subscribers" },
  { value: "all_students", label: "All Students" },
  { value: "active_students", label: "Active Students" },
  { value: "inactive_students", label: "Inactive Students" },
];

const STATUS_COLORS: Record<Campaign["status"], string> = {
  draft: "bg-slate-100 text-slate-500 border-slate-200",
  sending: "bg-amber-50 text-amber-700 border-amber-200",
  sent: "bg-green-50 text-green-700 border-green-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-600 border-red-200",
};

const STATUS_DOTS: Record<Campaign["status"], string> = {
  draft: "#94a3b8",
  sending: "#d97706",
  sent: "#16a34a",
  partial: "#d97706",
  failed: "#dc2626",
};

export default function CrmCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [segment, setSegment] = useState<CampaignSegment>("all_contacts");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [confirmCount, setConfirmCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openConfirm() {
    if (!subject.trim() || !body.trim()) return;
    setError("");
    setCountLoading(true);
    try {
      const res = await fetch(`/api/crm/segment-count?segment=${segment}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to resolve audience size");
        return;
      }
      setConfirmCount(data.count);
    } finally {
      setCountLoading(false);
    }
  }

  async function handleSend() {
    setConfirmCount(null);
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/crm/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, segment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send campaign");
        return;
      }
      setSubject("");
      setBody("");
      load();
    } catch {
      setError("Failed to send campaign");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-8">
      <CrmHeader
        title="Email Marketing"
        subtitle="Send bulk email campaigns via your connected Brevo account."
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6 mb-8">
        <Card className="pcb-card border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
            <Megaphone className="w-4 h-4" style={{ color: "var(--brand-red)" }} />
            Compose Campaign
          </h2>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Audience</Label>
              <div className="flex flex-wrap gap-2">
                {SEGMENTS.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSegment(s.value)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                      segment === s.value
                        ? "text-white border-transparent"
                        : "text-slate-500 border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    style={segment === s.value ? { backgroundColor: "var(--brand-navy)" } : undefined}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Subject</Label>
              <Input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. New batch starting in July!"
                className="border-slate-200 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Message (HTML)</Label>
              <Textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="<p>Hi there! We've got exciting news...</p>"
                className="border-slate-200 text-sm resize-none font-mono"
                rows={8}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 text-sm px-4 py-3 rounded-xl border bg-red-50 border-red-200 text-red-600">
                <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              onClick={openConfirm}
              disabled={sending || countLoading || !subject.trim() || !body.trim()}
              className="btn-brand-navy text-white font-semibold rounded-full text-sm gap-1.5"
            >
              {sending || countLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? "Sending…" : countLoading ? "Checking audience…" : "Send Campaign"}
            </Button>
          </div>
        </Card>

        <Card className="pcb-card border-slate-100 shadow-sm p-6 h-fit">
          <h2 className="font-semibold text-slate-900 text-sm mb-2">How this works</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Emails are sent one-by-one through your Brevo account (configured under Settings → Brevo Email) to
            everyone in the selected audience at the moment you hit send. There&apos;s no scheduling — sending is
            immediate, and each campaign is logged below with a delivery count.
          </p>
        </Card>
      </div>

      <Card className="pcb-card border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 text-sm">Campaign History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Subject", "Audience", "Status", "Sent / Recipients", "Date"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }, (_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    {Array.from({ length: 5 }, (_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <span className="block h-4 w-full max-w-[8rem] rounded bg-slate-100 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <Megaphone className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">No campaigns sent yet</p>
                  </td>
                </tr>
              ) : campaigns.map(c => (
                <tr key={c._id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-900 max-w-[240px] truncate">{c.subject}</td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {SEGMENTS.find(s => s.value === c.segment)?.label ?? c.segment}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge className={`text-xs ${STATUS_COLORS[c.status]}`}>
                      {c.status === "sent" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {c.status === "partial" && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {c.status === "failed" && <XCircle className="w-3 h-3 mr-1" />}
                      {(c.status === "draft" || c.status === "sending") && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${c.status === "sending" ? "animate-pulse" : ""}`}
                          style={{ backgroundColor: STATUS_DOTS[c.status] }}
                        />
                      )}
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {c.sentCount} / {c.recipientCount}
                    {c.failedCount > 0 && <span className="text-red-500 ml-1.5">({c.failedCount} failed)</span>}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                    {new Date(c.sentAt ?? c.createdAt).toLocaleString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AlertDialog open={confirmCount !== null} onOpenChange={open => !open && setConfirmCount(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send to {confirmCount ?? 0} recipient{confirmCount === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This sends &quot;{subject}&quot; to everyone in {SEGMENTS.find(s => s.value === segment)?.label ?? segment} right
              now. There&apos;s no scheduling or undo — emails go out immediately via your connected Brevo account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="btn-brand-navy text-white" onClick={handleSend}>
              Send Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
