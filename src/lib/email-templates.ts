/**
 * Turns the admin-editable copy in `@/config/email-templates` into a finished
 * email.
 *
 * Deliberately free of any database or Node-only import: the admin dashboard
 * imports {@link previewEmailTemplate} directly and re-renders the preview in
 * the browser as the admin types, so what they see is produced by the exact
 * code that will send the real message — not a lookalike that can drift.
 *
 * The stored copy is read on the server via `getEmailTemplates()` in
 * `@/lib/settings`.
 */

import {
  EMAIL_TEMPLATE_DEFAULTS,
  EMAIL_TEMPLATE_KEYS,
  EMAIL_TEMPLATE_META,
  type EmailTemplateContent,
  type EmailTemplateKey,
  type EmailTemplates,
} from "@/config/email-templates";
import {
  button,
  detailRows,
  divider,
  escapeHtml,
  muted,
  p,
  panel,
  renderEmail,
} from "@/lib/email-template";

/* ── Merge ────────────────────────────────────────────────────────────── */

/**
 * Slots that must never be empty — an email with no subject or no heading is
 * broken, so blanking one in the dashboard restores the shipped text.
 *
 * Everything else is genuinely optional: an admin who deletes the button label
 * or the closing note means "don't show it", and that has to survive the round
 * trip. Use "Restore defaults" in the editor to get the shipped copy back.
 */
const REQUIRED_SLOTS = ["subject", "preheader", "heading", "intro"] as const;
type RequiredSlot = (typeof REQUIRED_SLOTS)[number];

function isRequired(slot: string): slot is RequiredSlot {
  return (REQUIRED_SLOTS as readonly string[]).includes(slot);
}

function mergeContent(
  stored: Partial<EmailTemplateContent> | null | undefined,
  defaults: EmailTemplateContent
): EmailTemplateContent {
  const s = stored ?? {};
  const out = {} as EmailTemplateContent;

  for (const slot of Object.keys(defaults) as (keyof EmailTemplateContent)[]) {
    const value = s[slot];
    if (typeof value !== "string") {
      // Never written (or written before this slot existed) — take the default.
      out[slot] = defaults[slot];
    } else if (isRequired(slot) && !value.trim()) {
      out[slot] = defaults[slot];
    } else {
      out[slot] = value;
    }
  }
  return out;
}

/**
 * The shape as it comes out of the database: any template may be missing, and
 * within one, any slot may be unwritten.
 */
export type StoredEmailTemplates =
  | Partial<Record<EmailTemplateKey, Partial<EmailTemplateContent>>>
  | null
  | undefined;

/** Overlays the stored templates onto {@link EMAIL_TEMPLATE_DEFAULTS}, slot by slot. */
export function mergeEmailTemplates(stored: StoredEmailTemplates): EmailTemplates {
  const s = stored ?? {};
  const out = {} as EmailTemplates;
  for (const key of EMAIL_TEMPLATE_KEYS) {
    out[key] = mergeContent(s[key], EMAIL_TEMPLATE_DEFAULTS[key]);
  }
  return out;
}

/**
 * The `template.slot` paths where the stored copy differs from what is
 * actually being sent. Empty means the database already states the live copy
 * outright, rather than leaving it implied by the shipped defaults.
 *
 * Shared by the auto-seed in `@/lib/settings` and
 * `scripts/seed-email-templates.mts`, so the CLI's report and the runtime's
 * write decision can never disagree.
 */
export function changedEmailTemplateFields(
  before: StoredEmailTemplates,
  next: EmailTemplates
): string[] {
  const stored = before ?? {};
  const changed: string[] = [];

  for (const key of EMAIL_TEMPLATE_KEYS) {
    const slots = stored[key] ?? {};
    for (const slot of Object.keys(next[key]) as (keyof EmailTemplateContent)[]) {
      // Plain !== rather than a JSON compare: every slot is a string, and the
      // distinction that matters here is exactly the one it makes — an unset
      // slot (undefined) differs from one deliberately cleared to "".
      if (slots[slot] !== next[key][slot]) changed.push(`${key}.${slot}`);
    }
  }
  return changed;
}

/* ── Placeholders ─────────────────────────────────────────────────────── */

const TOKEN_RE = /\{\{\s*(\w+)\s*\}\}/g;

/**
 * Substitutes `{{token}}` placeholders.
 *
 * `escape` is on for anything landing in HTML: the values are registrant
 * names, course titles and email addresses submitted through the public form,
 * and interpolating those raw would let a registrant inject markup into a
 * message we send in our own name. It's off for the subject and preheader,
 * which are plain-text contexts (`renderEmail` escapes them itself).
 *
 * An unknown token resolves to nothing rather than shipping a literal
 * `{{whoops}}` to a customer — the editor flags them before it gets that far.
 */
function applyVars(text: string, vars: Record<string, string>, escape: boolean): string {
  return text.replace(TOKEN_RE, (_m, token: string) => {
    const value = vars[token] ?? "";
    return escape ? escapeHtml(value) : value;
  });
}

/** Tokens used in `content` that the template doesn't define — i.e. typos. */
export function unknownTokens(content: EmailTemplateContent, key: EmailTemplateKey): string[] {
  const known = new Set(EMAIL_TEMPLATE_META[key].variables.map(v => v.token));
  const found = new Set<string>();
  for (const value of Object.values(content)) {
    for (const match of String(value).matchAll(TOKEN_RE)) {
      if (!known.has(match[1])) found.add(match[1]);
    }
  }
  return [...found];
}

/* ── Render ───────────────────────────────────────────────────────────── */

/**
 * Renders one editable slot as body paragraphs.
 *
 * A blank line starts a new paragraph and a single newline becomes a line
 * break, so the textarea in the dashboard behaves the way anyone writing an
 * email expects. Admin-authored markup passes through — composing settings
 * requires `settings:manage`, the same trust level as the campaign composer.
 */
function paragraphs(
  text: string,
  vars: Record<string, string>,
  wrap: (html: string) => string
): string {
  return applyVars(text, vars, true)
    .split(/\n\s*\n/)
    .map(block => block.trim())
    .filter(Boolean)
    .map(block => wrap(block.replace(/\n/g, "<br />")))
    .join("");
}

export interface RenderTemplateOptions {
  /** Label/value rows for the panel between `intro` and `outro`. */
  rows?: { label: string; value: string }[];
  /** Extra small print appended after `note` — mechanical lines like the raw reset URL. */
  extraNotes?: string[];
  /** Required for `marketing` templates; ignored otherwise. */
  unsubscribeUrl?: string;
}

export interface RenderedTemplate {
  subject: string;
  html: string;
}

/** Builds the finished subject + HTML for one template. */
export function renderEmailTemplate(
  key: EmailTemplateKey,
  content: EmailTemplateContent,
  vars: Record<string, string>,
  { rows = [], extraNotes = [], unsubscribeUrl }: RenderTemplateOptions = {}
): RenderedTemplate {
  const meta = EMAIL_TEMPLATE_META[key];
  const subject = applyVars(content.subject, vars, false);
  const notes = [content.note, ...extraNotes].filter(n => n && n.trim());

  const body = [
    paragraphs(content.intro, vars, p),
    rows.length ? panel(detailRows(rows)) : "",
    paragraphs(content.outro, vars, p),
    content.buttonLabel.trim() && content.buttonUrl.trim()
      ? button(applyVars(content.buttonLabel, vars, false), applyVars(content.buttonUrl, vars, false))
      : "",
    notes.map(note => paragraphs(note, vars, muted)).join(""),
    // The rule only earns its place when there's a closing note under it.
    content.footerNote.trim() ? divider() + paragraphs(content.footerNote, vars, muted) : "",
  ].join("");

  return {
    subject,
    html: renderEmail({
      title: subject,
      preheader: applyVars(content.preheader, vars, false),
      heading: applyVars(content.heading, vars, true),
      body,
      kind: meta.kind,
      unsubscribeUrl,
    }),
  };
}

/** Sample values for `key`, used by the dashboard preview and the test send. */
export function sampleVars(key: EmailTemplateKey): Record<string, string> {
  return Object.fromEntries(EMAIL_TEMPLATE_META[key].variables.map(v => [v.token, v.sample]));
}

/**
 * Renders `content` with stand-in data — what the dashboard shows in its
 * preview pane and what "Send test" delivers.
 */
export function previewEmailTemplate(
  key: EmailTemplateKey,
  content: EmailTemplateContent
): RenderedTemplate {
  const meta = EMAIL_TEMPLATE_META[key];
  return renderEmailTemplate(key, content, sampleVars(key), {
    rows: meta.sampleRows,
    unsubscribeUrl: meta.kind === "marketing" ? "https://kidslab.lk/unsubscribe?example=1" : undefined,
  });
}
