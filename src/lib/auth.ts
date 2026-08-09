import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME } from "@/config/site";
import { can, type Capability, type Role } from "@/lib/roles";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE = ADMIN_COOKIE_NAME;

export async function signToken(payload: Record<string, string>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export interface AdminSession {
  id: string;
  email: string;
  role: Role;
}

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/**
 * Cookie attributes for the admin session, shared by login and logout so the
 * two always match — a clearing cookie whose attributes differ from the one
 * that was set is ignored by the browser, leaving the session live.
 *
 * `secure` is on outside development so the cookie is never sent over plain
 * HTTP; `sameSite: lax` keeps it off cross-site POSTs, which is what stands in
 * for CSRF tokens here.
 */
export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, SECRET);
  return payload as unknown as AdminSession & { iat?: number };
}

export async function getAdminSession(): Promise<(AdminSession & { iat?: number }) | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * True when this token predates the account's last password change.
 *
 * Changing a password has to end sessions that were opened with the old one —
 * otherwise a password reset after a compromise leaves the attacker signed in
 * for the rest of the token's 7-day life. `iat` is in seconds, so the stored
 * timestamp is floored to seconds before comparing.
 */
function isStaleSession(
  session: { iat?: number },
  passwordChangedAt: Date | undefined
): boolean {
  if (!passwordChangedAt || session.iat == null) return false;
  return session.iat < Math.floor(passwordChangedAt.getTime() / 1000);
}

/**
 * Route-handler guard. Returns the session when the caller holds `capability`,
 * otherwise a ready-to-return 401/403 response:
 *
 *     const guard = await requireCapability("content:write");
 *     if (guard instanceof NextResponse) return guard;
 *     // guard is a fully authorised AdminSession from here on
 *
 * The `instanceof` check is what makes this safe — an early `return` on the
 * failure branch is the only way past it, so a forgotten check is a type error
 * rather than a silent hole.
 *
 * The role is re-read from the database rather than taken from the token. The
 * JWT is fixed for 7 days, so trusting its `role` would let a demoted admin
 * keep their old permissions — and a revoked one keep access entirely — for up
 * to a week. The extra lookup rides on the already-open pooled connection.
 */
export async function requireCapability(
  capability: Capability
): Promise<AdminSession | NextResponse> {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(session.id)
    .select("email role status passwordChangedAt")
    .lean();
  if (!user || user.status !== "active" || isStaleSession(session, user.passwordChangedAt)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!can(user.role, capability)) {
    return NextResponse.json(
      { error: "You don't have permission to do that" },
      { status: 403 }
    );
  }

  return { id: session.id, email: user.email, role: user.role };
}

/**
 * Page guard for server components — redirects instead of returning a response.
 *
 * The proxy also gates these paths, but it runs on the edge and can only read
 * the JWT, which is fixed for 7 days. That makes it a fast first pass, not the
 * authority: a promotion wouldn't take effect (and a demotion wouldn't take
 * hold) until the token expired. This check reads the database, so it decides.
 */
export async function requirePageCapability(capability: Capability) {
  const session = await getAdminSession();
  if (!session) redirect("/login");

  await connectDB();
  const user = await User.findById(session.id)
    .select("email role status passwordChangedAt")
    .lean();
  if (!user || user.status !== "active" || isStaleSession(session, user.passwordChangedAt)) {
    redirect("/login");
  }
  if (!can(user.role, capability)) redirect("/admin");

  return { id: session.id, email: user.email, role: user.role };
}

export { COOKIE };
