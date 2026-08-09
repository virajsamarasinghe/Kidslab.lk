import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { signToken, COOKIE, sessionCookieOptions, SESSION_IDLE_SECONDS } from "@/lib/auth";
import User from "@/models/User";
import { ADMIN_ROLES } from "@/lib/roles";
import { enforceRateLimit, clientIp } from "@/lib/rate-limit";
import { verifyToken, consumeRecoveryCode } from "@/lib/two-factor";
import { logActivity } from "@/lib/activity-log";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(req: NextRequest) {
  try {
    // Per-IP, in addition to the per-account lockout below: the lockout alone
    // does nothing against an attacker spraying one guess across many accounts.
    const ipLimited = await enforceRateLimit("login-ip", clientIp(req), 20, 15 * 60);
    if (ipLimited) return ipLimited;

    const { email, password, twoFactorCode } = await req.json();
    await connectDB();

    // Seed the first super admin if no dashboard account exists yet.
    const adminExists = await User.findOne({ role: { $in: ADMIN_ROLES } });
    if (!adminExists) {
      const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD!, 10);
      await User.create({
        name: "Admin",
        email: process.env.ADMIN_EMAIL!,
        password: hashed,
        role: "super_admin",
        status: "active",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      role: { $in: ADMIN_ROLES },
    }).select("+twoFactorSecret +twoFactorRecoveryCodes");
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // A deactivated admin keeps their role but loses dashboard access.
    if (user.status !== "active") {
      return NextResponse.json({ error: "This account has been deactivated" }, { status: 403 });
    }

    // Lockout is checked before the password compare, so a locked account
    // gives an attacker no signal about whether a guess was correct.
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` },
        { status: 429 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      // Counted in the database rather than in memory: the dashboard runs on
      // serverless instances that don't share state, so an in-process counter
      // would reset itself constantly and never actually throttle anyone.
      user.failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60_000);
        user.failedLoginAttempts = 0;
      }
      await user.save();
      logActivity(
        { email: user.email },
        user.lockedUntil ? "locked out" : "failed login",
        "auth",
        String(user._id),
        { ip: clientIp(req) }
      );
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Password is correct — now the second factor, if the account has one.
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const code = String(twoFactorCode ?? "").trim();

      // Signals the client to show the code field instead of reporting a
      // failure, so the password step doesn't look broken.
      if (!code) {
        return NextResponse.json({ twoFactorRequired: true }, { status: 401 });
      }

      const codeValid = verifyToken(code, user.twoFactorSecret);
      let usedRecoveryCode = false;

      if (!codeValid) {
        const remaining = await consumeRecoveryCode(code, user.twoFactorRecoveryCodes ?? []);
        if (!remaining) {
          // A wrong second factor counts toward lockout exactly like a wrong
          // password, so the code can't be brute-forced independently.
          user.failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1;
          if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
            user.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60_000);
            user.failedLoginAttempts = 0;
          }
          await user.save();
          logActivity({ email: user.email }, "failed 2FA", "auth", String(user._id), {
            ip: clientIp(req),
          });
          return NextResponse.json(
            { error: "That code isn't valid", twoFactorRequired: true },
            { status: 401 }
          );
        }
        user.twoFactorRecoveryCodes = remaining;
        usedRecoveryCode = true;
      }

      if (usedRecoveryCode) {
        logActivity({ email: user.email }, "used recovery code", "auth", String(user._id), {
          remaining: user.twoFactorRecoveryCodes.length,
          ip: clientIp(req),
        });
      }
    }

    if (user.failedLoginAttempts || user.lockedUntil || user.isModified()) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = undefined;
      await user.save();
    }

    const token = await signToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      // Pins the absolute session cap to this sign-in; sliding renewal in the
      // proxy refreshes `iat` but must never move this.
      authTime: Math.floor(Date.now() / 1000),
    });

    logActivity({ email: user.email }, "signed in", "auth", String(user._id), { ip: clientIp(req) });

    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE, token, sessionCookieOptions(SESSION_IDLE_SECONDS));
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
