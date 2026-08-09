/**
 * The one professional email layout every outbound message goes through.
 *
 * Why a hand-rolled table layout rather than the `<div>` snippets this used to
 * send: mail clients are not browsers. Outlook renders through Word's HTML
 * engine (no flexbox, no grid, unreliable `max-width` on block elements),
 * Gmail strips `<style>` blocks in some contexts and clips messages over
 * ~102KB, and Apple Mail auto-inverts colours in dark mode. Nested tables with
 * inline styles are the only structure that survives all of them.
 *
 * Compose a message with the block helpers below, then wrap it in
 * {@link renderEmail}, which supplies the branded header, the card, the footer
 * with contact details, and — for marketing mail — the unsubscribe line.
 */

import {
  BRAND_COLORS,
  CONTACT_ADDRESS,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  FACEBOOK_URL,
  SITE_LEGAL_NAME,
  SITE_LOGO_URL,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  WHATSAPP_URL,
} from "@/config/site";

const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const TEXT = "#1f2933";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";

/**
 * Escapes a value before it goes into email HTML.
 *
 * Names, subjects and course titles here are user-submitted through the public
 * registration form. Interpolating them raw let a registrant inject markup
 * into an email we then send in our own name — and mail clients honour enough
 * HTML for that to matter (spoofed links, hidden text). Every dynamic value in
 * a template must pass through this.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escapes a URL for an `href`, refusing anything that isn't http(s) or mailto. */
export function safeUrl(url: string): string {
  return /^(https?:|mailto:)/i.test(url.trim()) ? escapeHtml(url.trim()) : "#";
}

/* ── Content blocks ───────────────────────────────────────────────────── */

/** A body paragraph. Pass already-escaped HTML. */
export function p(html: string): string {
  return `<p style="margin:0 0 16px;font-family:${FONT_STACK};font-size:16px;line-height:1.6;color:${TEXT};">${html}</p>`;
}

/** Small, de-emphasised text — legal notes, "if you didn't request this" lines. */
export function muted(html: string): string {
  return `<p style="margin:0 0 12px;font-family:${FONT_STACK};font-size:13px;line-height:1.6;color:${MUTED};">${html}</p>`;
}

/**
 * A call-to-action button.
 *
 * The MSO conditional draws a VML rounded rectangle because Outlook ignores
 * `border-radius` and padding on anchors; other clients skip it and render the
 * plain anchor underneath.
 */
export function button(label: string, url: string, color = BRAND_COLORS.navy): string {
  const href = safeUrl(url);
  const text = escapeHtml(label);
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
      <tr>
        <td align="center" bgcolor="${color}" style="border-radius:999px;">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
            href="${href}" style="height:44px;v-text-anchor:middle;width:240px;" arcsize="50%" stroke="f" fillcolor="${color}">
            <w:anchorlock/>
            <center style="color:#ffffff;font-family:${FONT_STACK};font-size:16px;font-weight:bold;">${text}</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-- -->
          <a href="${href}" style="display:inline-block;padding:13px 32px;font-family:${FONT_STACK};font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;background-color:${color};">${text}</a>
          <!--<![endif]-->
        </td>
      </tr>
    </table>`;
}

/** A tinted panel for supporting detail — a summary of what was submitted, diagnostics, etc. */
export function panel(html: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
      <tr>
        <td style="padding:16px 20px;background-color:${BRAND_COLORS.paper};border-radius:12px;font-family:${FONT_STACK};font-size:14px;line-height:1.6;color:${TEXT};">${html}</td>
      </tr>
    </table>`;
}

/** Label/value rows inside a {@link panel}. Both sides are escaped here. */
export function detailRows(rows: { label: string; value: string }[]): string {
  const cells = rows
    .map(
      r => `
      <tr>
        <td style="padding:4px 12px 4px 0;font-family:${FONT_STACK};font-size:14px;color:${MUTED};white-space:nowrap;">${escapeHtml(r.label)}</td>
        <td style="padding:4px 0;font-family:${FONT_STACK};font-size:14px;color:${TEXT};font-weight:600;">${escapeHtml(r.value)}</td>
      </tr>`
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0">${cells}</table>`;
}

/** A horizontal rule that survives Outlook (which collapses styled `<hr>`). */
export function divider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px;"><tr><td style="border-top:1px solid ${BORDER};font-size:0;line-height:0;">&nbsp;</td></tr></table>`;
}

/* ── Layout ───────────────────────────────────────────────────────────── */

export interface RenderEmailOptions {
  /** `<title>`, and the fallback subject line shown by some clients. */
  title: string;
  /**
   * Inbox preview text, shown next to the subject before the message is opened.
   * Without one, clients fall back to scraping the first visible text — usually
   * the logo alt text. Always set it; keep it under ~90 characters.
   */
  preheader: string;
  /** The `<h1>` at the top of the card. */
  heading: string;
  /** Body HTML, composed from the block helpers above. */
  body: string;
  /**
   * `transactional` mail (password resets, receipts) legitimately has no
   * unsubscribe — the recipient asked for it by acting. `marketing` mail must
   * carry one, and {@link unsubscribeUrl} becomes required for it.
   */
  kind?: "transactional" | "marketing";
  unsubscribeUrl?: string;
}

/** Wraps composed body HTML in the branded, client-safe shell. */
export function renderEmail({
  title,
  preheader,
  heading,
  body,
  kind = "transactional",
  unsubscribeUrl,
}: RenderEmailOptions): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style type="text/css">
    /* Clients that keep <style> get the niceties; the inline styles carry the rest. */
    body { margin:0 !important; padding:0 !important; width:100% !important; }
    table { border-collapse:collapse; }
    img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    a { color:${BRAND_COLORS.blue}; }
    /* Stop iOS/Gmail auto-linking phone numbers and addresses into blue text. */
    a[x-apple-data-detectors] { color:inherit !important; text-decoration:none !important; }
    @media only screen and (max-width:600px) {
      .container { width:100% !important; }
      .gutter { padding-left:20px !important; padding-right:20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND_COLORS.paper};">
  <!-- Preheader: shown in the inbox list, hidden once the message is open. -->
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${escapeHtml(preheader)}
    <!-- Padding stops the client from pulling body copy into the preview. -->
    ${"&#847;&zwnj;&nbsp;".repeat(60)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND_COLORS.paper};">
    <tr>
      <td align="center" style="padding:32px 12px;">

        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:0 0 24px;">
              <a href="${SITE_URL}" style="text-decoration:none;">
                <img src="${SITE_LOGO_URL}" width="140" alt="${escapeHtml(SITE_LEGAL_NAME)}" style="display:block;width:140px;max-width:140px;height:auto;" />
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td class="gutter" style="padding:36px 40px;background-color:#ffffff;border-radius:20px;border:1px solid ${BORDER};">
              <h1 style="margin:0 0 20px;font-family:${FONT_STACK};font-size:24px;line-height:1.3;font-weight:700;color:${BRAND_COLORS.navy};">${escapeHtml(heading)}</h1>
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="gutter" style="padding:28px 40px 8px;text-align:center;">
              <p style="margin:0 0 10px;font-family:${FONT_STACK};font-size:14px;font-weight:600;color:${BRAND_COLORS.navy};">${escapeHtml(SITE_LEGAL_NAME)}</p>
              <p style="margin:0 0 14px;font-family:${FONT_STACK};font-size:13px;line-height:1.6;color:${MUTED};">
                ${escapeHtml(SITE_TAGLINE)}<br />
                ${escapeHtml(CONTACT_ADDRESS)}
              </p>
              <p style="margin:0 0 14px;font-family:${FONT_STACK};font-size:13px;line-height:1.6;color:${MUTED};">
                <a href="mailto:${CONTACT_EMAIL}" style="color:${MUTED};text-decoration:underline;">${escapeHtml(CONTACT_EMAIL)}</a>
                &nbsp;·&nbsp;
                <a href="${WHATSAPP_URL}" style="color:${MUTED};text-decoration:underline;">${escapeHtml(CONTACT_PHONE)}</a>
                &nbsp;·&nbsp;
                <a href="${SITE_URL}" style="color:${MUTED};text-decoration:underline;">${escapeHtml(SITE_NAME)}</a>
              </p>
              <p style="margin:0 0 14px;font-family:${FONT_STACK};font-size:13px;color:${MUTED};">
                <a href="${FACEBOOK_URL}" style="color:${MUTED};text-decoration:underline;">Facebook</a>
                &nbsp;·&nbsp;
                <a href="${WHATSAPP_URL}" style="color:${MUTED};text-decoration:underline;">WhatsApp</a>
              </p>
              ${footerNote(kind, unsubscribeUrl)}
              <p style="margin:0;font-family:${FONT_STACK};font-size:12px;color:#9ca3af;">
                © ${new Date().getFullYear()} ${escapeHtml(SITE_LEGAL_NAME)}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function footerNote(kind: "transactional" | "marketing", unsubscribeUrl?: string): string {
  const style = `margin:0 0 10px;font-family:${FONT_STACK};font-size:12px;line-height:1.6;color:#9ca3af;`;

  if (kind === "marketing" && unsubscribeUrl) {
    return `<p style="${style}">
      You're receiving this because you registered or subscribed at ${escapeHtml(SITE_NAME)}.<br />
      <a href="${safeUrl(unsubscribeUrl)}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a> to stop receiving these emails.
    </p>`;
  }
  return `<p style="${style}">This is an automated service message about your ${escapeHtml(SITE_NAME)} account.</p>`;
}

/* ── Plain-text alternative ───────────────────────────────────────────── */

/**
 * Derives the `text/plain` half of the multipart message from the rendered HTML.
 *
 * An HTML-only email is a spam-filter signal (and unreadable in text-only
 * clients and some screen readers), so every send carries both parts. Deriving
 * rather than hand-writing keeps the two from drifting apart.
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(head|style|script|title)[\s\S]*?<\/\1>/gi, "")
    // Drop the hidden preheader block — it's inbox-preview padding, not content.
    .replace(/<div style="display:none[\s\S]*?<\/div>/gi, "")
    // Images become their alt text, so the logo anchor reads as the brand name
    // rather than a bare URL on the first line.
    .replace(/<img\b[^>]*\balt="([^"]*)"[^>]*>/gi, "$1")
    .replace(/<img\b[^>]*>/gi, "")
    // Keep the destination of every link visible.
    .replace(/<a\b[^>]*href="(mailto:)?([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, _mailto, href, label) => {
      const text = label.replace(/<[^>]+>/g, "").trim();
      if (!href || href === "#") return text;
      return text && !href.includes(text) ? `${text} (${href})` : href;
    })
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h1|h2|h3|tr|div|table)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&zwnj;|&#847;/gi, "")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&middot;|·/g, "-")
    .split("\n")
    .map(line => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
