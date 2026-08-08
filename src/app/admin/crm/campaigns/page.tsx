"use client";

import { useEffect, useState, useCallback } from "react";
import { Send, Loader2, CheckCircle2, XCircle, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Campaign, CampaignSegment } from "@/types/crm";

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
  failed: "bg-red-50 text-red-600 border-red-200",
};

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-sm outline-none transition-colors focus-visible:border-slate-400";

export default function CrmCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [segment, setSegment] = useState<CampaignSegment>("all_contacts");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/crm/campaigns");
    const data = await res.json();
    setCampaigns(data.campaigns ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    setError("");
    const res = await fetch("/api/crm/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body, segment }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to send campaign");
      return;
    }
    setSubject("");
    setBody("");
    load();
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-slate-900 tracking-tight"
          style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
        >
          Email Marketing
        </h1>
        <p className="text-slate-500 text-sm mt-1">Send bulk email campaigns via your connected Brevo account.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6 mb-8">
        <Card className="pcb-card border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
            <Megaphone className="w-4 h-4" style={{ color: "var(--brand-red)" }} />
            Compose Campaign
          </h2>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Audience</Label>
              <select className={selectClass} value={segment} onChange={e => setSegment(e.target.value as CampaignSegment)}>
                {SEGMENTS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
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
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim()}
              className="btn-brand-navy text-white font-semibold rounded-full text-sm gap-1.5"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? "Sending…" : "Send Campaign"}
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
                <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">Loading…</td></tr>
              ) : campaigns.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">No campaigns sent yet</td></tr>
              ) : campaigns.map(c => (
                <tr key={c._id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-900 max-w-[240px] truncate">{c.subject}</td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {SEGMENTS.find(s => s.value === c.segment)?.label ?? c.segment}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge className={`text-xs ${STATUS_COLORS[c.status]}`}>
                      {c.status === "sent" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {c.status === "failed" && <XCircle className="w-3 h-3 mr-1" />}
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
    </div>
  );
}
