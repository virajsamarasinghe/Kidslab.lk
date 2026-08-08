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

export async function getBrevoCredentials(): Promise<BrevoCredentials | null> {
  const settings = await getSettings();
  const senderEmail = settings.brevo.senderEmail || process.env.BREVO_SENDER_EMAIL;
  const senderName = settings.brevo.senderName || process.env.BREVO_SENDER_NAME || SITE_NAME;
  const smtp = resolveSmtp(settings.brevo);

  if (!senderEmail || !smtp) return null;
  return { senderEmail, senderName, smtp };
}

function resolveSmtp(brevo: {
  smtpUser?: string;
  smtpKey?: string;
  smtpHost?: string;
  smtpPort?: number;
}): BrevoSmtpCredentials | null {
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

interface SendWelcomeEmailParams {
  name: string;
  email: string;
}

export async function sendWelcomeEmail({ name, email }: SendWelcomeEmailParams) {
  const creds = await getBrevoCredentials();
  if (!creds) {
    console.warn("[brevo] No Brevo API key/sender configured — skipping welcome email");
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
