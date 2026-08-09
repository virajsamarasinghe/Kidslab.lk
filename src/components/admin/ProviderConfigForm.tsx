"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { CheckCircle2, XCircle, Loader2, Save, Zap, Plus, Trash2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useConfirm } from "./ConfirmContext";
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

type StoredEntry = { provider?: string; baseUrl?: string; apiKey?: string; model?: string; priority?: number };
type Result = { success: boolean; message: string } | null;

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-sm outline-none transition-colors focus-visible:border-slate-400";

const PRIORITY_LABELS: Record<number, string> = {
  1: "1 — Try first",
  2: "2",
  3: "3 — Default",
  4: "4",
  5: "5 — Try last",
};

// The "llm" section stores a list of providers (with fallback priority); the
// "embedding" section stores a single provider. Both are edited through this
// same form — for "llm" we render one card per stored entry plus an "Add
// provider" affordance; for "embedding" we render a single card as before.
export default function ProviderConfigForm({ section, title, description, icon: Icon, providers, keyPlaceholder }: ProviderConfigFormProps) {
  const confirm = useConfirm();
  const isList = section === "llm";
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<StoredEntry[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/settings");
    const data = await res.json();
    const stored = data[section];
    setEntries(isList ? (Array.isArray(stored) ? stored : []) : [stored ?? {}]);
    setLoading(false);
  }, [section, isList]);

  useEffect(() => { load(); }, [load]);

  function addEntry() {
    setEntries(prev => [...prev, { priority: 3 }]);
  }

  async function removeEntry(index: number) {
    const entry = entries[index];
    const isSaved = isList && entry && entry.provider !== undefined;
    if (isSaved) {
      const ok = await confirm({
        title: "Remove this provider?",
        description: "Its stored API key is deleted. Anything relying on it stops working until another provider is configured.",
        confirmLabel: "Remove provider",
        destructive: true,
      });
      if (!ok) return;
    }
    setEntries(prev => prev.filter((_, i) => i !== index));
    // Entries loaded from the server always carry a `provider` key (even ""
    // for an unset one); a freshly added, unsaved row does not — skip the
    // API call for those since there's nothing persisted to delete yet.
    if (isSaved) {
      fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, data: { remove: index } }),
      }).then(() => load());
    }
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

      {loading ? (
        <p className="text-slate-400 text-sm text-center py-8">Loading…</p>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <ProviderEntryCard
              key={index}
              section={section}
              providers={providers}
              keyPlaceholder={keyPlaceholder}
              index={index}
              stored={entry}
              showPriority={isList}
              showRemove={isList && entries.length > 1}
              onRemove={() => removeEntry(index)}
              onSaved={updated => setEntries(prev => prev.map((e, i) => (i === index ? updated : e)))}
            />
          ))}

          {isList && (
            <Button
              variant="outline"
              onClick={addEntry}
              className="rounded-full text-sm font-semibold border-slate-200 gap-1.5"
              style={{ color: "var(--brand-navy)" }}
            >
              <Plus className="w-4 h-4" /> Add provider
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface ProviderEntryCardProps {
  section: "llm" | "embedding";
  providers: ProviderPreset[];
  keyPlaceholder?: string;
  index: number;
  stored: StoredEntry;
  showPriority: boolean;
  showRemove: boolean;
  onRemove: () => void;
  onSaved: (entry: StoredEntry) => void;
}

function ProviderEntryCard({
  section, providers, keyPlaceholder, index, stored, showPriority, showRemove, onRemove, onSaved,
}: ProviderEntryCardProps) {
  const confirm = useConfirm();
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
  const [priority, setPriority] = useState(3);

  const activePreset = useMemo(() => findProvider(providers, providerId), [providers, providerId]);

  const applyLoaded = useCallback((data: StoredEntry) => {
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
    setPriority(data.priority ?? 3);

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

  useEffect(() => { applyLoaded(stored); }, [applyLoaded, stored]);

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
      ...(showPriority ? { priority, index } : {}),
    };
  }

  async function handleSave() {
    const ok = await confirm({
      title: "Save this provider?",
      description: "The stored credentials for this provider are replaced with the values on screen.",
      confirmLabel: "Save provider",
    });
    if (!ok) return;
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, data: buildPayload() }),
    });
    const data = await res.json();
    const savedEntry = showPriority ? data[index] : data;
    applyLoaded(savedEntry);
    onSaved(savedEntry);
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
    <Card className="pcb-card border-slate-100 shadow-sm p-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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

          {showPriority && (
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Priority
              </Label>
              <select
                className={selectClass}
                value={priority}
                onChange={e => { setPriority(Number(e.target.value)); setSaved(false); setResult(null); }}
              >
                {[1, 2, 3, 4, 5].map(p => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>
          )}

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
          {showRemove && (
            <Button
              variant="outline"
              onClick={onRemove}
              className="rounded-full text-sm font-semibold border-slate-200 gap-1.5 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" /> Remove
            </Button>
          )}
          {saved && (
            <span className="text-xs font-medium text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
