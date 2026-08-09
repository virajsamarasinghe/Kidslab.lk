import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { requireCapability } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  buildQrDataUrl, generateRecoveryCodes, generateSecret, verifyToken,
} from "@/lib/two-factor";
import User from "@/models/User";

/** Current 2FA state for the signed-in admin. */
export async function GET() {
  const guard = await requireCapability("dashboard:read");
  if (guard instanceof NextResponse) return guard;

  await connectDB();
  const user = await User.findById(guard.id)
    .select("twoFactorEnabled twoFactorRecoveryCodes")
    .lean();

  return NextResponse.json({
    enabled: Boolean(user?.twoFactorEnabled),
    recoveryCodesRemaining: user?.twoFactorRecoveryCodes?.length ?? 0,
  });
}

/**
 * Enrolment, step one: mint a secret and return a QR code.
 *
 * The secret is stored immediately but `twoFactorEnabled` stays false until a
 * code is verified in step two — otherwise a half-finished enrolment would
 * lock the admin out of their own account.
 */
export async function POST() {
  const guard = await requireCapability("dashboard:read");
  if (guard instanceof NextResponse) return guard;

  await connectDB();
  const user = await User.findById(guard.id).select("email twoFactorEnabled");
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.twoFactorEnabled) {
    return NextResponse.json(
      { error: "Two-factor is already enabled — disable it first to re-enrol" },
      { status: 409 }
    );
  }

  const secret = generateSecret();
  user.twoFactorSecret = secret;
  await user.save();

  return NextResponse.json({
    qr: await buildQrDataUrl(user.email, secret),
    // Shown so the admin can type it in if they can't scan.
    secret,
  });
}

/**
 * Enrolment, step two: confirm a code from the app, then activate and hand
 * back the one-time recovery codes.
 */
export async function PUT(req: NextRequest) {
  const guard = await requireCapability("dashboard:read");
  if (guard instanceof NextResponse) return guard;

  const limited = await enforceRateLimit("2fa-verify", guard.id, 10, 15 * 60);
  if (limited) return limited;

  const { token } = await req.json();

  await connectDB();
  const user = await User.findById(guard.id).select("+twoFactorSecret twoFactorEnabled email");
  if (!user?.twoFactorSecret) {
    return NextResponse.json({ error: "Start enrolment first" }, { status: 400 });
  }
  if (!verifyToken(String(token ?? ""), user.twoFactorSecret)) {
    return NextResponse.json({ error: "That code isn't valid — try the next one" }, { status: 400 });
  }

  const { plain, hashed } = await generateRecoveryCodes();
  user.twoFactorEnabled = true;
  user.twoFactorRecoveryCodes = hashed;
  await user.save();

  logActivity(guard, "enabled 2FA", "admin", guard.id);

  // The only time the plaintext codes ever leave the server.
  return NextResponse.json({ enabled: true, recoveryCodes: plain });
}

/**
 * Disables 2FA. Requires the current password — otherwise anyone who found an
 * unlocked session could strip the second factor off the account.
 */
export async function DELETE(req: NextRequest) {
  const guard = await requireCapability("dashboard:read");
  if (guard instanceof NextResponse) return guard;

  const limited = await enforceRateLimit("2fa-disable", guard.id, 10, 15 * 60);
  if (limited) return limited;

  const { password } = await req.json().catch(() => ({}));

  await connectDB();
  const user = await User.findById(guard.id).select("password twoFactorEnabled");
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!password || !(await bcrypt.compare(String(password), user.password))) {
    return NextResponse.json({ error: "Password is incorrect" }, { status: 401 });
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.twoFactorRecoveryCodes = [];
  await user.save();

  logActivity(guard, "disabled 2FA", "admin", guard.id);
  return NextResponse.json({ enabled: false });
}
