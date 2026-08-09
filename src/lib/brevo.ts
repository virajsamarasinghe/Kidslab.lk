import { randomUUID } from "crypto";
import nodemailer, { type Transporter } from "nodemailer";
import { CONTACT_EMAIL, CONTACT_PHONE, SITE_NAME, SITE_URL } from "@/config/site";
import { getSettings } from "@/lib/settings";
import { unsubscribeUrl } from "@/lib/email-optout";
import {
  button,
  detailRows,
  divider,
  escapeHtml,
  htmlToText,
  muted,
  p,
  panel,
  renderEmail,
} from "@/lib/email-template";

const DEFAULT_SMTP_HOST = "smtp-relay.brevo.com";
const DEFAULT_SMTP_PORT = 587;

export interface BrevoCredentials {
  senderEmail: string;
  senderName: string;
  smtp: BrevoSmtpCredentials;
}

export interface BrevoSmtpCredentials {
  host: string;
  port: number;
  user: string;
  key: string;
}

export interface BrevoConfigInput {
  senderEmail?: string;
  senderName?: string;
  smtpUser?: string;
  smtpKey?: string;
  smtpHost?: string;
  smtpPort?: number | string;
}

export async function getBrevoCredentials(): Promise<BrevoCredentials | null> {
  const settings = await getSettings();
  return buildCredentials(settings.brevo);
}

/**
 * Resolves a Brevo config (saved settings, optionally overlaid with unsaved
 * admin-form values) into usable credentials, falling back to env vars.
 * Returns null when either the sender or the SMTP login is incomplete.
 */
export function buildCredentials(brevo: BrevoConfigInput): BrevoCredentials | null {
  const senderEmail = brevo.senderEmail || process.env.BREVO_SENDER_EMAIL;
  const senderName = brevo.senderName || process.env.BREVO_SENDER_NAME || SITE_NAME;
  const smtp = resolveSmtp(brevo);

  if (!senderEmail || !smtp) return null;
  return { senderEmail, senderName, smtp };
}

/** Resolves just the SMTP half of a config — a sender address isn't needed to test the relay. */
export function resolveSmtp(brevo: BrevoConfigInput): BrevoSmtpCredentials | null {
  const user = brevo.smtpUser || process.env.BREVO_SMTP_USER;
  const key = brevo.smtpKey || process.env.BREVO_SMTP_KEY;
  if (!user || !key) return null;
  return {
    host: brevo.smtpHost || process.env.BREVO_SMTP_HOST || DEFAULT_SMTP_HOST,
    port: Number(brevo.smtpPort || process.env.BREVO_SMTP_PORT || DEFAULT_SMTP_PORT),
    user,
    key,
  };
}

/**
 * Overlays unsaved values from the admin settings form onto the stored config,
 * so "Test Connection" / "Send Test Email" exercise what's on screen rather
 * than what was last saved. A `smtpKey` still holding the masked placeholder
 * means the admin didn't retype it — fall back to the stored secret.
 */
export function mergeBrevoInput(
  stored: BrevoConfigInput,
  incoming: Record<string, string | number | undefined>
): BrevoConfigInput {
  const smtpKeyIn = incoming.smtpKey;
  const smtpKey =
    typeof smtpKeyIn === "string" && smtpKeyIn.includes("••••")
      ? stored.smtpKey
      : (smtpKeyIn as string | undefined) ?? stored.smtpKey;

  return {
    senderEmail: (incoming.senderEmail as string) || stored.senderEmail,
    senderName: (incoming.senderName as string) || stored.senderName,
    smtpUser: (incoming.smtpUser as string) || stored.smtpUser,
    smtpKey,
    smtpHost: (incoming.smtpHost as string) || stored.smtpHost,
    smtpPort: incoming.smtpPort || stored.smtpPort,
  };
}

/**
 * Builds a Brevo SMTP transporter.
 *
 * SMTP is the only transport here, deliberately. Brevo's "authorised IPs"
 * security setting applies to its HTTP API only, so REST calls from an
 * unlisted server IP are rejected with a 401 `unauthorized` even when the key
 * is perfectly valid — unworkable on hosts with rotating outbound IPs. The
 * SMTP relay isn't subject to that restriction.
 *
 * Port 587 is STARTTLS (`secure: false` — nodemailer upgrades the connection);
 * only port 465 is implicit TLS.
 */
export function createSmtpTransport(smtp: BrevoSmtpCredentials): Transporter {
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.key },
    // Pooled so a campaign blast reuses connections instead of opening a
    // fresh TCP+TLS handshake per recipient.
    pool: true,
    maxConnections: 3,
  });
}

/**
 * Cached per credential set — `sendEmail` is called once per recipient, and
 * building a new pool each time would defeat the pooling entirely.
 */
const transportCache = new Map<string, Transporter>();

function getSmtpTransport(smtp: BrevoSmtpCredentials): Transporter {
  const cacheKey = `${smtp.host}:${smtp.port}:${smtp.user}:${smtp.key}`;
  let transport = transportCache.get(cacheKey);
  if (!transport) {
    transport = createSmtpTransport(smtp);
    transportCache.set(cacheKey, transport);
  }
  return transport;
}

export interface SendEmailParams {
  to: string;
  name?: string;
  subject: string;
  /** Full HTML document, normally the output of `renderEmail`. */
  html: string;
  /**
   * Plain-text alternative. Derived from the HTML when omitted — an HTML-only
   * message scores worse with spam filters and is unreadable in text clients.
   */
  text?: string;
  /**
   * `marketing` mail must carry a working unsubscribe. Passing the kind here
   * (rather than inferring it) is what decides the List-Unsubscribe headers
   * and the `Precedence: bulk` marker.
   */
  kind?: "transactional" | "marketing";
  /** Required for `marketing`; ignored otherwise. */
  unsubscribeUrl?: string;
}

/**
 * Sends a single email through the Brevo SMTP relay with the headers a
 * reputable sender is expected to set:
 *
 * - `Reply-To` points at a monitored human inbox, since the Brevo sender
 *   address is usually a no-reply.
 * - `List-Unsubscribe` + `List-Unsubscribe-Post` give Gmail and Outlook the
 *   native one-click unsubscribe control. Since Feb 2024 both require it from
 *   bulk senders, and its absence pushes marketing mail toward spam.
 * - `Auto-Submitted` stops out-of-office autoresponders from replying to
 *   machine-generated mail (RFC 3834).
 * - `X-Entity-Ref-ID` is unique per message so Gmail stops collapsing
 *   same-subject sends (every "Welcome to kidslab.lk") into one thread and
 *   hiding the newest behind "show trimmed content".
 */
export async function sendEmail(
  creds: BrevoCredentials,
  { to, name, subject, html, text, kind = "transactional", unsubscribeUrl }: SendEmailParams
) {
  const headers: Record<string, string> = {
    "X-Entity-Ref-ID": randomUUID(),
  };

  if (kind === "marketing" && unsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${unsubscribeUrl}>, <mailto:${CONTACT_EMAIL}?subject=Unsubscribe>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
    headers["Precedence"] = "bulk";
  } else {
    headers["Auto-Submitted"] = "auto-generated";
  }

  await getSmtpTransport(creds.smtp).sendMail({
    from: { name: creds.senderName, address: creds.senderEmail },
    to: name ? { name, address: to } : to,
    replyTo: CONTACT_EMAIL,
    subject,
    html,
    text: text ?? htmlToText(html),
    headers,
  });
}

/** Sends a diagnostic email so an admin can confirm delivery end to end. */
export async function sendTestEmail(creds: BrevoCredentials, to: string) {
  const html = renderEmail({
    title: `${SITE_NAME} — SMTP test`,
    preheader: `Your ${SITE_NAME} email configuration is delivering correctly.`,
    heading: "SMTP is working",
    body: [
      p("This is a test message from the KidsLab admin dashboard. If you're reading it, outgoing email is configured correctly and delivering to real inboxes."),
      panel(
        detailRows([
          { label: "Sender", value: creds.senderEmail },
          { label: "Relay", value: `${creds.smtp.host}:${creds.smtp.port}` },
          { label: "Sent at", value: new Date().toUTCString() },
        ])
      ),
      muted("No action is needed. This message was triggered manually from Settings → Brevo Email."),
    ].join(""),
  });

  await sendEmail(creds, { to, subject: `${SITE_NAME} — SMTP test email`, html });
}

interface SendWelcomeEmailParams {
  name: string;
  email: string;
  /** Shown back to the registrant so they can confirm what we recorded. */
  phone?: string;
  interestedCourse?: string;
}

/**
 * Confirms a public seminar registration.
 *
 * Fire-and-forget at the call site — a mail outage must not fail the
 * registration itself — so failures are logged here rather than thrown.
 */
export async function sendWelcomeEmail({
  name,
  email,
  phone,
  interestedCourse,
}: SendWelcomeEmailParams) {
  const creds = await getBrevoCredentials();
  if (!creds) {
    console.warn("[brevo] No SMTP credentials/sender configured — skipping welcome email");
    return;
  }

  const rows = [
    { label: "Name", value: name },
    { label: "Email", value: email },
    ...(phone ? [{ label: "Phone", value: phone }] : []),
    ...(interestedCourse ? [{ label: "Interested in", value: interestedCourse }] : []),
  ];

  const html = renderEmail({
    title: `Welcome to ${SITE_NAME}`,
    preheader: "We've received your registration — here's what happens next.",
    heading: `Welcome, ${escapeHtml(name)}!`,
    kind: "marketing",
    unsubscribeUrl: unsubscribeUrl(email),
    body: [
      p("Thanks for registering with <strong>KidsLab Robotics &amp; AI Academy</strong>. We're delighted to have you with us."),
      p("Here's what we have on file:"),
      panel(detailRows(rows)),
      p("Our team will contact you shortly on WhatsApp or by phone to confirm your seminar slot and answer any questions."),
      button("Explore our courses", `${SITE_URL}/#courses`),
      divider(),
      muted(
        `Something not right? Just reply to this email or message us on WhatsApp at ${escapeHtml(CONTACT_PHONE)} and we'll fix it.`
      ),
    ].join(""),
  });

  await sendEmail(creds, {
    to: email,
    name,
    subject: `Welcome to ${SITE_NAME} — your registration is confirmed`,
    html,
    kind: "marketing",
    unsubscribeUrl: unsubscribeUrl(email),
  });
}
