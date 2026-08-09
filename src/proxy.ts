import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { ADMIN_COOKIE_NAME } from "@/config/site";
import { SESSION_IDLE_SECONDS, SESSION_ABSOLUTE_SECONDS } from "@/lib/session-config";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// Admin dashboard keeps its own JWT-cookie auth — unrelated to Clerk, which
// only handles sign-in/sign-up for regular site visitors.
/** Methods that can change state, and so need CSRF protection. */
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Endpoints signed by their sender rather than protected by same-origin rules.
 * The Clerk webhook arrives from Svix with no `Origin`, and is verified by
 * signature inside the handler. PayHere's payment notification is the same
 * shape: a server-to-server POST carrying no session, authenticated by the
 * `md5sig` checksum the handler recomputes.
 */
const CSRF_EXEMPT_PATHS = ["/api/webhooks", "/api/payments/notify"];

/**
 * Rejects cross-site state-changing requests by checking `Origin` against the
 * host actually serving the request.
 *
 * This is OWASP's origin-verification defence. It's used instead of synchroniser
 * tokens because it needs no per-form token plumbing, and it composes with the
 * session cookie's `sameSite: lax` rather than replacing it.
 *
 * A missing `Origin` is allowed: browsers omit it on same-origin GETs and on
 * some legitimate non-browser clients, and every mutating route is separately
 * behind a session check.
 */
function isCrossSiteRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return false;

  try {
    return new URL(origin).host !== host;
  } catch {
    // An unparseable Origin is not something a real browser sends.
    return true;
  }
}

const withClerk = clerkMiddleware(async (_auth, request) => {
  const { pathname } = request.nextUrl;

  if (
    MUTATING_METHODS.has(request.method) &&
    pathname.startsWith("/api") &&
    !CSRF_EXEMPT_PATHS.some(exempt => pathname.startsWith(exempt)) &&
    isCrossSiteRequest(request)
  ) {
    return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
  }

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    try {
      // Authentication only — deliberately not authorisation.
      //
      // The proxy runs on the edge and can only read the JWT, whose `role` is
      // frozen for the token's life. Gating pages on it is wrong in both
      // directions: a just-promoted admin would be bounced from a page they
      // now qualify for, and a demoted one would keep reaching pages they no
      // longer should. Role checks therefore live in the server layouts
      // (`requirePageCapability`) and route handlers (`requireCapability`),
      // which read the database.
      const { payload } = await jwtVerify(token, SECRET);

      // Sliding session: refresh the cookie once the token is past its
      // halfway point, so continued use keeps the admin signed in while a
      // genuine idle gap still expires the cookie. Re-signing on every request
      // would mean a JWT signature per navigation for no benefit.
      const issuedAt = typeof payload.iat === "number" ? payload.iat : 0;
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (issuedAt && nowSeconds - issuedAt > SESSION_IDLE_SECONDS / 2) {
        const authTime = typeof payload.authTime === "number" ? payload.authTime : issuedAt;

        // The absolute cap is measured from first sign-in, so renewal can't
        // extend a session indefinitely.
        if (nowSeconds - authTime < SESSION_ABSOLUTE_SECONDS) {
          const renewed = await new SignJWT({
            id: String(payload.id),
            email: String(payload.email),
            role: String(payload.role),
            authTime,
          })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("7d")
            .sign(SECRET);

          const res = NextResponse.next();
          res.cookies.set(ADMIN_COOKIE_NAME, renewed, {
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: SESSION_IDLE_SECONDS,
          });
          return res;
        }
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
});

export function proxy(request: NextRequest, event: Parameters<typeof withClerk>[1]) {
  return withClerk(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
