import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { ADMIN_COOKIE_NAME } from "@/config/site";

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
      // Authentication only — deliberately not authorisation.
      //
      // The proxy runs on the edge and can only read the JWT, whose `role` is
      // frozen for the token's 7-day life. Gating pages on it is wrong in both
      // directions: a just-promoted admin would be bounced from a page they
      // now qualify for, and a demoted one would keep reaching pages they no
      // longer should. Role checks therefore live in the server layouts
      // (`requirePageCapability`) and route handlers (`requireCapability`),
      // which read the database.
      await jwtVerify(token, SECRET);
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
