import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { getBrevoCredentials, sendEmail } from "@/lib/brevo";
import { previewEmailTemplate, mergeEmailTemplates } from "@/lib/email-templates";
import {
  EMAIL_TEMPLATE_KEYS,
  EMAIL_TEMPLATE_META,
  type EmailTemplateContent,
  type EmailTemplateKey,
} from "@/config/email-templates";
import { logActivity } from "@/lib/activity-log";
import { enforceRateLimit } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Delivers the template currently on screen — including unsaved edits — to a
 * real inbox, filled with the sample data from `EMAIL_TEMPLATE_META`.
 *
 * The in-browser preview is rendered by the same `previewEmailTemplate` used
 * here, so this isn't about seeing the layout again; it's the only way to check
 * what Gmail, Outlook and Apple Mail actually do with it. Body copy is taken
 * from the request rather than the database on purpose — reviewing a draft
 * shouldn't require publishing it first.
 */
export async function POST(req: NextRequest) {
  const session = await requireCapability("settings:manage");
  if (session instanceof NextResponse) return session;

  const limited = await enforceRateLimit("email-template-test", session.id, 20, 60 * 60);
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const key = body.key as EmailTemplateKey;
  if (!EMAIL_TEMPLATE_KEYS.includes(key)) {
    return NextResponse.json({ success: false, message: "Unknown template" });
  }

  const to = typeof body.email === "string" ? body.email.trim() : "";
  if (!EMAIL_RE.test(to)) {
    return NextResponse.json({ success: false, message: "Enter a valid email address" });
  }

  const creds = await getBrevoCredentials();
  if (!creds) {
    return NextResponse.json({
      success: false,
      message: "Brevo isn't configured yet — set it up under Settings → Brevo Email",
    });
  }

  // Through the merge so a draft with a blanked subject still sends something
  // valid, exactly as the real send path would treat it.
  const content = mergeEmailTemplates({
    [key]: (body.content ?? {}) as Partial<EmailTemplateContent>,
  })[key];
  const { subject, html } = previewEmailTemplate(key, content);

  try {
    await sendEmail(creds, {
      to,
      subject: `[TEST] ${subject}`,
      html,
      // Always transactional: this goes to one admin who asked for it, and
      // tagging a preview as bulk would put it behind the marketing filters.
      kind: "transactional",
    });
    logActivity(session, "sent", "settings", `email-template-test:${key}`);
    return NextResponse.json({
      success: true,
      message: `${EMAIL_TEMPLATE_META[key].label} preview sent to ${to}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send";
    return NextResponse.json({ success: false, message: `SMTP error: ${message}` });
  }
}
