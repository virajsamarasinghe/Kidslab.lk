import { randomUUID } from "crypto";
import nodemailer, { type Transporter } from "nodemailer";
import { CONTACT_EMAIL, CONTACT_PHONE, SITE_LEGAL_NAME, SITE_NAME, SITE_URL } from "@/config/site";
import { getEmailTemplates, getSettings } from "@/lib/settings";
import { unsubscribeUrl } from "@/lib/email-optout";
import { htmlToText } from "@/lib/email-template";
import { renderEmailTemplate } from "@/lib/email-templates";

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
 * admin-form values) into usable credentials. Returns null when either the
 * sender or the SMTP login is incomplete.
 *
 * The config is the single source of truth — credentials come from Settings ->
 * Brevo Email in the dashboard, never from environment variables, so rotating a
 * key doesn't need a redeploy and every send path sees the same values.
 */
export function buildCredentials(brevo: BrevoConfigInput): BrevoCredentials | null {
  const senderEmail = brevo.senderEmail;
  const senderName = brevo.senderName || SITE_NAME;
  const smtp = resolveSmtp(brevo);

  if (!senderEmail || !smtp) return null;
  return { senderEmail, senderName, smtp };
}

/** Resolves just the SMTP half of a config — a sender address isn't needed to test the relay. */
export function resolveSmtp(brevo: BrevoConfigInput): BrevoSmtpCredentials | null {
  const user = brevo.smtpUser;
  const key = brevo.smtpKey;
  if (!user || !key) return null;
  return {
    host: brevo.smtpHost || DEFAULT_SMTP_HOST,
    port: Number(brevo.smtpPort) || DEFAULT_SMTP_PORT,
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


/**
 * The `{{siteName}}` / `{{contactPhone}}` family of placeholders, available to
 * every template. Kept here rather than in the config so the values come from
 * `@/config/site` at send time and can't go stale in the database.
 */
function commonVars(): Record<string, string> {
  return {
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
    legalName: SITE_LEGAL_NAME,
    contactPhone: CONTACT_PHONE,
  };
}

/** Sends a diagnostic email so an admin can confirm delivery end to end. */
export async function sendTestEmail(creds: BrevoCredentials, to: string) {
  const templates = await getEmailTemplates();
  const { subject, html } = renderEmailTemplate("smtpTest", templates.smtpTest, {
    ...commonVars(),
    sender: creds.senderEmail,
    relay: `${creds.smtp.host}:${creds.smtp.port}`,
  }, {
    rows: [
      { label: "Sender", value: creds.senderEmail },
      { label: "Relay", value: `${creds.smtp.host}:${creds.smtp.port}` },
      { label: "Sent at", value: new Date().toUTCString() },
    ],
  });

  await sendEmail(creds, { to, subject, html });
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
    console.warn("[brevo] No SMTP credentials/sender saved in Settings → Brevo Email — skipping welcome email");
    return;
  }

  const rows = [
    { label: "Name", value: name },
    { label: "Email", value: email },
    ...(phone ? [{ label: "Phone", value: phone }] : []),
    ...(interestedCourse ? [{ label: "Interested in", value: interestedCourse }] : []),
  ];

  const templates = await getEmailTemplates();
  const unsubscribe = unsubscribeUrl(email);
  const { subject, html } = renderEmailTemplate("welcome", templates.welcome, {
    ...commonVars(),
    name,
    email,
    phone: phone ?? "",
    course: interestedCourse ?? "",
  }, { rows, unsubscribeUrl: unsubscribe });

  await sendEmail(creds, {
    to: email,
    name,
    subject,
    html,
    kind: "marketing",
    unsubscribeUrl: unsubscribe,
  });
}

interface SendAdminInviteEmailParams {
  name: string;
  email: string;
  /** Plaintext — this is the only place it's ever visible outside the hash. */
  password: string;
  roleLabel: string;
}

/**
 * Notifies a newly created admin account of its login link, username and
 * one-time temporary password. The account is created with
 * `mustChangePassword: true`, so this password only ever needs to get them
 * through the door once.
 *
 * Returns whether the send succeeded, so the caller (which can't show the
 * password again after this) can warn the person who created the account if
 * it didn't go out.
 */
export async function sendAdminInviteEmail({
  name,
  email,
  password,
  roleLabel,
}: SendAdminInviteEmailParams): Promise<boolean> {
  const creds = await getBrevoCredentials();
  if (!creds) {
    console.warn("[brevo] No SMTP credentials/sender saved in Settings → Brevo Email — skipping admin invite email");
    return false;
  }

  const loginUrl = `${SITE_URL}/login`;
  const templates = await getEmailTemplates();
  const { subject, html } = renderEmailTemplate("adminInvite", templates.adminInvite, {
    ...commonVars(),
    name: name || "there",
    email,
    roleLabel,
    loginUrl,
  }, {
    // The temporary password is deliberately not exposed as a placeholder —
    // it belongs in the detail panel, not somewhere an edit could drop it.
    rows: [
      { label: "Login link", value: loginUrl },
      { label: "Email", value: email },
      { label: "Temporary password", value: password },
    ],
  });

  try {
    await sendEmail(creds, { to: email, name, subject, html });
    return true;
  } catch (err) {
    console.error("[brevo] admin invite email failed", err);
    return false;
  }
}
