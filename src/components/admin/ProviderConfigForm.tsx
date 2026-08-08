"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { CheckCircle2, XCircle, Loader2, Save, Zap, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  type ProviderPreset, CUSTOM_PROVIDER_ID, CUSTOM_MODEL_VALUE, findProvider,
} from "@/lib/llm-providers";

interface ProviderConfigFormProps {
  section: "llm" | "embedding";
  title: string;
  description: string;
  icon: LucideIcon;
  providers: ProviderPreset[];
  keyPlaceholder?: string;
}

type Result = { success: boolean; message: string } | null;

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-sm outline-none transition-colors focus-visible:border-slate-400";

export default function ProviderConfigForm({ section, title, description, icon: Icon, providers, keyPlaceholder }: ProviderConfigFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [saved, setSaved] = useState(false);

  const defaultProviderId = providers[0]?.id ?? CUSTOM_PROVIDER_ID;

  const [providerId, setProviderId] = useState(defaultProviderId);
  const [customProviderName, setCustomProviderName] = useState("");
  const [baseUrl, setBaseUrl] = useState(providers[0]?.baseUrl ?? "");
  const [apiKey, setApiKey] = useState("");
  const [modelValue, setModelValue] = useState<string>(providers[0]?.models[0]?.value ?? CUSTOM_MODEL_VALUE);
  const [customModelName, setCustomModelName] = useState("");

  const activePreset = useMemo(() => findProvider(providers, providerId), [providers, providerId]);

  const applyLoaded = useCallback((data: { provider?: string; baseUrl?: string; apiKey?: string; model?: string }) => {
    const providerRaw = data.provider ?? "";
    const matchedPreset = findProvider(providers, providerRaw);
    // Nothing saved yet — default to the first known provider instead of
    // "Custom" so the model dropdown isn't left empty on first visit.
    const preset = matchedPreset ?? (!providerRaw ? providers[0] : undefined);

    if (preset) {
      setProviderId(preset.id);
      setCustomProviderName("");
    } else {
      setProviderId(CUSTOM_PROVIDER_ID);
      setCustomProviderName(providerRaw);
    }

    setBaseUrl(data.baseUrl || preset?.baseUrl || "");
    setApiKey(data.apiKey ?? "");

    const modelInPreset = preset?.models.some(m => m.value === data.model);
    if (data.model && modelInPreset) {
      setModelValue(data.model);
      setCustomModelName("");
    } else if (!data.model && preset) {
      setModelValue(preset.models[0]?.value ?? CUSTOM_MODEL_VALUE);
      setCustomModelName("");
    } else {
      setModelValue(CUSTOM_MODEL_VALUE);
      setCustomModelName(data.model ?? "");
    }
  }, [providers]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/settings");
    const data = await res.json();
    applyLoaded(data[section] ?? {});
    setLoading(false);
  }, [section, applyLoaded]);

  useEffect(() => { load(); }, [load]);

  function handleProviderChange(id: string) {
    setProviderId(id);
    setResult(null);
    setSaved(false);
    const preset = findProvider(providers, id);
    if (preset) {
      setBaseUrl(preset.baseUrl);
      setModelValue(preset.models[0]?.value ?? CUSTOM_MODEL_VALUE);
      setCustomModelName("");
    }
  }

  function handleModelChange(value: string) {
    setModelValue(value);
    setResult(null);
    setSaved(false);
  }

  function buildPayload() {
    return {
      provider: providerId === CUSTOM_PROVIDER_ID ? (customProviderName || "Custom") : providerId,
      baseUrl,
      apiKey,
      model: modelValue === CUSTOM_MODEL_VALUE ? customModelName : modelValue,
    };
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, data: buildPayload() }),
    });
    const data = await res.json();
    applyLoaded(data);
    setSaving(false);
    setSaved(true);
  }

  async function handleTest() {
    setTesting(true);
    setResult(null);
    const res = await fetch("/api/settings/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, data: { ...buildPayload(), providerId } }),
    });
    const data = await res.json();
    setResult(data);
    setTesting(false);
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

      <div className="max-w-3xl">
        <Card className="pcb-card border-slate-100 shadow-sm p-6">
          {loading ? (
            <p className="text-slate-400 text-sm text-center py-8">Loading…</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Provider
                  </Label>
                  <select
                    className={selectClass}
                    value={providerId}
                    onChange={e => handleProviderChange(e.target.value)}
                  >
                    {providers.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                    <option value={CUSTOM_PROVIDER_ID}>Custom / Other…</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Model
                  </Label>
                  <select
                    className={selectClass}
                    value={modelValue}
                    onChange={e => handleModelChange(e.target.value)}
                  >
                    {activePreset?.models.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                    <option value={CUSTOM_MODEL_VALUE}>Custom / Other…</option>
                  </select>
                </div>
              </div>

              {providerId === CUSTOM_PROVIDER_ID && (
                <div>
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Provider Name
                  </Label>
                  <Input
                    value={customProviderName}
                    onChange={e => { setCustomProviderName(e.target.value); setSaved(false); setResult(null); }}
                    placeholder="e.g. My Self-hosted Model"
                    className="border-slate-200 text-sm"
                  />
                </div>
              )}

              {modelValue === CUSTOM_MODEL_VALUE && (
                <div>
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Model Name
                  </Label>
                  <Input
                    value={customModelName}
                    onChange={e => { setCustomModelName(e.target.value); setSaved(false); setResult(null); }}
                    placeholder="e.g. gpt-4o-mini"
                    className="border-slate-200 text-sm"
                  />
                </div>
              )}

              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Base URL
                </Label>
                <Input
                  value={baseUrl}
                  onChange={e => { setBaseUrl(e.target.value); setSaved(false); setResult(null); }}
                  placeholder="https://api.openai.com/v1"
                  className="border-slate-200 text-sm"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  API Key
                </Label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={e => { setApiKey(e.target.value); setSaved(false); setResult(null); }}
                  placeholder={keyPlaceholder ?? "sk-…"}
                  className="border-slate-200 text-sm"
                />
              </div>

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
                  <span className="break-words">{result.message}</span>
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
