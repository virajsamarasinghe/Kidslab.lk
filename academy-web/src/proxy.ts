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
