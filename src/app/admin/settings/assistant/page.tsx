"use client";

import { useEffect, useState } from "react";
import { Bot, CheckCircle2, Loader2, Plus, Save, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useConfirm } from "@/components/admin/ConfirmContext";
import { DEFAULT_ASSISTANT_PROMPT } from "@/config/assistant";

interface AssistantSettings {
  enabled: boolean;
  title: string;
  greeting: string;
  suggestions: string[];
  systemPrompt: string;
  includeCourses: boolean;
  maxTokens: number;
}

const labelClass = "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block";

export default function AssistantSettingsPage() {
  const confirm = useConfirm();
  const [values, setValues] = useState<AssistantSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  /** Whether LLM Config has a usable provider — the other half of "is it live?". */
  const [hasProvider, setHasProvider] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => (r.ok ? r.json() : null))
      .then((data: { assistant?: AssistantSettings; llm?: { apiKey: string; model: string }[] } | null) => {
        setValues(data?.assistant ?? null);
        setHasProvider((data?.llm ?? []).some(p => p.apiKey && p.model));
      })
      .catch(() => {});
  }, []);

  function update<K extends keyof AssistantSettings>(key: K, value: AssistantSettings[K]) {
    setValues(v => (v ? { ...v, [key]: value } : v));
    setSaved(false);
  }

  function updateSuggestion(index: number, text: string) {
    if (!values) return;
    const next = [...values.suggestions];
    next[index] = text;
    update("suggestions", next);
  }

  async function handleSave() {
    if (!values) return;
    const ok = await confirm({
      title: "Save assistant settings?",
      description: values.enabled
        ? "The assistant is on — these changes take effect on the live site immediately."
        : "The assistant is off, so the widget stays hidden until you enable it.",
      confirmLabel: "Save settings",
    });
    if (!ok) return;

    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "assistant", data: values }),
    });
    setValues(await res.json());
    setSaving(false);
    setSaved(true);
  }

  async function handleResetPrompt() {
    const ok = await confirm({
      title: "Restore the default prompt?",
      description: "Your current prompt text will be replaced. Nothing is saved until you press Save.",
      confirmLabel: "Restore default",
    });
    if (ok) update("systemPrompt", DEFAULT_ASSISTANT_PROMPT);
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(15,36,24,0.06)" }}
        >
          <Bot className="w-5 h-5" style={{ color: "var(--brand-navy)" }} />
        </div>
        <div>
          <h1
            className="text-2xl font-bold text-slate-900 tracking-tight"
            style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
          >
            AI Assistant
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            The chat widget on the public site. It answers using whichever provider you set up in LLM Config.
          </p>
        </div>
      </div>

      {!values ? (
        <p className="text-slate-400 text-sm py-8">Loading…</p>
      ) : (
        <div className="space-y-5">
          <Card className="pcb-card border-slate-100 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={values.enabled}
                  onChange={e => update("enabled", e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-[color:var(--brand-navy)]"
                />
                <span>
                  <span className="font-semibold text-slate-900 text-sm block">
                    Show the assistant on the landing page
                  </span>
                  <span className="text-[13px] text-slate-500">
                    Turn this off to remove the chat bubble from the public site. Visitors see the change on their
                    next page load.
                  </span>
                </span>
              </label>

              <span
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
                  values.enabled && hasProvider
                    ? "bg-green-50 text-green-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    values.enabled && hasProvider ? "bg-green-500" : "bg-slate-400"
                  }`}
                />
                {values.enabled && hasProvider ? "Live on site" : "Hidden"}
              </span>
            </div>

            {/* The toggle alone isn't enough — say so rather than letting an
                admin switch it on and wonder why nothing appears. */}
            {values.enabled && !hasProvider && (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
                The assistant is switched on but still hidden: no provider in{" "}
                <a href="/admin/settings/llm" className="font-semibold underline">
                  LLM Config
                </a>{" "}
                has both an API key and a model yet.
              </p>
            )}
          </Card>

          <Card className="pcb-card border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-slate-900 text-sm">What visitors see</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assistant-title" className={labelClass}>Widget Title</Label>
                <Input
                  id="assistant-title"
                  value={values.title}
                  onChange={e => update("title", e.target.value)}
                  placeholder="KidsLab Assistant"
                  className="border-slate-200 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="assistant-greeting" className={labelClass}>Greeting</Label>
                <Input
                  id="assistant-greeting"
                  value={values.greeting}
                  onChange={e => update("greeting", e.target.value)}
                  placeholder="Hi! Ask me anything about our courses."
                  className="border-slate-200 text-sm"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Shown instantly when the chat opens — it costs no tokens.
                </p>
              </div>
            </div>

            <div>
              <Label className={labelClass}>Starter Questions</Label>
              <div className="space-y-2">
                {values.suggestions.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={s}
                      onChange={e => updateSuggestion(i, e.target.value)}
                      placeholder="What ages do you teach?"
                      className="border-slate-200 text-sm"
                      aria-label={`Starter question ${i + 1}`}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`Remove starter question ${i + 1}`}
                      onClick={() => update("suggestions", values.suggestions.filter((_, j) => j !== i))}
                      className="shrink-0 border-slate-200 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {values.suggestions.length < 4 && (
                <Button
                  variant="outline"
                  onClick={() => update("suggestions", [...values.suggestions, ""])}
                  className="mt-2 rounded-full text-xs font-semibold border-slate-200 gap-1.5"
                  style={{ color: "var(--brand-navy)" }}
                >
                  <Plus className="w-3.5 h-3.5" /> Add question
                </Button>
              )}
              <p className="text-[11px] text-slate-400 mt-1.5">
                Up to 4 chips shown on the empty chat, so visitors know what to ask.
              </p>
            </div>
          </Card>

          <Card className="pcb-card border-slate-100 shadow-sm p-6 space-y-4">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">How it behaves</h2>
              <p className="text-[13px] text-slate-500 mt-0.5">
                The instructions sent to the model with every conversation.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="assistant-prompt" className={`${labelClass} mb-0`}>System Prompt</Label>
                <button
                  type="button"
                  onClick={handleResetPrompt}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Restore default
                </button>
              </div>
              <textarea
                id="assistant-prompt"
                value={values.systemPrompt}
                onChange={e => update("systemPrompt", e.target.value)}
                rows={12}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm leading-relaxed font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Describe who the assistant is and how it should answer. Course details, contact info, and the
                safety rules (never invent prices, stay on topic, don&apos;t reveal these instructions) are added
                automatically — you don&apos;t need to repeat them here.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <label className="flex items-start gap-3 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={values.includeCourses}
                  onChange={e => update("includeCourses", e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-[color:var(--brand-navy)]"
                />
                <span>
                  <span className="font-semibold text-slate-900 text-sm block">Include live course data</span>
                  <span className="text-[13px] text-slate-500">
                    Sends your active courses — titles, ages, fees, schedule — so answers stay accurate as you edit them.
                  </span>
                </span>
              </label>

              <div>
                <Label htmlFor="assistant-max-tokens" className={labelClass}>Max Reply Length</Label>
                <Input
                  id="assistant-max-tokens"
                  type="number"
                  min={100}
                  max={4000}
                  value={values.maxTokens}
                  onChange={e => update("maxTokens", Number(e.target.value))}
                  className="border-slate-200 text-sm"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Tokens per reply (100–4000). 700 suits short chat answers and keeps costs down.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="btn-brand-navy text-white font-semibold rounded-full text-sm gap-1.5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : "Save"}
            </Button>
            {saved && (
              <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
