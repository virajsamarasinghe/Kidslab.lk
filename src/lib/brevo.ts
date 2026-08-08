import { SITE_NAME, SITE_URL } from "@/config/site";
import { getSettings } from "@/lib/settings";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface BrevoCredentials {
  apiKey: string;
  senderEmail: string;
  senderName: string;
}

export async function getBrevoCredentials(): Promise<BrevoCredentials | null> {
  const settings = await getSettings();
  const apiKey = settings.brevo.apiKey || process.env.BREVO_API_KEY;
  const senderEmail = settings.brevo.senderEmail || process.env.BREVO_SENDER_EMAIL;
  const senderName = settings.brevo.senderName || process.env.BREVO_SENDER_NAME || SITE_NAME;
  if (!apiKey || !senderEmail) return null;
  return { apiKey, senderEmail, senderName };
}

/** Sends a single transactional/marketing email via Brevo using saved (or env) credentials. */
export async function sendEmail(
  creds: BrevoCredentials,
  { to, name, subject, html }: { to: string; name?: string; subject: string; html: string }
) {
  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": creds.apiKey,
    },
    body: JSON.stringify({
      sender: { name: creds.senderName, email: creds.senderEmail },
      to: [{ email: to, name: name || to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Brevo API error (${res.status}): ${errorBody}`);
  }
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
