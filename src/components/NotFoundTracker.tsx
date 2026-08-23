"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";

/**
 * Reports the URL that 404'd, once per view.
 *
 * The 404 page is statically served, so nothing on the server sees which
 * address was asked for — without this, a broken inbound link is invisible
 * until someone reports it. Sends the pathname alone: query strings are
 * where a stray email address would be, and GA4 must not receive one.
 */
export default function NotFoundTracker() {
  const pathname = usePathname();

  useEffect(() => {
    track("page_not_found", { path: pathname });
  }, [pathname]);

  return null;
}
