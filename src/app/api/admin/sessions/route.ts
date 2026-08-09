import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireCapability, COOKIE, sessionCookieOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import User from "@/models/User";

/**
 * Signs the admin out of every device.
 *
 * Sets `sessionsRevokedAt`, which both guards compare against the token's
 * `iat` — so sessions on other browsers stop working on their next request
 * rather than lingering until the token expires. The current device's cookie
 * is cleared here too, since it's equally invalid now.
 */
export async function DELETE() {
  const guard = await requireCapability("dashboard:read");
  if (guard instanceof NextResponse) return guard;

  await connectDB();
  await User.findByIdAndUpdate(guard.id, { sessionsRevokedAt: new Date() });

  logActivity(guard, "signed out everywhere", "auth", guard.id);

  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE, "", sessionCookieOptions(0));
  return res;
}
