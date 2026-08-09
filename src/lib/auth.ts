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

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, SECRET);
  return payload as unknown as AdminSession;
}

export async function getAdminSession(): Promise<AdminSession | null> {
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
  const user = await User.findById(session.id).select("email role status").lean();
  if (!user || user.status !== "active") {
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
  const user = await User.findById(session.id).select("email role status").lean();
  if (!user || user.status !== "active") redirect("/login");
  if (!can(user.role, capability)) redirect("/admin");

  return { id: session.id, email: user.email, role: user.role };
}

export { COOKIE };
