import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { connectDB } from "@/lib/mongodb";
import { enforceRateLimit, clientIp } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity-log";
import { getBrevoCredentials, sendEmail } from "@/lib/brevo";
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
    await sendEmail(creds, {
      to: user.email,
      name: user.name,
      subject: `Reset your ${SITE_NAME} admin password`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Password reset</h2>
          <p>Hi ${user.name || "there"},</p>
          <p>Use the link below to set a new password for your ${SITE_NAME} admin account.
             It expires in ${TOKEN_TTL_MINUTES} minutes and can only be used once.</p>
          <p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#0f2418;color:#fff;border-radius:999px;text-decoration:none;">Reset password</a></p>
          <p style="color:#666;font-size:13px;">If the button doesn't work, paste this into your browser:<br>${link}</p>
          <p style="color:#666;font-size:13px;">If you didn't request this, you can ignore this email — your password won't change.</p>
        </div>
      `,
    });
    logActivity({ email: user.email }, "requested password reset", "auth", String(user._id), {
      ip: clientIp(req),
    });
  } catch (err) {
    console.error("[forgot-password] send failed", err);
  }

  return genericResponse;
}
