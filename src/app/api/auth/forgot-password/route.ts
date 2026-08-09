import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { connectDB } from "@/lib/mongodb";
import { enforceRateLimit, clientIp } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity-log";
import { getBrevoCredentials, sendEmail } from "@/lib/brevo";
import { button, divider, escapeHtml, muted, p, renderEmail } from "@/lib/email-template";
import { ADMIN_ROLES } from "@/lib/roles";
import { SITE_NAME, SITE_URL } from "@/config/site";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";

const TOKEN_TTL_MINUTES = 30;

/** Same hash used on verification — the plaintext is never stored. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Starts a password reset.
 *
 * Always responds 200 with the same body, whether or not the address belongs
 * to an admin. Reporting "no such account" would turn this into an oracle for
 * discovering which emails have dashboard access.
 */
export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit("forgot-password", clientIp(req), 5, 60 * 60);
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  const genericResponse = NextResponse.json({
    message: "If that email belongs to an admin account, a reset link is on its way.",
  });
  if (!email) return genericResponse;

  await connectDB();
  const user = await User.findOne({ email, role: { $in: ADMIN_ROLES }, status: "active" });
  if (!user) return genericResponse;

  const creds = await getBrevoCredentials();
  if (!creds) {
    // Surfaced in logs only — telling the client would leak that the account exists.
    console.error("[forgot-password] Brevo is not configured; cannot send reset email");
    return genericResponse;
  }

  // Invalidate any outstanding tokens so only the newest link works.
  await PasswordResetToken.deleteMany({ userId: user._id, usedAt: { $exists: false } });

  const token = randomBytes(32).toString("hex");
  await PasswordResetToken.create({
    userId: user._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000),
  });

  const link = `${SITE_URL}/reset-password?token=${token}`;
  try {
    const html = renderEmail({
      title: `Reset your ${SITE_NAME} admin password`,
      preheader: `Your password reset link expires in ${TOKEN_TTL_MINUTES} minutes.`,
      heading: "Reset your password",
      body: [
        p(`Hi ${escapeHtml(user.name || "there")},`),
        p(
          `We received a request to reset the password for your ${escapeHtml(SITE_NAME)} admin account. Click the button below to choose a new one.`
        ),
        button("Reset password", link),
        muted(
          `This link expires in <strong>${TOKEN_TTL_MINUTES} minutes</strong> and can only be used once.`
        ),
        muted(
          `If the button doesn't work, copy this address into your browser:<br /><span style="word-break:break-all;">${escapeHtml(link)}</span>`
        ),
        divider(),
        muted(
          "Didn't request this? You can safely ignore this email — your password won't change, and nobody can reset it without this link. If you keep receiving these, contact your administrator."
        ),
      ].join(""),
    });

    await sendEmail(creds, {
      to: user.email,
      name: user.name,
      subject: `Reset your ${SITE_NAME} admin password`,
      html,
    });
    logActivity({ email: user.email }, "requested password reset", "auth", String(user._id), {
      ip: clientIp(req),
    });
  } catch (err) {
    console.error("[forgot-password] send failed", err);
  }

  return genericResponse;
}
