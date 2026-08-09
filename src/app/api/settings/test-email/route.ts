import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { buildCredentials, mergeBrevoInput, sendTestEmail } from "@/lib/brevo";
import { logActivity } from "@/lib/activity-log";
import { enforceRateLimit } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sends a one-off diagnostic email using the Brevo config currently on screen
 * in the admin settings form (falling back to what's saved), so delivery can
 * be verified without waiting for a real registration.
 */
export async function POST(req: NextRequest) {
  const session = await requireCapability("settings:manage");
  if (session instanceof NextResponse) return session;

  const limited = await enforceRateLimit("test-email", session.id, 10, 60 * 60);
  if (limited) return limited;

  const body = await req.json();
  const to = typeof body.email === "string" ? body.email.trim() : "";
  if (!EMAIL_RE.test(to)) {
    return NextResponse.json({ success: false, message: "Enter a valid email address" });
  }

  const settings = await getSettings();
  const config = mergeBrevoInput(
    settings.brevo,
    (body.data ?? {}) as Record<string, string | number | undefined>
  );
  const creds = buildCredentials(config);
  if (!creds) {
    return NextResponse.json({
      success: false,
      message: "Sender email plus SMTP login and key are required before sending a test",
    });
  }

  try {
    await sendTestEmail(creds, to);
    logActivity(session, "sent", "settings", "brevo-test-email");
    return NextResponse.json({ success: true, message: `Test email sent to ${to}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send test email";
    return NextResponse.json({ success: false, message: `SMTP error: ${message}` });
  }
}
