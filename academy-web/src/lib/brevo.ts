import { SITE_NAME, SITE_URL } from "@/config/site";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface SendWelcomeEmailParams {
  name: string;
  email: string;
}

export async function sendWelcomeEmail({ name, email }: SendWelcomeEmailParams) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME ?? SITE_NAME;

  if (!apiKey || !senderEmail) {
    console.warn("[brevo] BREVO_API_KEY or BREVO_SENDER_EMAIL not set — skipping welcome email");
    return;
  }

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email, name }],
      subject: `Welcome to ${SITE_NAME}!`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Welcome, ${name}!</h2>
          <p>Thanks for registering with ${SITE_NAME}. We're excited to have you on board.</p>
          <p>You can visit us anytime at <a href="${SITE_URL}">${SITE_URL}</a>.</p>
          <p>See you soon!</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Brevo API error (${res.status}): ${errorBody}`);
  }
}
