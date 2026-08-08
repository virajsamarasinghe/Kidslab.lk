import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { ADMIN_COOKIE_NAME } from "@/config/site";
import { can, capabilityForAdminPath } from "@/lib/roles";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// Admin dashboard keeps its own JWT-cookie auth — unrelated to Clerk, which
// only handles sign-in/sign-up for regular site visitors.
const withClerk = clerkMiddleware(async (_auth, request) => {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    try {
      const { payload } = await jwtVerify(token, SECRET);
      const role = payload.role as string | undefined;

      // A valid token for a role that can't see this page: send them to the
      // dashboard root rather than /login, which would look like a session
      // failure and tempt them to re-authenticate pointlessly.
      const required = capabilityForAdminPath(pathname);
      if (required && !can(role, required)) {
        const fallback = can(role, "dashboard:read") ? "/admin" : "/login";
        if (pathname !== fallback) {
          return NextResponse.redirect(new URL(fallback, request.url));
        }
        return NextResponse.redirect(new URL("/login", request.url));
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
