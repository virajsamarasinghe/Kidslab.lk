"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  FileText,
  Globe,
  HelpCircle,
  Layers,
  Loader2,
  MessageSquareQuote,
  Plus,
  Save,
  Search,
  Share2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useConfirm } from "@/components/admin/ConfirmContext";
import { AI_CRAWLER_AGENTS, type SeoConfig, type SeoPageConfig } from "@/config/seo";

const labelClass = "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block";
const inputClass = "border-slate-200 text-sm";
const areaClass =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm leading-relaxed text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200";

const TABS = [
  { key: "general",  label: "General",      icon: Search },
  { key: "social",   label: "Social cards", icon: Share2 },
  { key: "org",      label: "Organization", icon: Building2 },
  { key: "event",    label: "Seminar",      icon: CalendarClock },
  { key: "pages",    label: "Pages",        icon: Layers },
  { key: "faq",      label: "FAQ",          icon: HelpCircle },
  { key: "facts",    label: "Key facts",    icon: MessageSquareQuote },
  { key: "crawlers", label: "AI crawlers",  icon: Bot },
  { key: "llms",     label: "llms.txt",     icon: FileText },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const CHANGE_FREQUENCIES: SeoPageConfig["changeFrequency"][] = [
  "always", "hourly", "daily", "weekly", "monthly", "yearly", "never",
];

/** Newline-separated text <-> string[], for the list fields. */
function toLines(values: string[]) {
  return values.join("\n");
}
function fromLines(text: string) {
  return text.split("\n").map(v => v.trim()).filter(Boolean);
}

/** Length hint next to a field Google truncates. Amber past the limit, never blocking. */
function CharCount({ value, limit }: { value: string; limit: number }) {
  const over = value.length > limit;
  return (
    <span className={`text-[11px] font-medium ${over ? "text-amber-600" : "text-slate-400"}`}>
      {value.length}/{limit}
    </span>
  );
}

export default function SeoSettingsPage() {
  const confirm = useConfirm();
  const [values, setValues] = useState<SeoConfig | null>(null);
  const [tab, setTab] = useState<TabKey>("general");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => (r.ok ? r.json() : null))
      .then((data: { seo?: SeoConfig } | null) => setValues(data?.seo ?? null))
      .catch(() => {});
  }, []);

  function update<K extends keyof SeoConfig>(key: K, value: SeoConfig[K]) {
    setValues(v => (v ? { ...v, [key]: value } : v));
    setSaved(false);
  }

  function updateOrg<K extends keyof SeoConfig["organization"]>(key: K, value: SeoConfig["organization"][K]) {
    setValues(v => (v ? { ...v, organization: { ...v.organization, [key]: value } } : v));
    setSaved(false);
  }

  function updateEvent<K extends keyof SeoConfig["event"]>(key: K, value: SeoConfig["event"][K]) {
    setValues(v => (v ? { ...v, event: { ...v.event, [key]: value } } : v));
    setSaved(false);
  }

  function updateFaq(index: number, patch: Partial<SeoConfig["faqs"][number]>) {
    setValues(v => (v ? { ...v, faqs: v.faqs.map((f, i) => (i === index ? { ...f, ...patch } : f)) } : v));
    setSaved(false);
  }

  function updatePage(index: number, patch: Partial<SeoPageConfig>) {
    setValues(v => {
      if (!v) return v;
      const pages = v.pages.map((p, i) => (i === index ? { ...p, ...patch } : p));
      return { ...v, pages };
    });
    setSaved(false);
  }

  async function handleSave() {
    if (!values) return;
    const ok = await confirm({
      title: "Publish these SEO changes?",
      description:
        "They go live on kidslab.lk immediately — titles, descriptions, structured data, robots.txt, the sitemap and /llms.txt are all rebuilt from these values.",
      confirmLabel: "Publish",
    });
    if (!ok) return;

    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "seo", data: values }),
    });
    if (res.ok) setValues(await res.json());
    setSaving(false);
    setSaved(res.ok);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8 flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(15,36,24,0.06)" }}
        >
          <Globe className="w-5 h-5" style={{ color: "var(--brand-navy)" }} />
        </div>
        <div>
          <h1
            className="text-2xl font-bold text-slate-900 tracking-tight"
            style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
          >
            SEO &amp; AEO
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            What Google and AI answer engines see. Clearing a field restores the built-in default rather than
            leaving it blank.
          </p>
        </div>
      </div>

      {!values ? (
        <p className="text-slate-400 text-sm py-8">Loading…</p>
      ) : (
        <div className="space-y-5">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-3">
            {TABS.map(t => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    active ? "bg-[color:var(--brand-navy)] text-white" : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {tab === "general" && (
            <>
              <Card className="pcb-card border-slate-100 shadow-sm p-4 sm:p-6 space-y-4">
                <h2 className="font-bold text-slate-900 text-sm">Search result</h2>

                {/* Live SERP preview — the fastest way to catch a title that
                    Google will cut off mid-word. */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-[11px] text-slate-500">kidslab.lk</p>
                  <p className="text-[#1a0dab] text-lg leading-snug truncate">{values.defaultTitle}</p>
                  <p className="text-[13px] text-slate-600 line-clamp-2">{values.description}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label htmlFor="seo-title" className={`${labelClass} mb-0`}>Default Title</Label>
                    <CharCount value={values.defaultTitle} limit={60} />
                  </div>
                  <Input
                    id="seo-title"
                    value={values.defaultTitle}
                    onChange={e => update("defaultTitle", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <Label htmlFor="seo-template" className={labelClass}>Title Template</Label>
                  <Input
                    id="seo-template"
                    value={values.titleTemplate}
                    onChange={e => update("titleTemplate", e.target.value)}
                    className={inputClass}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    <code>%s</code> is replaced by each page&apos;s own title — e.g. <code>%s | kidslab.lk</code>.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label htmlFor="seo-desc" className={`${labelClass} mb-0`}>Meta Description</Label>
                    <CharCount value={values.description} limit={160} />
                  </div>
                  <textarea
                    id="seo-desc"
                    rows={4}
                    value={values.description}
                    onChange={e => update("description", e.target.value)}
                    className={areaClass}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Google usually shows ~160 characters. Longer is fine for AI answer engines, which read the
                    whole thing — the counter is a hint, not a limit.
                  </p>
                </div>

                <div>
                  <Label htmlFor="seo-keywords" className={labelClass}>Keywords — one per line</Label>
                  <textarea
                    id="seo-keywords"
                    rows={10}
                    value={toLines(values.keywords)}
                    onChange={e => update("keywords", fromLines(e.target.value))}
                    className={`${areaClass} font-mono text-[13px]`}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {values.keywords.length} keywords. Google ignores this tag, but Bing and several AI crawlers
                    still read it.
                  </p>
                </div>
              </Card>

              <Card className="pcb-card border-slate-100 shadow-sm p-4 sm:p-6 space-y-4">
                <h2 className="font-bold text-slate-900 text-sm">Site verification</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="seo-google-v" className={labelClass}>Google Search Console</Label>
                    <Input
                      id="seo-google-v"
                      value={values.googleVerification}
                      onChange={e => update("googleVerification", e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div>
                    <Label htmlFor="seo-bing-v" className={labelClass}>Bing Webmaster Tools</Label>
                    <Input
                      id="seo-bing-v"
                      value={values.bingVerification}
                      onChange={e => update("bingVerification", e.target.value)}
                      placeholder="msvalidate.01 content value"
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Paste only the <code>content</code> value from the meta tag each tool gives you, not the whole tag.
                </p>
              </Card>
            </>
          )}

          {tab === "social" && (
            <Card className="pcb-card border-slate-100 shadow-sm p-4 sm:p-6 space-y-4">
              <h2 className="font-bold text-slate-900 text-sm">Facebook, WhatsApp &amp; X cards</h2>

              <div>
                <Label htmlFor="seo-social-title" className={labelClass}>Card Title</Label>
                <Input
                  id="seo-social-title"
                  value={values.socialTitle}
                  onChange={e => update("socialTitle", e.target.value)}
                  className={inputClass}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Kept separate from the search title, which is written for keywords rather than for a person
                  glancing at a shared link.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="seo-social-desc" className={`${labelClass} mb-0`}>Card Description</Label>
                  <CharCount value={values.socialDescription} limit={200} />
                </div>
                <textarea
                  id="seo-social-desc"
                  rows={3}
                  value={values.socialDescription}
                  onChange={e => update("socialDescription", e.target.value)}
                  className={areaClass}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Kept separate from the meta description because social cards truncate hard around 200 characters.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="seo-og" className={labelClass}>Share Image</Label>
                  <Input
                    id="seo-og"
                    value={values.ogImage}
                    onChange={e => update("ogImage", e.target.value)}
                    placeholder="/og-cover.png"
                    className={inputClass}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    A path in <code>/public</code>, or a full URL. 1200×630 renders best everywhere.
                  </p>
                </div>
                <div>
                  <Label htmlFor="seo-twitter" className={labelClass}>X / Twitter Card</Label>
                  <select
                    id="seo-twitter"
                    value={values.twitterCard}
                    onChange={e => update("twitterCard", e.target.value as SeoConfig["twitterCard"])}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  >
                    <option value="summary_large_image">Large image</option>
                    <option value="summary">Small thumbnail</option>
                  </select>
                </div>
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={values.ogImage}
                alt="Share card preview"
                className="rounded-xl border border-slate-100 w-full max-w-md"
              />
            </Card>
          )}

          {tab === "org" && (
            <Card className="pcb-card border-slate-100 shadow-sm p-4 sm:p-6 space-y-4">
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Organization &amp; location</h2>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  Feeds the <code>EducationalOrganization</code> / <code>LocalBusiness</code> structured data —
                  what Google Maps, local search and AI answers use to describe the academy.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="org-legal" className={labelClass}>Legal Name</Label>
                  <Input id="org-legal" value={values.organization.legalName}
                    onChange={e => updateOrg("legalName", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <Label htmlFor="org-slogan" className={labelClass}>Slogan</Label>
                  <Input id="org-slogan" value={values.organization.slogan}
                    onChange={e => updateOrg("slogan", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <Label htmlFor="org-phone" className={labelClass}>Telephone</Label>
                  <Input id="org-phone" value={values.organization.telephone}
                    onChange={e => updateOrg("telephone", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <Label htmlFor="org-email" className={labelClass}>Email</Label>
                  <Input id="org-email" value={values.organization.email}
                    onChange={e => updateOrg("email", e.target.value)} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="org-street" className={labelClass}>Street Address</Label>
                  <Input id="org-street" value={values.organization.streetAddress}
                    onChange={e => updateOrg("streetAddress", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <Label htmlFor="org-city" className={labelClass}>City</Label>
                  <Input id="org-city" value={values.organization.addressLocality}
                    onChange={e => updateOrg("addressLocality", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <Label htmlFor="org-postal" className={labelClass}>Postal Code</Label>
                  <Input id="org-postal" value={values.organization.postalCode}
                    onChange={e => updateOrg("postalCode", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <Label htmlFor="org-lat" className={labelClass}>Latitude</Label>
                  <Input id="org-lat" type="number" step="0.0001" value={values.organization.latitude}
                    onChange={e => updateOrg("latitude", Number(e.target.value))} className={inputClass} />
                </div>
                <div>
                  <Label htmlFor="org-lng" className={labelClass}>Longitude</Label>
                  <Input id="org-lng" type="number" step="0.0001" value={values.organization.longitude}
                    onChange={e => updateOrg("longitude", Number(e.target.value))} className={inputClass} />
                </div>
              </div>

              <div>
                <Label htmlFor="org-desc" className={labelClass}>Description</Label>
                <textarea id="org-desc" rows={4} value={values.organization.description}
                  onChange={e => updateOrg("description", e.target.value)} className={areaClass} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="org-alt" className={labelClass}>Also known as — one per line</Label>
                  <textarea id="org-alt" rows={4} value={toLines(values.organization.alternateNames)}
                    onChange={e => updateOrg("alternateNames", fromLines(e.target.value))} className={areaClass} />
                </div>
                <div>
                  <Label htmlFor="org-same" className={labelClass}>Profile URLs — one per line</Label>
                  <textarea id="org-same" rows={4} value={toLines(values.organization.sameAs)}
                    onChange={e => updateOrg("sameAs", fromLines(e.target.value))} className={`${areaClass} font-mono text-[12px]`} />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Facebook, WhatsApp, LinkedIn — how search engines confirm this is the same organization.
                  </p>
                </div>
                <div>
                  <Label htmlFor="org-area" className={labelClass}>Cities served — one per line</Label>
                  <textarea id="org-area" rows={5} value={toLines(values.organization.areaServed)}
                    onChange={e => updateOrg("areaServed", fromLines(e.target.value))} className={areaClass} />
                </div>
                <div>
                  <Label htmlFor="org-knows" className={labelClass}>Subjects taught — one per line</Label>
                  <textarea id="org-knows" rows={5} value={toLines(values.organization.knowsAbout)}
                    onChange={e => updateOrg("knowsAbout", fromLines(e.target.value))} className={areaClass} />
                </div>
              </div>
            </Card>
          )}

          {tab === "event" && (
            <Card className="pcb-card border-slate-100 shadow-sm p-4 sm:p-6 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={values.event.enabled}
                  onChange={e => updateEvent("enabled", e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-[color:var(--brand-navy)]"
                />
                <span>
                  <span className="font-semibold text-slate-900 text-sm block">Publish the seminar as an Event</span>
                  <span className="text-[13px] text-slate-500">
                    Makes it eligible for Google&apos;s event results. Switch this off once the date has passed —
                    an expired event is worse than none.
                  </span>
                </span>
              </label>

              <div>
                <Label htmlFor="ev-name" className={labelClass}>Event Name</Label>
                <Input id="ev-name" value={values.event.name}
                  onChange={e => updateEvent("name", e.target.value)} className={inputClass} />
              </div>

              <div>
                <Label htmlFor="ev-desc" className={labelClass}>Description</Label>
                <textarea id="ev-desc" rows={3} value={values.event.description}
                  onChange={e => updateEvent("description", e.target.value)} className={areaClass} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="ev-date" className={labelClass}>Date</Label>
                  <Input id="ev-date" type="date" value={values.event.startDate}
                    onChange={e => updateEvent("startDate", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <Label htmlFor="ev-start" className={labelClass}>Starts</Label>
                  <Input id="ev-start" type="time" value={values.event.startTime}
                    onChange={e => updateEvent("startTime", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <Label htmlFor="ev-end" className={labelClass}>Ends</Label>
                  <Input id="ev-end" type="time" value={values.event.endTime}
                    onChange={e => updateEvent("endTime", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <Label htmlFor="ev-valid" className={labelClass}>Seats open</Label>
                  <Input id="ev-valid" type="date" value={values.event.offerValidFrom}
                    onChange={e => updateEvent("offerValidFrom", e.target.value)} className={inputClass} />
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Times are Sri Lanka time (UTC+05:30). This date also drives each course&apos;s start date in the
                structured data.
              </p>

              <div>
                <Label htmlFor="ev-url" className={labelClass}>Registration URL</Label>
                <Input id="ev-url" value={values.event.url}
                  onChange={e => updateEvent("url", e.target.value)} className={`${inputClass} font-mono`} />
              </div>
            </Card>
          )}

          {tab === "pages" && (
            <div className="space-y-4">
              {values.pages.map((page, i) => (
                <Card key={i} className="pcb-card border-slate-100 shadow-sm p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <Label htmlFor={`page-path-${i}`} className={labelClass}>Path</Label>
                      <Input
                        id={`page-path-${i}`}
                        value={page.path}
                        onChange={e => updatePage(i, { path: e.target.value })}
                        placeholder="/about"
                        className={`${inputClass} font-mono max-w-xs`}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`Remove ${page.path}`}
                      onClick={() => update("pages", values.pages.filter((_, j) => j !== i))}
                      className="shrink-0 border-slate-200 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label htmlFor={`page-title-${i}`} className={`${labelClass} mb-0`}>Title</Label>
                      <CharCount value={page.title} limit={60} />
                    </div>
                    <Input
                      id={`page-title-${i}`}
                      value={page.title}
                      onChange={e => updatePage(i, { title: e.target.value })}
                      placeholder="Leave blank to use the default title"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label htmlFor={`page-desc-${i}`} className={`${labelClass} mb-0`}>Description</Label>
                      <CharCount value={page.description} limit={160} />
                    </div>
                    <textarea
                      id={`page-desc-${i}`}
                      rows={3}
                      value={page.description}
                      onChange={e => updatePage(i, { description: e.target.value })}
                      placeholder="Leave blank to use the site description"
                      className={areaClass}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`page-canon-${i}`} className={labelClass}>Canonical URL</Label>
                      <Input
                        id={`page-canon-${i}`}
                        value={page.canonical}
                        onChange={e => updatePage(i, { canonical: e.target.value })}
                        placeholder="Derived from the path when blank"
                        className={`${inputClass} font-mono text-[12px]`}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`page-og-${i}`} className={labelClass}>Share Image</Label>
                      <Input
                        id={`page-og-${i}`}
                        value={page.ogImage}
                        onChange={e => updatePage(i, { ogImage: e.target.value })}
                        placeholder="Falls back to the site image"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`page-freq-${i}`} className={labelClass}>Change Frequency</Label>
                      <select
                        id={`page-freq-${i}`}
                        value={page.changeFrequency}
                        onChange={e => updatePage(i, { changeFrequency: e.target.value as SeoPageConfig["changeFrequency"] })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
                      >
                        {CHANGE_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor={`page-prio-${i}`} className={labelClass}>Sitemap Priority</Label>
                      <Input
                        id={`page-prio-${i}`}
                        type="number" min={0} max={1} step={0.1}
                        value={page.priority}
                        onChange={e => updatePage(i, { priority: Number(e.target.value) })}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`page-kw-${i}`} className={labelClass}>Keywords — one per line</Label>
                    <textarea
                      id={`page-kw-${i}`}
                      rows={4}
                      value={toLines(page.keywords)}
                      onChange={e => updatePage(i, { keywords: fromLines(e.target.value) })}
                      className={`${areaClass} font-mono text-[13px]`}
                    />
                  </div>

                  <div className="flex flex-wrap gap-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={page.includeInSitemap}
                        onChange={e => updatePage(i, { includeInSitemap: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 accent-[color:var(--brand-navy)]"
                      />
                      <span className="text-[13px] text-slate-700">List in sitemap.xml</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={page.noindex}
                        onChange={e => updatePage(i, { noindex: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 accent-red-500"
                      />
                      <span className="text-[13px] text-slate-700">
                        Hide from search engines <span className="text-slate-400">(noindex)</span>
                      </span>
                    </label>
                  </div>
                </Card>
              ))}

              <Button
                variant="outline"
                onClick={() =>
                  update("pages", [
                    ...values.pages,
                    {
                      path: "/", title: "", description: "", keywords: [], ogImage: "",
                      canonical: "", noindex: false, includeInSitemap: true,
                      priority: 0.5, changeFrequency: "monthly",
                    },
                  ])
                }
                className="rounded-full text-xs font-semibold border-slate-200 gap-1.5"
                style={{ color: "var(--brand-navy)" }}
              >
                <Plus className="w-3.5 h-3.5" /> Add page
              </Button>
              <p className="text-[11px] text-slate-400">
                A page only picks these up if the route exists — adding an entry here doesn&apos;t create a page.
              </p>
            </div>
          )}

          {tab === "faq" && (
            <Card className="pcb-card border-slate-100 shadow-sm p-4 sm:p-6 space-y-4">
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Frequently asked questions</h2>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  Published as <code>FAQPage</code> structured data and in <code>/llms.txt</code>. This is the
                  single biggest lever on AI answers — ChatGPT, Perplexity and AI Overviews quote these almost
                  verbatim, so write each answer as a complete, standalone statement. The same entries render in
                  the landing page&apos;s FAQ section, in Sinhala when a translation exists.
                </p>
              </div>

              {values.faqs.map((faq, i) => (
                <div key={i} className="rounded-xl border border-slate-100 p-4 space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={faq.question}
                      onChange={e => updateFaq(i, { question: e.target.value })}
                      placeholder="What age group is the program for?"
                      aria-label={`Question ${i + 1} (English)`}
                      className={`${inputClass} font-semibold`}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`Remove question ${i + 1}`}
                      onClick={() => update("faqs", values.faqs.filter((_, j) => j !== i))}
                      className="shrink-0 border-slate-200 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <textarea
                    rows={4}
                    value={faq.answer}
                    onChange={e => updateFaq(i, { answer: e.target.value })}
                    aria-label={`Answer ${i + 1} (English)`}
                    className={areaClass}
                  />

                  <details className="group" open={Boolean(faq.questionSi || faq.answerSi)}>
                    <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600 flex items-center gap-1.5">
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                      Sinhala
                      {!faq.questionSi && !faq.answerSi && (
                        <span className="normal-case tracking-normal font-medium text-amber-600">
                          — not translated, shows English
                        </span>
                      )}
                    </summary>
                    <div className="space-y-3 pt-3">
                      <Input
                        value={faq.questionSi}
                        onChange={e => updateFaq(i, { questionSi: e.target.value })}
                        placeholder="Sinhala question"
                        aria-label={`Question ${i + 1} (Sinhala)`}
                        className={`${inputClass} font-semibold font-[var(--font-sinhala)]`}
                      />
                      <textarea
                        rows={4}
                        value={faq.answerSi}
                        onChange={e => updateFaq(i, { answerSi: e.target.value })}
                        placeholder="Sinhala answer"
                        aria-label={`Answer ${i + 1} (Sinhala)`}
                        className={areaClass}
                      />
                    </div>
                  </details>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={faq.showOnPage}
                      onChange={e => updateFaq(i, { showOnPage: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 accent-[color:var(--brand-navy)]"
                    />
                    <span className="text-[13px] text-slate-700">
                      Show in the FAQ section on the landing page
                    </span>
                  </label>
                </div>
              ))}

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    update("faqs", [
                      ...values.faqs,
                      { question: "", answer: "", questionSi: "", answerSi: "", showOnPage: true },
                    ])
                  }
                  className="rounded-full text-xs font-semibold border-slate-200 gap-1.5"
                  style={{ color: "var(--brand-navy)" }}
                >
                  <Plus className="w-3.5 h-3.5" /> Add question
                </Button>
                <span className="text-[11px] text-slate-400">
                  {values.faqs.length} published · {values.faqs.filter(f => f.showOnPage).length} on the page ·{" "}
                  {values.faqs.filter(f => f.questionSi && f.answerSi).length} translated
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Rows with an empty English question or answer are dropped on save — that&apos;s how you delete one.
                The structured data and <code>/llms.txt</code> always use the English text; Sinhala is for the page
                only, and an untranslated entry falls back to English there.
              </p>
            </Card>
          )}

          {tab === "facts" && (
            <Card className="pcb-card border-slate-100 shadow-sm p-4 sm:p-6 space-y-4">
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Key facts</h2>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  Short, quotable claims listed at the top of <code>/llms.txt</code>. Keep each one a single
                  self-contained sentence an assistant can lift without context.
                </p>
              </div>

              {values.answerFacts.map((fact, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={fact.label}
                    onChange={e =>
                      update("answerFacts", values.answerFacts.map((f, j) => (j === i ? { ...f, label: e.target.value } : f)))
                    }
                    placeholder="Course fee"
                    aria-label={`Fact ${i + 1} label`}
                    className={`${inputClass} sm:max-w-[200px] font-semibold`}
                  />
                  <Input
                    value={fact.value}
                    onChange={e =>
                      update("answerFacts", values.answerFacts.map((f, j) => (j === i ? { ...f, value: e.target.value } : f)))
                    }
                    placeholder="LKR 5,000 for the full 3-month course"
                    aria-label={`Fact ${i + 1} value`}
                    className={inputClass}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Remove fact ${i + 1}`}
                    onClick={() => update("answerFacts", values.answerFacts.filter((_, j) => j !== i))}
                    className="shrink-0 border-slate-200 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={() => update("answerFacts", [...values.answerFacts, { label: "", value: "" }])}
                className="rounded-full text-xs font-semibold border-slate-200 gap-1.5"
                style={{ color: "var(--brand-navy)" }}
              >
                <Plus className="w-3.5 h-3.5" /> Add fact
              </Button>
            </Card>
          )}

          {tab === "crawlers" && (
            <Card className="pcb-card border-slate-100 shadow-sm p-4 sm:p-6 space-y-4">
              <div>
                <h2 className="font-bold text-slate-900 text-sm">AI crawler access</h2>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  Which answer engines may read kidslab.lk. Leaving these on is what makes the site quotable in
                  ChatGPT, Perplexity, Claude and Google AI Overviews. Switching one off writes an explicit
                  <code> Disallow: /</code> for it in robots.txt.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {AI_CRAWLER_AGENTS.map(agent => {
                  const on = values.aiCrawlers[agent] !== false;
                  return (
                    <label
                      key={agent}
                      className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-3 py-2.5 cursor-pointer hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={e => update("aiCrawlers", { ...values.aiCrawlers, [agent]: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 accent-[color:var(--brand-navy)]"
                      />
                      <span className="text-[13px] font-medium text-slate-700 font-mono">{agent}</span>
                    </label>
                  );
                })}
              </div>
            </Card>
          )}

          {tab === "llms" && (
            <Card className="pcb-card border-slate-100 shadow-sm p-4 sm:p-6 space-y-4">
              <div>
                <h2 className="font-bold text-slate-900 text-sm">/llms.txt</h2>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  A plain-text fact sheet for AI crawlers, generated from your key facts, live courses, the
                  seminar and the FAQ above. Only the closing note is free-text —{" "}
                  <a href="/llms.txt" target="_blank" rel="noreferrer" className="font-semibold underline">
                    view the generated file
                  </a>.
                </p>
              </div>
              <div>
                <Label htmlFor="llms-notes" className={labelClass}>Notes for AI assistants</Label>
                <textarea
                  id="llms-notes"
                  rows={6}
                  value={values.llmsTxtNotes}
                  onChange={e => update("llmsTxtNotes", e.target.value)}
                  className={areaClass}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Appended at the end of the file — a good place to state how you&apos;d like to be cited.
                </p>
              </div>
            </Card>
          )}

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="btn-brand-navy text-white font-semibold rounded-full text-sm gap-1.5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Publishing…" : "Publish changes"}
            </Button>
            {saved && (
              <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Live on kidslab.lk
              </span>
            )}
            <span className="text-[11px] text-slate-400">
              Saving publishes every tab, not just the one you&apos;re looking at.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
