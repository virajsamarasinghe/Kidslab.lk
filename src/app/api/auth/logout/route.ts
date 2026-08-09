import { NextResponse } from "next/server";
import { COOKIE, sessionCookieOptions, getAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function POST() {
  const session = await getAdminSession();
  if (session) logActivity(session, "signed out", "auth", session.id);

  const res = NextResponse.json({ success: true });
  // Attributes must match the ones used at login, or the browser keeps the
  // original cookie and the session survives the "logout".
  res.cookies.set(COOKIE, "", sessionCookieOptions(0));
  return res;
}
