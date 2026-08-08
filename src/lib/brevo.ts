import nodemailer, { type Transporter } from "nodemailer";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { getSettings } from "@/lib/settings";

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

/** Sends a single transactional/marketing email through the Brevo SMTP relay. */
export async function sendEmail(
  creds: BrevoCredentials,
  { to, name, subject, html }: { to: string; name?: string; subject: string; html: string }
) {
  await getSmtpTransport(creds.smtp).sendMail({
    from: { name: creds.senderName, address: creds.senderEmail },
    to: name ? { name, address: to } : to,
    subject,
    html,
  });
}

/** Sends a diagnostic email so an admin can confirm delivery end to end. */
export async function sendTestEmail(creds: BrevoCredentials, to: string) {
  await sendEmail(creds, {
    to,
    subject: `${SITE_NAME} — SMTP test email`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>SMTP is working</h2>
        <p>This is a test email from the ${SITE_NAME} admin dashboard.</p>
        <p style="color:#666;font-size:13px;">
          Sent from <strong>${creds.senderEmail}</strong>
          via ${creds.smtp.host}:${creds.smtp.port}.
        </p>
      </div>
    `,
  });
}

interface SendWelcomeEmailParams {
  name: string;
  email: string;
}

export async function sendWelcomeEmail({ name, email }: SendWelcomeEmailParams) {
  const creds = await getBrevoCredentials();
  if (!creds) {
    console.warn("[brevo] No SMTP credentials/sender configured — skipping welcome email");
    return;
  }

  await sendEmail(creds, {
    to: email,
    name,
    subject: `Welcome to ${SITE_NAME}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Welcome, ${name}!</h2>
        <p>Thanks for registering with ${SITE_NAME}. We're excited to have you on board.</p>
        <p>You can visit us anytime at <a href="${SITE_URL}">${SITE_URL}</a>.</p>
        <p>See you soon!</p>
      </div>
    `,
  });
}
