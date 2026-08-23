"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Loader2,
  Mail,
  Monitor,
  RotateCcw,
  Save,
  Send,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useConfirm } from "@/components/admin/ConfirmContext";
import {
  EMAIL_TEMPLATE_DEFAULTS,
  EMAIL_TEMPLATE_KEYS,
  EMAIL_TEMPLATE_META,
  type EmailTemplateContent,
  type EmailTemplateKey,
  type EmailTemplates,
} from "@/config/email-templates";
import { previewEmailTemplate, unknownTokens } from "@/lib/email-templates";

const labelClass = "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block";
const inputClass = "border-slate-200 text-sm";
const areaClass =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm leading-relaxed text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200";

/** Length hint next to a field mail clients truncate. Amber past the limit, never blocking. */
function CharCount({ value, limit }: { value: string; limit: number }) {
  const over = value.length > limit;
  return (
    <span className={`text-[11px] font-medium ${over ? "text-amber-600" : "text-slate-400"}`}>
      {value.length}/{limit}
    </span>
  );
}

export default function EmailTemplatesPage() {
  const confirm = useConfirm();
  const [values, setValues] = useState<EmailTemplates | null>(null);
  const [key, setKey] = useState<EmailTemplateKey>("welcome");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [sending, setSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then(r => (r.ok ? r.json() : null))
      .then((data: { emailTemplates?: EmailTemplates } | null) => setValues(data?.emailTemplates ?? null))
      .catch(() => {});
  }, []);

  const meta = EMAIL_TEMPLATE_META[key];
  const content = values?.[key];

  /**
   * The preview is rendered by the same function the send paths use, in the
   * browser, on every keystroke — so it can't drift from what actually goes
   * out, and there's no round-trip between typing and seeing the result.
   */
  const preview = useMemo(
    () => (content ? previewEmailTemplate(key, content) : null),
    [key, content]
  );
  const strayTokens = useMemo(
    () => (content ? unknownTokens(content, key) : []),
    [key, content]
  );

  /**
   * The preview is loaded as a blob URL rather than through `srcDoc`.
   *
   * A `srcdoc` written to a frame that appears during React's commit is
   * silently dropped — the pane comes up blank and only a much later write
   * paints it. A blob URL is an ordinary navigation with none of that timing,
   * and it survives every edit the same way.
   *
   * Created in a memo rather than state so there's no render-after-render to
   * settle; it's skipped on the server, where `preview` is null anyway because
   * the copy is fetched client-side.
   */
  const previewUrl = useMemo(() => {
    if (!preview || typeof window === "undefined") return "";
    return URL.createObjectURL(new Blob([preview.html], { type: "text/html" }));
  }, [preview]);

  // Each edit mints a new URL; without this the old blobs stay alive for the
  // life of the page.
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function update<K extends keyof EmailTemplateContent>(slot: K, value: EmailTemplateContent[K]) {
    setValues(v => (v ? { ...v, [key]: { ...v[key], [slot]: value } } : v));
    setSaved(false);
    setTestResult(null);
  }

  async function handleSave() {
    if (!values) return;
    const ok = await confirm({
      title: "Save email copy?",
      description:
        "These are the words every matching email sends from now on — including password resets and registration confirmations. Existing emails already delivered are unaffected.",
      confirmLabel: "Save copy",
    });
    if (!ok) return;

    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "emailTemplates", data: values }),
    });
    if (res.ok) setValues(await res.json());
    setSaving(false);
    setSaved(res.ok);
  }

  async function handleRestore() {
    const ok = await confirm({
      title: `Restore the shipped “${meta.label}” copy?`,
      description: "Your edits to this template are replaced. Nothing is saved until you press Save.",
      confirmLabel: "Restore defaults",
    });
    if (!ok) return;
    setValues(v => (v ? { ...v, [key]: { ...EMAIL_TEMPLATE_DEFAULTS[key] } } : v));
    setSaved(false);
  }

  async function handleSendTest() {
    if (!content) return;
    setSending(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/email-templates/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, email: testTo, content }),
      });
      setTestResult(await res.json());
    } catch {
      setTestResult({ success: false, message: "Couldn't reach the server" });
    }
    setSending(false);
  }

  function copyToken(token: string) {
    navigator.clipboard?.writeText(`{{${token}}}`).then(
      () => {
        setCopied(token);
        setTimeout(() => setCopied(""), 1500);
      },
      () => {}
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(15,36,24,0.06)" }}
        >
          <Mail className="w-5 h-5" style={{ color: "var(--brand-navy)" }} />
        </div>
        <div>
          <h1
            className="text-2xl font-bold text-slate-900 tracking-tight"
            style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
          >
            Email Templates
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            The wording of every email the site sends. The branding, layout and detail tables are handled for
            you — edit the words and watch the preview update as you type.
          </p>
        </div>
      </div>

      {!values || !content || !preview ? (
        <p className="text-slate-400 text-sm py-8">Loading…</p>
      ) : (
        <div className="space-y-5">
          {/* Template picker */}
          <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-3">
            {EMAIL_TEMPLATE_KEYS.map(k => {
              const active = k === key;
              return (
                <button
                  key={k}
                  onClick={() => {
                    setKey(k);
                    setTestResult(null);
                  }}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    active ? "bg-[color:var(--brand-navy)] text-white" : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {EMAIL_TEMPLATE_META[k].label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
            {/* ── Editor ─────────────────────────────────────────────── */}
            <div className="space-y-5">
              <Card className="pcb-card border-slate-100 shadow-sm p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm">{meta.label}</h2>
                    <p className="text-[13px] text-slate-500 mt-0.5">{meta.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRestore}
                    className="shrink-0 text-[11px] font-semibold text-slate-400 hover:text-slate-700 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Restore defaults
                  </button>
                </div>

                {meta.kind === "marketing" && (
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-[12px] text-slate-500">
                    Marketing mail — an unsubscribe line is added to the footer automatically, as the law and
                    the inbox providers require.
                  </p>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label htmlFor="tpl-subject" className={`${labelClass} mb-0`}>Subject</Label>
                    <CharCount value={content.subject} limit={60} />
                  </div>
                  <Input
                    id="tpl-subject"
                    value={content.subject}
                    onChange={e => update("subject", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label htmlFor="tpl-preheader" className={`${labelClass} mb-0`}>Inbox preview text</Label>
                    <CharCount value={content.preheader} limit={90} />
                  </div>
                  <Input
                    id="tpl-preheader"
                    value={content.preheader}
                    onChange={e => update("preheader", e.target.value)}
                    className={inputClass}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    The grey line shown next to the subject in the inbox list, before the email is opened.
                  </p>
                </div>

                <div>
                  <Label htmlFor="tpl-heading" className={labelClass}>Heading</Label>
                  <Input
                    id="tpl-heading"
                    value={content.heading}
                    onChange={e => update("heading", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <Label htmlFor="tpl-intro" className={labelClass}>Opening paragraphs</Label>
                  <textarea
                    id="tpl-intro"
                    value={content.intro}
                    onChange={e => update("intro", e.target.value)}
                    rows={5}
                    className={areaClass}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Leave a blank line between paragraphs.
                  </p>
                </div>

                {/* Named explicitly so it's obvious why the preview shows a box
                    that has no field behind it. */}
                {meta.sampleRows.length > 0 && (
                  <p className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-[12px] text-slate-500">
                    A details box is inserted here automatically, filled from the real record
                    ({meta.sampleRows.map(r => r.label).join(", ")}). It isn&apos;t editable — the values come
                    from whoever triggered the email.
                  </p>
                )}

                <div>
                  <Label htmlFor="tpl-outro" className={labelClass}>Closing paragraphs</Label>
                  <textarea
                    id="tpl-outro"
                    value={content.outro}
                    onChange={e => update("outro", e.target.value)}
                    rows={3}
                    className={areaClass}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tpl-btn-label" className={labelClass}>Button label</Label>
                    <Input
                      id="tpl-btn-label"
                      value={content.buttonLabel}
                      onChange={e => update("buttonLabel", e.target.value)}
                      placeholder="Leave blank for no button"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tpl-btn-url" className={labelClass}>Button link</Label>
                    <Input
                      id="tpl-btn-url"
                      value={content.buttonUrl}
                      onChange={e => update("buttonUrl", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tpl-note" className={labelClass}>Small print</Label>
                  <textarea
                    id="tpl-note"
                    value={content.note}
                    onChange={e => update("note", e.target.value)}
                    rows={2}
                    className={areaClass}
                  />
                </div>

                <div>
                  <Label htmlFor="tpl-footer" className={labelClass}>Closing note</Label>
                  <textarea
                    id="tpl-footer"
                    value={content.footerNote}
                    onChange={e => update("footerNote", e.target.value)}
                    rows={3}
                    className={areaClass}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Sits under a divider at the very end — the “didn&apos;t expect this?” line. Leave blank to
                    drop both.
                  </p>
                </div>

                <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                  Subject, preview text, heading and opening paragraphs fall back to the built-in copy if you
                  clear them — an email can&apos;t go out headless. Everything else disappears when blank, which
                  is how you remove a button or a note.
                </p>
              </Card>

              {/* Placeholders */}
              <Card className="pcb-card border-slate-100 shadow-sm p-6">
                <h2 className="font-bold text-slate-900 text-sm">Placeholders</h2>
                <p className="text-[13px] text-slate-500 mt-0.5 mb-3">
                  Drop these into any field above and they&apos;re replaced with the real value when the email
                  is sent. Click one to copy it.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {meta.variables.map(v => (
                    <button
                      key={v.token}
                      type="button"
                      onClick={() => copyToken(v.token)}
                      title={`${v.description} — e.g. ${v.sample}`}
                      className="flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-[11px] font-mono text-slate-700 transition-colors"
                    >
                      {copied === v.token ? (
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                      {`{{${v.token}}}`}
                    </button>
                  ))}
                </div>

                {strayTokens.length > 0 && (
                  <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-800">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
                    <span>
                      <strong>{strayTokens.map(t => `{{${t}}}`).join(", ")}</strong>{" "}
                      {strayTokens.length === 1 ? "isn't a placeholder" : "aren't placeholders"} this template
                      knows — it will be replaced with nothing. Check the spelling against the list above.
                    </span>
                  </p>
                )}
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

            {/* ── Preview ────────────────────────────────────────────── */}
            <div className="xl:sticky xl:top-6 space-y-5">
              <Card className="pcb-card border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Subject
                    </p>
                    <p className="text-sm font-semibold text-slate-900 truncate">{preview.subject}</p>
                    <p className="text-[12px] text-slate-400 truncate">{content.preheader}</p>
                  </div>
                  <div className="flex shrink-0 rounded-full bg-slate-100 p-0.5">
                    <button
                      type="button"
                      onClick={() => setNarrow(false)}
                      aria-label="Desktop preview"
                      className={`rounded-full p-1.5 ${!narrow ? "bg-white shadow-sm text-slate-900" : "text-slate-400"}`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setNarrow(true)}
                      aria-label="Mobile preview"
                      className={`rounded-full p-1.5 ${narrow ? "bg-white shadow-sm text-slate-900" : "text-slate-400"}`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-100 p-3 flex justify-center">
                  {/*
                    Framed so the email's own styles stay out of the dashboard's
                    CSS and vice versa — an inline render would inherit
                    Tailwind's resets and lie about the result.

                    `allow-same-origin` is what lets the blob URL load at all;
                    it does not re-enable scripts, which stay blocked because
                    `allow-scripts` is absent. So a stray <script> pasted into
                    the copy renders as inert markup here, exactly as it would
                    in a mail client.
                  */}
                  <iframe
                    title="Email preview"
                    src={previewUrl}
                    sandbox="allow-same-origin"
                    className="h-[700px] rounded-lg bg-white border border-slate-200 transition-all"
                    style={{ width: narrow ? 380 : "100%" }}
                  />
                </div>
              </Card>

              <Card className="pcb-card border-slate-100 shadow-sm p-6 space-y-3">
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">Send yourself a test</h2>
                  <p className="text-[13px] text-slate-500 mt-0.5">
                    Delivers what&apos;s on screen right now — unsaved edits included — with the sample values
                    above filled in. The only way to see how Gmail and Outlook really render it.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={testTo}
                    onChange={e => setTestTo(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                    aria-label="Test recipient"
                  />
                  <Button
                    onClick={handleSendTest}
                    disabled={sending || !testTo}
                    variant="outline"
                    className="shrink-0 rounded-full border-slate-200 text-xs font-semibold gap-1.5"
                    style={{ color: "var(--brand-navy)" }}
                  >
                    {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {sending ? "Sending…" : "Send test"}
                  </Button>
                </div>
                {testResult && (
                  <p
                    className={`text-[12px] font-medium ${
                      testResult.success ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {testResult.message}
                  </p>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
