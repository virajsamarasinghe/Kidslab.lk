"use client";

import { useEffect, useState } from "react";
import { Send, BrainCircuit, Layers3, ShieldCheck, ArrowRight, Bot, Globe } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAdminProfile } from "@/components/admin/AdminProfileContext";
import { can } from "@/lib/roles";

const sections = [
  { key: "admins",    label: "Administrators",   href: "/admin/settings/admins",    icon: ShieldCheck,  desc: "Who can sign in to the dashboard, and what each of them may do.", capability: "admins:manage" },
  { key: "brevo",     label: "Brevo Email",     href: "/admin/settings/brevo",     icon: Send,         desc: "Transactional email for welcome messages & notifications." },
  { key: "llm",       label: "LLM Config",       href: "/admin/settings/llm",       icon: BrainCircuit, desc: "Connect any OpenAI-compatible chat model provider." },
  { key: "assistant", label: "AI Assistant",     href: "/admin/settings/assistant", icon: Bot,          desc: "The chat widget on the public site — its prompt, greeting & starter questions." },
  { key: "embedding", label: "Embedding Model",  href: "/admin/settings/embedding", icon: Layers3,      desc: "Connect an embeddings endpoint for search & similarity." },
  { key: "seo",       label: "SEO & AEO",        href: "/admin/settings/seo",       icon: Globe,        desc: "Titles, structured data, FAQ answers, sitemap & AI crawler access." },
] as const;

interface SettingsSnapshot {
  brevo: { smtpUser: string; smtpKey: string; senderEmail: string };
  llm: { apiKey: string; model: string }[];
  embedding: { apiKey: string; model: string };
  assistant: { enabled: boolean };
}

function isConfigured(
  key: (typeof sections)[number]["key"],
  data: SettingsSnapshot | null,
  adminCount: number | null
): boolean | null {
  if (key === "admins") return adminCount === null ? null : adminCount > 0;
  if (!data) return null;
  // Brevo sends over SMTP, so a sender plus SMTP login is what "configured" means.
  if (key === "brevo") return Boolean(data.brevo?.smtpUser && data.brevo?.smtpKey && data.brevo?.senderEmail);
  if (key === "llm") return (data.llm ?? []).some(entry => entry.apiKey && entry.model);
  // Ships with working defaults, so it's never in a "not set up" state — the
  // dot would only ever be green, which tells an admin nothing.
  if (key === "seo") return null;
  // The assistant is a feature toggle rather than a credential — "configured"
  // here means it's actually live for visitors, which needs a usable provider too.
  if (key === "assistant") {
    return Boolean(data.assistant?.enabled) && (data.llm ?? []).some(e => e.apiKey && e.model);
  }
  return Boolean(data.embedding?.apiKey && data.embedding?.model);
}

export default function AdminSettingsOverview() {
  const profile = useAdminProfile();
  const [data, setData] = useState<SettingsSnapshot | null>(null);
  const [adminCount, setAdminCount] = useState<number | null>(null);

  const canManageAdmins = can(profile.role, "admins:manage");

  useEffect(() => {
    fetch("/api/settings")
      .then(r => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!canManageAdmins) return;
    fetch("/api/admin/admins")
      .then(r => (r.ok ? r.json() : []))
      .then((rows: unknown[]) => setAdminCount(rows.length))
      .catch(() => {});
  }, [canManageAdmins]);

  const visibleSections = sections.filter(s => !("capability" in s) || canManageAdmins);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1
          className="text-2xl font-bold text-slate-900 tracking-tight"
          style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
        >
          Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">Integrations & API connections for the platform.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {visibleSections.map(({ key, label, href, icon: Icon, desc }) => {
          const configured = isConfigured(key, data, adminCount);
          return (
            <a key={href} href={href}>
              <Card className="pcb-card border-slate-100 shadow-sm p-4 sm:p-6 h-full hover:shadow-md transition-shadow">
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
                    {configured === null
                      ? ""
                      : key === "admins"
                        ? `${adminCount} active`
                        : key === "assistant"
                          ? configured ? "Live" : "Off"
                          : configured ? "Configured" : "Not configured"}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1.5">{label}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">{desc}</p>
                <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--brand-red)" }}>
                  {key === "admins" ? "Manage" : "Configure"} <ArrowRight className="w-3 h-3" />
                </span>
              </Card>
            </a>
          );
        })}
      </div>
    </div>
  );
}
