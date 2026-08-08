"use client";

import { Send, BrainCircuit, Layers3, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

const sections = [
  { label: "Brevo Email", href: "/admin/settings/brevo", icon: Send, desc: "Transactional email for welcome messages & notifications." },
  { label: "LLM Config", href: "/admin/settings/llm", icon: BrainCircuit, desc: "Connect any OpenAI-compatible chat model provider." },
  { label: "Embedding Model", href: "/admin/settings/embedding", icon: Layers3, desc: "Connect an embeddings endpoint for search & similarity." },
];

export default function AdminSettingsOverview() {
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
        {sections.map(({ label, href, icon: Icon, desc }) => (
          <a key={href} href={href}>
            <Card className="pcb-card border-slate-100 shadow-sm p-6 h-full hover:shadow-md transition-shadow">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: "rgba(15,36,24,0.06)" }}
              >
                <Icon className="w-5 h-5" style={{ color: "var(--brand-navy)" }} />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">{label}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">{desc}</p>
              <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--brand-red)" }}>
                Configure <ArrowRight className="w-3 h-3" />
              </span>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
