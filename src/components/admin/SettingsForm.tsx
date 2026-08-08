"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, XCircle, Loader2, Save, Zap, Mail, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export interface SettingsField {
  key: string;
  label: string;
  type?: "text" | "password";
  placeholder?: string;
  helper?: string;
}

interface SettingsFormProps {
  section: "brevo" | "llm" | "embedding";
  title: string;
  description: string;
  icon: LucideIcon;
  fields: SettingsField[];
  /** Adds a "send a real email to this address" row — email sections only. */
  allowTestEmail?: boolean;
}

type Result = { success: boolean; message: string } | null;

export default function SettingsForm({ section, title, description, icon: Icon, fields, allowTestEmail }: SettingsFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [saved, setSaved] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/settings");
    const data = await res.json();
    setValues(data[section] ?? {});
    setLoading(false);
  }, [section]);

  useEffect(() => { load(); }, [load]);

  function update(key: string, value: string) {
    setValues(v => ({ ...v, [key]: value }));
    setSaved(false);
    setResult(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, data: values }),
    });
    const data = await res.json();
    setValues(data);
    setSaving(false);
    setSaved(true);
  }

  async function handleTest() {
    setTesting(true);
    setResult(null);
    const res = await fetch("/api/settings/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, data: values }),
    });
    const data = await res.json();
    setResult(data);
    setTesting(false);
  }

  async function handleSendTestEmail() {
    setSendingTest(true);
    setResult(null);
    // Posts the on-screen values too, so the config can be tried before saving.
    const res = await fetch("/api/settings/test-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, data: values }),
    });
    const data = await res.json();
    setResult(data);
    setSendingTest(false);
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(15,36,24,0.06)" }}
        >
          <Icon className="w-5 h-5" style={{ color: "var(--brand-navy)" }} />
        </div>
        <div>
          <h1
            className="text-2xl font-bold text-slate-900 tracking-tight"
            style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
          >
            {title}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{description}</p>
        </div>
      </div>

      <div className="w-full">
        <Card className="pcb-card border-slate-100 shadow-sm p-6">
          {loading ? (
            <p className="text-slate-400 text-sm text-center py-8">Loading…</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {fields.map(f => (
                  <div key={f.key}>
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                      {f.label}
                    </Label>
                    <Input
                      type={f.type ?? "text"}
                      value={values[f.key] ?? ""}
                      onChange={e => update(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="border-slate-200 text-sm"
                    />
                    {f.helper && <p className="text-[11px] text-slate-400 mt-1">{f.helper}</p>}
                  </div>
                ))}
              </div>

              {allowTestEmail && (
                <div className="border-t border-slate-100 pt-4">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Send a Test Email
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
                    <div className="flex-1 min-w-0">
                      <Input
                        type="email"
                        value={testEmail}
                        onChange={e => { setTestEmail(e.target.value); setResult(null); }}
                        placeholder="you@example.com"
                        className="border-slate-200 text-sm"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Delivers a real email using the values above — no need to save first.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleSendTestEmail}
                      disabled={sendingTest || !testEmail.trim()}
                      className="rounded-full text-sm font-semibold border-slate-200 gap-1.5 shrink-0"
                      style={{ color: "var(--brand-navy)" }}
                    >
                      {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      {sendingTest ? "Sending…" : "Send Test"}
                    </Button>
                  </div>
                </div>
              )}

              {result && (
                <div
                  className={`flex items-start gap-2.5 text-sm px-4 py-3 rounded-xl border ${
                    result.success
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-600"
                  }`}
                >
                  {result.success ? (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  )}
                  <span>{result.message}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-brand-navy text-white font-semibold rounded-full text-sm gap-1.5"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving…" : "Save"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTest}
                  disabled={testing}
                  className="rounded-full text-sm font-semibold border-slate-200 gap-1.5"
                  style={{ color: "var(--brand-navy)" }}
                >
                  {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {testing ? "Testing…" : "Test Connection"}
                </Button>
                {saved && (
                  <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
