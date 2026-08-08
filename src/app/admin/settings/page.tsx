"use client";

import { useEffect, useState } from "react";
import { Send, BrainCircuit, Layers3, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

const sections = [
  { key: "brevo",     label: "Brevo Email",     href: "/admin/settings/brevo",     icon: Send,         desc: "Transactional email for welcome messages & notifications." },
  { key: "llm",       label: "LLM Config",       href: "/admin/settings/llm",       icon: BrainCircuit, desc: "Connect any OpenAI-compatible chat model provider." },
  { key: "embedding", label: "Embedding Model",  href: "/admin/settings/embedding", icon: Layers3,      desc: "Connect an embeddings endpoint for search & similarity." },
] as const;

interface SettingsSnapshot {
  brevo: { apiKey: string; senderEmail: string };
  llm: { apiKey: string; model: string }[];
  embedding: { apiKey: string; model: string };
}

function isConfigured(key: (typeof sections)[number]["key"], data: SettingsSnapshot | null): boolean | null {
  if (!data) return null;
  if (key === "brevo") return Boolean(data.brevo?.apiKey && data.brevo?.senderEmail);
  if (key === "llm") return (data.llm ?? []).some(entry => entry.apiKey && entry.model);
  return Boolean(data.embedding?.apiKey && data.embedding?.model);
}

export default function AdminSettingsOverview() {
  const [data, setData] = useState<SettingsSnapshot | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {});
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-slate-900 tracking-tight"
          style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
        >
          Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">Integrations & API connections for the platform.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {sections.map(({ key, label, href, icon: Icon, desc }) => {
          const configured = isConfigured(key, data);
          return (
            <a key={href} href={href}>
              <Card className="pcb-card border-slate-100 shadow-sm p-6 h-full hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "rgba(15,36,24,0.06)" }}
                  >
                    <Icon className="w-5 h-5" style={{ color: "var(--brand-navy)" }} />
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        configured === null ? "bg-slate-200 animate-pulse" : configured ? "bg-green-500" : "bg-slate-300"
                      }`}
                    />
                    {configured === null ? "" : configured ? "Configured" : "Not configured"}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1.5">{label}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">{desc}</p>
                <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--brand-red)" }}>
                  Configure <ArrowRight className="w-3 h-3" />
                </span>
              </Card>
            </a>
          );
        })}
      </div>
    </div>
  );
}
