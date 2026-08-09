import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { enforceRateLimit, clientIp } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity-log";
import { validatePassword } from "@/lib/password";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Completes a reset: verifies the token, applies the new password, ends all sessions. */
export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit("reset-password", clientIp(req), 10, 60 * 60);
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!token) {
    return NextResponse.json({ error: "This reset link is invalid" }, { status: 400 });
  }

  await connectDB();
  const record = await PasswordResetToken.findOne({ tokenHash: hashToken(token) });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This reset link has expired or already been used" },
      { status: 400 }
    );
  }

  const user = await User.findById(record.userId);
  if (!user) {
    return NextResponse.json({ error: "This reset link is invalid" }, { status: 400 });
  }

  const policy = validatePassword(password, [user.email, user.name]);
  if (!policy.valid) {
    return NextResponse.json({ error: policy.error }, { status: 400 });
  }

  user.password = await bcrypt.hash(password, 10);
  // Ends every existing session, so a reset after a compromise actually evicts
  // whoever was signed in. Also clears any lockout the attacker's guessing caused.
  user.passwordChangedAt = new Date();
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  await user.save();

  record.usedAt = new Date();
  await record.save();

  logActivity({ email: user.email }, "reset password", "auth", String(user._id), {
    ip: clientIp(req),
  });

  return NextResponse.json({ success: true });
}
